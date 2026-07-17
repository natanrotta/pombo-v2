import { OutboxMessage } from "../entity/outbox-message.entity";
import { type MessageStatus } from "../value-object/message-status";

export interface CreateOutboxData {
  deviceId: string;
  idempotencyKey: string;
  toJid: string;
  text: string;
  expiresAt: Date;
}

/**
 * The port the application depends on. Idempotency is enforced by the DB unique
 * (device_id, idempotency_key) — create throws on a duplicate. The outbox is
 * protocol, not history: pruneExpired drops rows past their TTL.
 */
export interface IOutboxRepository {
  findById(id: string): Promise<OutboxMessage | null>;
  findByIdempotencyKey(
    deviceId: string,
    idempotencyKey: string,
  ): Promise<OutboxMessage | null>;
  findByWaMessageId(waMessageId: string): Promise<OutboxMessage | null>;
  create(data: CreateOutboxData): Promise<OutboxMessage>;
  setWaMessageId(id: string, waMessageId: string): Promise<void>;
  updateStatus(
    id: string,
    status: MessageStatus,
    failureReason?: string | null,
  ): Promise<OutboxMessage>;
  /**
   * Atomic monotonic status write: sets `status` only if the row's current
   * status is in `allowedFrom`, matched by waMessageId. The transition guard is
   * a DB predicate, so two concurrent acks can't regress it. Returns the
   * UPDATED row (or null for a no-op — unknown/pruned waMessageId or a
   * stale/regressing ack).
   */
  applyMonotonicStatus(
    waMessageId: string,
    status: MessageStatus,
    allowedFrom: MessageStatus[],
  ): Promise<OutboxMessage | null>;
  pruneExpired(now: Date): Promise<number>;
}
