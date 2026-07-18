import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import { OutboxMessage } from "@modules/messaging/domain/entity/outbox-message.entity";
import { IWhatsAppGateway } from "@modules/devices/domain/provider/whatsapp-gateway.interface";
import { userJidToPhone } from "@modules/messaging/domain/value-object/wa-jid";
import type { AppConfig } from "@shared/provider/app-config.interface";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";

export interface DrainOutboxInput {
  deviceId: string;
}

// Rows loaded (and sent) per query round, so a device with a huge backlog never
// loads it all into memory — the loop re-queries until the queue is empty.
const DRAIN_BATCH_SIZE = 200;

// unref so a pending pacing delay never blocks graceful shutdown.
const delay = (ms: number): Promise<void> =>
  ms > 0
    ? new Promise<void>((resolve) => {
        setTimeout(resolve, ms).unref();
      })
    : Promise.resolve();

const errText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// The outcome of draining a single row, driving the loop.
type SendOutcome = "sent" | "failed" | "dropped";

/**
 * Sends the messages that piled up in the outbox while a device was offline —
 * triggered on `session.connected`. FIFO, paced (`OUTBOX_DRAIN_DELAY_MS`), in
 * bounded batches, and it STOPS the moment the device drops again (the rest
 * waits for the next reconnect). Single-flight per device via the `draining`
 * guard so the same row is never sent twice — which is why this use case MUST
 * be a container singleton (a transient instance would reset the guard every
 * event).
 */
@injectable()
export class DrainOutboxUseCase {
  private readonly draining = new Set<string>();

  constructor(
    @inject(DI_TOKENS.OutboxRepository)
    private readonly outboxRepository: IOutboxRepository,
    @inject(DI_TOKENS.WhatsAppGateway)
    private readonly gateway: IWhatsAppGateway,
    @inject(DI_TOKENS.DomainEventBus)
    private readonly bus: IDomainEventBus,
    @inject(DI_TOKENS.AppConfig)
    private readonly config: AppConfig,
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
  ) {}

  async execute(input: DrainOutboxInput): Promise<void> {
    const { deviceId } = input;
    if (this.draining.has(deviceId)) return; // single-flight per device
    this.draining.add(deviceId);
    try {
      let logged = false;
      for (;;) {
        if (!this.gateway.isConnected(deviceId)) break;
        const batch = await this.outboxRepository.findQueued(
          deviceId,
          DRAIN_BATCH_SIZE,
        );
        if (batch.length === 0) break;
        if (!logged) {
          this.logger.info(
            { deviceId, count: batch.length },
            "draining outbox after reconnect",
          );
          logged = true;
        }

        let dropped = false;
        for (const message of batch) {
          // Device dropped again mid-drain → stop; the rest drains on the next
          // reconnect. Re-checked every iteration, not just once.
          if (!this.gateway.isConnected(deviceId)) {
            dropped = true;
            break;
          }
          if ((await this.sendOne(deviceId, message)) === "dropped") {
            dropped = true;
            break;
          }
          await delay(this.config.OUTBOX_DRAIN_DELAY_MS);
        }

        // Stop on a drop, or when the last (partial) batch is drained. A full
        // batch means there may be more — re-query.
        if (dropped || batch.length < DRAIN_BATCH_SIZE) break;
      }
    } finally {
      this.draining.delete(deviceId);
    }
  }

  /** Send one queued row. Every non-`dropped` outcome moves the row OUT of the
   *  `findQueued` set (sent → stamped or SERVER_ACK; failed → FAILED), so the
   *  loop always makes progress and a re-query can't pick it up twice. */
  private async sendOne(
    deviceId: string,
    message: OutboxMessage,
  ): Promise<SendOutcome> {
    let waMessageId: string;
    try {
      ({ waMessageId } = await this.gateway.sendText(
        deviceId,
        message.toJid,
        message.text,
      ));
    } catch (error) {
      // Socket dropped mid-send → leave it queued for the next reconnect.
      // A real send error (still connected) is terminal → FAILED.
      if (!this.gateway.isConnected(deviceId)) return "dropped";
      this.logger.warn(
        { deviceId, messageId: message.id, err: errText(error) },
        "drain send failed",
      );
      await this.outboxRepository
        .updateStatus(message.id, "FAILED", "drain send failed")
        .catch(() => {
          // a bookkeeping failure must not abort the rest of the drain
        });
      return "failed";
    }

    // Delivered. Signal BEFORE the stamp so a stamp failure can't suppress the
    // webhook — same ordering as the live send path.
    this.bus.publish({
      type: "message.sent",
      deviceId,
      messageId: message.id,
      phone: userJidToPhone(message.toJid),
    });
    try {
      await this.outboxRepository.setWaMessageId(message.id, waMessageId);
    } catch (error) {
      // The message WENT OUT but we couldn't record its waMessageId. It must
      // NOT stay PENDING (the next drain would re-send it) and must NOT be
      // FAILED (it was delivered). Move it to SERVER_ACK — truthful (the gateway
      // accepted it) and out of the queue. Best-effort; a double DB failure is
      // the only way it lingers, and the next findQueued would fail too.
      this.logger.warn(
        { deviceId, messageId: message.id, err: errText(error) },
        "drain stamp failed (message already sent)",
      );
      await this.outboxRepository
        .updateStatus(message.id, "SERVER_ACK")
        .catch(() => {});
    }
    return "sent";
  }
}
