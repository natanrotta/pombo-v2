import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IWhatsAppGateway } from "@modules/devices/domain/provider/whatsapp-gateway.interface";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import { type MessageStatus } from "@modules/messaging/domain/value-object/message-status";
import { AppConfig } from "@shared/provider/app-config.interface";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { SendTextInput } from "@modules/messaging/application/dto/message.dto";

export interface SendTextOutput {
  messageId: string;
  status: MessageStatus;
}

/**
 * The core send path. `202` means accepted + socket alive — NOT delivered (no
 * queue). The outbox row is written BEFORE the send so getMessage can answer a
 * resend. Idempotency is the DB unique's job, with a code fast-path for the
 * common sequential replay.
 */
@injectable()
export class SendTextMessageUseCase {
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
  ) {}

  async execute(input: SendTextInput): Promise<SendTextOutput> {
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
    if (!this.gateway.isConnected(device.id)) {
      throw new ServiceUnavailableError(
        "The device is not connected",
        undefined,
        ErrorCodes.DEVICE_OFFLINE,
      );
    }

    const existing = await this.outboxRepository.findByIdempotencyKey(
      device.id,
      input.idempotencyKey,
    );
    if (existing) {
      if (existing.text !== input.text) {
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

    const jid = await this.gateway.resolveJid(device.id, input.phone);
    if (!jid) {
      throw new NotFoundError(
        "This number is not on WhatsApp",
        undefined,
        ErrorCodes.NUMBER_NOT_ON_WHATSAPP,
      );
    }

    const expiresAt = new Date(
      Date.now() + this.config.OUTBOX_TTL_HOURS * 60 * 60 * 1000,
    );

    let message;
    try {
      message = await this.outboxRepository.create({
        deviceId: device.id,
        idempotencyKey: input.idempotencyKey,
        toJid: jid,
        text: input.text,
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
        if (winner && winner.text === input.text) {
          return { messageId: winner.id, status: "PENDING" };
        }
      }
      throw error;
    }

    let waMessageId: string;
    try {
      ({ waMessageId } = await this.gateway.sendText(
        device.id,
        jid,
        input.text,
      ));
    } catch (error) {
      // The socket died between the isConnected check and the send, or Baileys
      // rejected it — the message did NOT go out. Mark FAILED so the consumer
      // sees it via GET. Best-effort: if marking FAILED also fails, surface the
      // ORIGINAL send error.
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

    // The gateway ACCEPTED the send — the message went out (spec §7.2: publish
    // "após aceite do gateway"). Signal it (webhooks → on_send; no text, only
    // messageId + phone — decisão #6) BEFORE the waMessageId stamp, so a stamp
    // failure can't suppress the event or flip a delivered message to FAILED.
    this.bus.publish({
      type: "message.sent",
      deviceId: device.id,
      messageId: message.id,
      phone: input.phone,
    });
    // Stamp the waMessageId (bookkeeping for a getMessage resend). Best-effort:
    // the message already delivered, so a stamp failure must NOT turn the
    // caller's 202 into a 500 — swallow it. The row stays PENDING (truthful);
    // only a future resend lookup for this waMessageId degrades.
    try {
      await this.outboxRepository.setWaMessageId(message.id, waMessageId);
    } catch {
      // swallow — the send already succeeded; never fail the caller on the stamp
    }
    return { messageId: message.id, status: "PENDING" };
  }
}
