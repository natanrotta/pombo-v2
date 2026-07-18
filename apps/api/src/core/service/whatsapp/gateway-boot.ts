import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { env } from "@core/config";
import { logger } from "@core/http/logger";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import type { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { registerSessionListeners } from "@modules/devices/application/listener/register-session-listeners";
import { registerMessageListeners } from "@modules/messaging/application/listener/register-message-listeners";
import { registerWebhookListeners } from "@modules/webhooks/application/listener/register-webhook-listeners";
import { BaileysWhatsAppGateway } from "@modules/devices/infrastructure/provider/baileys-whatsapp.gateway";
import { PruneOutboxJob } from "@modules/messaging/infrastructure/job/prune-outbox.job";
import { makeAdvisoryLock } from "./advisory-lock";

/**
 * All the boot steps that run ONLY when `WHATSAPP_ENABLED=true`. Kept behind the
 * flag so they never run in dev/test: the advisory lock, boot rehydration, the
 * outbox-prune interval, the bus listeners, and the terminal QR printer. Returns
 * a shutdown function (close sockets WITHOUT logging out, stop prune, release
 * the lock).
 */
export async function startWhatsAppGateway(): Promise<() => Promise<void>> {
  const bus = container.resolve<IDomainEventBus>(DI_TOKENS.DomainEventBus);
  const devicesRepository = container.resolve<IDevicesRepository>(
    DI_TOKENS.DevicesRepository,
  );

  // Single-replica guard: acquire the Postgres advisory lock on a dedicated
  // connection BEFORE reopening any socket. A second instance sharing this
  // authState would corrupt the Signal keys.
  const advisoryLock = makeAdvisoryLock({
    connectionString: env.DATABASE_URL,
    logger: container.resolve(DI_TOKENS.LoggerProvider),
    heartbeatMs: env.ADVISORY_LOCK_HEARTBEAT_MS,
    onLost: () => {
      logger.error(
        "Advisory lock connection lost — refusing to run without the single-replica guarantee; exiting to be restarted.",
      );
      process.exit(1);
    },
  });

  let lockAcquired = false;
  try {
    lockAcquired = await advisoryLock.acquire();
  } catch (error) {
    logger.error(
      { message: error instanceof Error ? error.message : String(error) },
      "Failed to acquire the WhatsApp advisory lock",
    );
    process.exit(1);
  }
  if (!lockAcquired) {
    logger.error(
      "Another pombo instance holds the advisory lock — refusing to start the WhatsApp gateway (exactly one replica).",
    );
    process.exit(1);
  }

  // Wire the bus → use cases (devices lifecycle, message status, webhooks).
  registerSessionListeners();
  registerMessageListeners();
  registerWebhookListeners();

  // QR for pairing → terminal. Terminal output is the pairing UX — the one
  // sanctioned exception to "no console". qrcode-terminal is dynamically
  // imported so it never loads when the gateway is disabled.
  const { default: qrcode } = await import("qrcode-terminal");
  bus.subscribe("session.qr", async (event) => {
    const line = "─".repeat(60);
    process.stdout.write(`\n${line}\n`);
    process.stdout.write("  📱  Escaneie o QR abaixo com o WhatsApp do chip\n");
    process.stdout.write(`      device: ${event.deviceId}\n${line}\n\n`);
    qrcode.generate(event.qr, { small: true });
    process.stdout.write(`${line}\n\n`);
  });

  const gateway = container.resolve<BaileysWhatsAppGateway>(
    DI_TOKENS.WhatsAppGateway,
  );

  // Boot rehydration: reopen the sockets that were CONNECTED, from authState —
  // nobody scans anything. Stale CONNECTED/CONNECTING/QR_PENDING (from an
  // unclean stop) are reset to DISCONNECTED first so the connect guard doesn't
  // block the reopen; the events flip them back.
  // Boot spans every account (system rehydration, not a user request).
  const devices = await devicesRepository.listAll();
  const wasConnected = devices.filter(
    (device) => device.status === "CONNECTED",
  );
  for (const device of devices) {
    if (
      device.status === "CONNECTED" ||
      device.status === "CONNECTING" ||
      device.status === "QR_PENDING"
    ) {
      await devicesRepository.updateStatus(device.id, "DISCONNECTED");
    }
  }
  for (const device of wasConnected) {
    void gateway.connect(device.id);
  }

  // Prune the outbox on a TTL (protocol, not history).
  const stopPrune = container.resolve(PruneOutboxJob).start();

  logger.info(
    { devices: devices.length, rehydrated: wasConnected.length },
    "WhatsApp gateway started",
  );

  // Graceful shutdown: close the sockets (close(), NEVER logout()), stop prune,
  // release the advisory lock.
  return async (): Promise<void> => {
    stopPrune();
    gateway.closeAll();
    await advisoryLock.release();
  };
}
