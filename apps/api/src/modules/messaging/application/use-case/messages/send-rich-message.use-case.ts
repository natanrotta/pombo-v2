import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IWhatsAppGateway } from "@modules/devices/domain/provider/whatsapp-gateway.interface";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import { OutboxMessage } from "@modules/messaging/domain/entity/outbox-message.entity";
import { type MessageStatus } from "@modules/messaging/domain/value-object/message-status";
import { AppConfig } from "@shared/provider/app-config.interface";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import type { ISendRateLimiter } from "@modules/messaging/domain/provider/send-rate-limiter.interface";
import { ConflictError, NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { SendRichInput } from "@modules/messaging/application/dto/message.dto";
import { buildUserJid } from "@modules/messaging/domain/value-object/wa-jid";
import { DrainOutboxUseCase } from "./drain-outbox.use-case";
import { dispatchOutboxSend } from "./outbox-send-dispatch";

export interface SendRichOutput {
  messageId: string;
  /** The 202 acceptance status — always `PENDING`. The authoritative delivery
   *  status is polled via `GET /messages/:id`. Typed as the full union to mirror
   *  `SendTextOutput`. */
  status: MessageStatus;
}

/** Order-independent JSON compare — Postgres jsonb does not preserve key order,
 *  so idempotency must not depend on it. Arrays keep their order (semantic). */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * The rich (non-text) send path: image, audio, video and document.
 * Byte-for-byte the same outbox contract as `SendTextMessageUseCase`
 * — write the row BEFORE the send, 202 = accepted (offline → queued for the
 * reconnect drain; over-budget → queued + drain kicked), idempotency guarded by
 * the DB unique with a code fast-path for the sequential replay. The only
 * difference is the body lives in `payload` (compared for idempotency) and the
 * send is dispatched by `type` via `dispatchOutboxSend` — so a queued image is
 * replayed as an image, never as text.
 */
@injectable()
export class SendRichMessageUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
    @inject(DI_TOKENS.OutboxRepository)
    private readonly outboxRepository: IOutboxRepository,
    @inject(DI_TOKENS.WhatsAppGateway)
    private readonly gateway: IWhatsAppGateway,
    @inject(DI_TOKENS.AppConfig)
    private readonly config: AppConfig,
    @inject(DI_TOKENS.DomainEventBus)
    private readonly bus: IDomainEventBus,
    @inject(DI_TOKENS.SendRateLimiter)
    private readonly rateLimiter: ISendRateLimiter,
    @inject(DrainOutboxUseCase)
    private readonly drainOutbox: DrainOutboxUseCase,
  ) {}

  async execute(input: SendRichInput): Promise<SendRichOutput> {
    const device = await this.devicesRepository.findById(
      input.accountId,
      input.deviceId,
    );
    if (!device) {
      throw new NotFoundError(
        "Device not found",
        undefined,
        ErrorCodes.DEVICE_NOT_FOUND,
      );
    }

    const payloadKey = stableStringify(input.payload);
    const existing = await this.outboxRepository.findByIdempotencyKey(
      device.id,
      input.idempotencyKey,
    );
    if (existing) {
      if (
        existing.type !== input.type ||
        stableStringify(existing.payload) !== payloadKey
      ) {
        throw new ConflictError(
          "This Idempotency-Key was already used with a different payload",
          undefined,
          ErrorCodes.IDEMPOTENCY_KEY_CONFLICT,
        );
      }
      // Replay the ORIGINAL 202: always PENDING. The real status is
      // GET /messages/:id.
      return { messageId: existing.id, status: "PENDING" };
    }

    // Online: resolve + validate the JID via WhatsApp (immediate "not on
    // WhatsApp" feedback). Offline: construct it and defer that check to the
    // drain — enqueue now, send when the device reconnects.
    const online = this.gateway.isConnected(device.id);
    let jid: string;
    if (online) {
      const resolved = await this.gateway.resolveJid(device.id, input.phone);
      if (!resolved) {
        throw new NotFoundError(
          "This number is not on WhatsApp",
          undefined,
          ErrorCodes.NUMBER_NOT_ON_WHATSAPP,
        );
      }
      jid = resolved;
    } else {
      jid = buildUserJid(input.phone);
    }

    const expiresAt = new Date(
      Date.now() + this.config.OUTBOX_TTL_HOURS * 60 * 60 * 1000,
    );

    let message: OutboxMessage;
    try {
      message = await this.outboxRepository.create({
        deviceId: device.id,
        idempotencyKey: input.idempotencyKey,
        toJid: jid,
        type: input.type,
        payload: input.payload,
        expiresAt,
      });
    } catch (error) {
      // Lost a concurrent race on the same key: the winner already created it.
      if (
        error instanceof ConflictError &&
        error.code === ErrorCodes.IDEMPOTENCY_KEY_CONFLICT
      ) {
        const winner = await this.outboxRepository.findByIdempotencyKey(
          device.id,
          input.idempotencyKey,
        );
        if (
          winner &&
          winner.type === input.type &&
          stableStringify(winner.payload) === payloadKey
        ) {
          return { messageId: winner.id, status: "PENDING" };
        }
      }
      throw error;
    }

    // Offline → the row is queued; the drain sends it on reconnect. 202 now.
    if (!online) {
      return { messageId: message.id, status: "PENDING" };
    }

    // Over the per-device send budget → queue it (don't send now) and kick the
    // drain, which paces itself on the same rate limiter and sends it once the
    // budget frees. Single-flight, so this joins a running drain or starts one.
    if (!this.rateLimiter.tryConsume(device.id)) {
      void this.drainOutbox.execute({ deviceId: device.id }).catch(() => {});
      return { messageId: message.id, status: "PENDING" };
    }

    let waMessageId: string;
    try {
      ({ waMessageId } = await dispatchOutboxSend(
        this.gateway,
        device.id,
        message,
      ));
    } catch (error) {
      // The socket dropped between the readiness check and the send: keep the
      // row QUEUED (unsent) so the drain resends it on reconnect. A real send
      // error (still connected) is terminal → FAILED so the consumer sees it.
      if (!this.gateway.isConnected(device.id)) {
        return { messageId: message.id, status: "PENDING" };
      }
      try {
        await this.outboxRepository.updateStatus(
          message.id,
          "FAILED",
          "send failed",
        );
      } catch {
        // swallow — never mask the original error below
      }
      throw error;
    }

    // The gateway ACCEPTED the send. Signal it (webhooks → on_send) BEFORE the
    // waMessageId stamp, so a stamp failure can't suppress the event.
    this.bus.publish({
      type: "message.sent",
      deviceId: device.id,
      messageId: message.id,
      phone: input.phone,
    });
    // Stamp the waMessageId (bookkeeping for a getMessage resend). Best-effort:
    // the message already delivered, so a stamp failure must NOT turn the 202
    // into a 500, and must NOT leave the row PENDING (the reconnect drain would
    // re-send it) — move it to SERVER_ACK instead.
    try {
      await this.outboxRepository.setWaMessageId(message.id, waMessageId);
    } catch {
      await this.outboxRepository
        .updateStatus(message.id, "SERVER_ACK")
        .catch(() => {
          // swallow — the send already succeeded; never fail the caller here
        });
    }
    return { messageId: message.id, status: "PENDING" };
  }
}
