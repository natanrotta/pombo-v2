import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
  proto,
} from "@whiskeysockets/baileys";
import type { WASocket } from "@whiskeysockets/baileys";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import type { DomainMessageStatus } from "@shared/provider/domain-event-bus.interface";
import { SendTextResult } from "@modules/devices/domain/provider/whatsapp-gateway.interface";
import { ServiceUnavailableError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { makePrismaAuthState } from "./prisma-auth-state";
import { baseSocketConfig } from "./socket-config";

export interface SessionManagerConfig {
  reconnectBaseDelayMs: number;
  reconnectMaxDelayMs: number;
}

export interface SessionManagerDeps {
  bus: IDomainEventBus;
  logger: ILoggerProvider;
  config: SessionManagerConfig;
  /** Resolves an outbox row's original text from a waMessageId (Baileys
   *  getMessage) — injected so `devices` doesn't import `messaging`. */
  resolveOutboxText: (waMessageId: string) => Promise<string | null>;
}

export interface SessionManager {
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  logout(deviceId: string): Promise<void>;
  isConnected(deviceId: string): boolean;
  resolveJid(deviceId: string, phone: string): Promise<string | null>;
  sendText(
    deviceId: string,
    jid: string,
    text: string,
  ): Promise<SendTextResult>;
  closeAll(): void;
}

// The Baileys close error is a Boom; read its status code structurally so we
// don't take a direct @hapi/boom dependency.
const closeStatusCode = (error: unknown): number | undefined =>
  (error as { output?: { statusCode?: number } } | undefined)?.output
    ?.statusCode;

const S = proto.WebMessageInfo.Status;
const mapMessageStatus = (
  status: number | null | undefined,
): DomainMessageStatus | null => {
  switch (status) {
    case S.SERVER_ACK:
      return "SERVER_ACK";
    case S.DELIVERY_ACK:
      return "DELIVERY_ACK";
    case S.READ:
    case S.PLAYED:
      return "READ";
    case S.ERROR:
      return "FAILED";
    default:
      return null;
  }
};

// Owner of everything alive: the Map<deviceId, socket>. Translates the Baileys
// `sock.ev` stream into DomainEvents on the bus and carries NO business rule
// (that lives in the handle-session-* use cases). This file, socket-config.ts,
// and prisma-auth-state.ts are the only places Baileys types appear.
export const makeSessionManager = (
  deps: SessionManagerDeps,
): SessionManager => {
  const sockets = new Map<string, WASocket>();
  const openDevices = new Set<string>();
  const pending = new Set<string>();
  let shuttingDown = false;

  let cachedVersion:
    | Awaited<ReturnType<typeof fetchLatestBaileysVersion>>["version"]
    | undefined;
  const resolveVersion = async (): Promise<typeof cachedVersion> => {
    if (!cachedVersion)
      cachedVersion = (await fetchLatestBaileysVersion()).version;
    return cachedVersion;
  };

  const openSocket = async (deviceId: string, attempt = 0): Promise<void> => {
    // Reserve the slot SYNCHRONOUSLY, before any await. Otherwise two concurrent
    // opens both pass the `sockets.has` check and create a socket on the SAME
    // authState — two sockets, one Signal key store → corruption. Also bail if
    // shutting down: a reconnect timer must not resurrect a socket after
    // closeAll().
    if (shuttingDown || sockets.has(deviceId) || pending.has(deviceId)) return;
    pending.add(deviceId);

    try {
      const { state, saveCreds } = await makePrismaAuthState(deviceId);
      const version = await resolveVersion();
      const sock = makeWASocket({
        ...baseSocketConfig,
        auth: state,
        version,
        getMessage: async (key: { id?: string | null }) => {
          const text = key.id ? await deps.resolveOutboxText(key.id) : null;
          return text ? { conversation: text } : undefined;
        },
      });
      sockets.set(deviceId, sock);

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on(
        "messages.update",
        (
          updates: Array<{
            key: { id?: string | null };
            update: { status?: number | null };
          }>,
        ) => {
          for (const { key, update } of updates) {
            const raw = update.status;
            const status = mapMessageStatus(raw);
            if (status && key.id) {
              deps.bus.publish({
                type: "session.message_status",
                deviceId,
                waMessageId: key.id,
                status,
              });
            } else if (raw != null && raw !== S.PENDING) {
              deps.logger.warn(
                { deviceId, status: raw },
                "unmapped WhatsApp message status",
              );
            }
          }
        },
      );

      sock.ev.on(
        "connection.update",
        (update: {
          connection?: string;
          lastDisconnect?: { error?: unknown };
          qr?: string;
        }) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) deps.bus.publish({ type: "session.qr", deviceId, qr });

          if (connection === "open") {
            openDevices.add(deviceId);
            const identifier = sock.user?.id
              ? (jidDecode(sock.user.id)?.user ?? "")
              : "";
            deps.bus.publish({
              type: "session.connected",
              deviceId,
              identifier,
            });
          }

          if (connection === "close") {
            openDevices.delete(deviceId);
            sockets.delete(deviceId);

            if (shuttingDown) return;

            if (
              closeStatusCode(lastDisconnect?.error) ===
              DisconnectReason.loggedOut
            ) {
              deps.bus.publish({ type: "session.logged_out", deviceId });
              return;
            }

            if (attempt === 0) {
              deps.bus.publish({
                type: "session.disconnected",
                deviceId,
                reason: "connection closed",
              });
            }
            const delay = Math.min(
              deps.config.reconnectBaseDelayMs * 2 ** attempt,
              deps.config.reconnectMaxDelayMs,
            );
            // unref so a pending reconnect timer never keeps the event loop
            // alive during graceful shutdown (closeAll() sets shuttingDown, so
            // if it does fire, openSocket returns immediately). Without this the
            // process would wait up to RECONNECT_MAX_DELAY_MS to exit on SIGTERM.
            setTimeout(
              () => void openSocket(deviceId, attempt + 1),
              delay,
            ).unref();
          }
        },
      );
    } finally {
      pending.delete(deviceId);
    }
  };

  return {
    connect: (deviceId) => openSocket(deviceId),

    async disconnect(deviceId) {
      openDevices.delete(deviceId);
      const sock = sockets.get(deviceId);
      sockets.delete(deviceId);
      sock?.end(undefined); // close, not logout
    },

    async logout(deviceId) {
      openDevices.delete(deviceId);
      const sock = sockets.get(deviceId);
      sockets.delete(deviceId);
      if (sock) await sock.logout(); // unpair (DELETE /devices/:id semantics)
    },

    isConnected: (deviceId) => openDevices.has(deviceId),

    async resolveJid(deviceId, phone) {
      const sock = sockets.get(deviceId);
      if (!sock) return null;
      const results = await sock.onWhatsApp(phone);
      const match = results?.[0];
      return match?.exists ? match.jid : null;
    },

    async sendText(deviceId, jid, text) {
      const sock = sockets.get(deviceId);
      // openDevices (not just sockets) is the readiness gate: a socket that is
      // mid-handshake is in the map but not yet open.
      if (!sock || !openDevices.has(deviceId)) {
        throw new ServiceUnavailableError(
          "The device is not connected",
          undefined,
          ErrorCodes.DEVICE_OFFLINE,
        );
      }
      const sent = await sock.sendMessage(jid, { text });
      const waMessageId = sent?.key.id;
      if (!waMessageId) {
        throw new ServiceUnavailableError(
          "The WhatsApp send produced no message id",
          undefined,
          ErrorCodes.DEVICE_OFFLINE,
        );
      }
      return { waMessageId };
    },

    // Graceful shutdown: close() every socket, NEVER logout() — logout wipes the
    // pairing. The sockets rehydrate from authState on boot.
    closeAll() {
      shuttingDown = true;
      for (const sock of sockets.values()) sock.end(undefined);
      sockets.clear();
      openDevices.clear();
    },
  };
};
