import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import {
  canTransitionTo,
  MESSAGE_STATUSES,
  type MessageStatus,
} from "@modules/messaging/domain/value-object/message-status";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";

export interface UpdateMessageStatusInput {
  waMessageId: string;
  status: MessageStatus;
}

/**
 * Applies a delivery-status update arriving from the socket (via the bus). The
 * monotonic guard is enforced ATOMICALLY in the DB: applyMonotonicStatus writes
 * only when the current status is one this update may rise from. A stale writer
 * matches zero rows; an unknown/pruned waMessageId also matches zero rows and is
 * silently ignored.
 *
 * On a REAL rise, republish `message.status` (the outbox id + the current,
 * monotonic status) so `webhooks` can deliver it.
 */
@injectable()
export class UpdateMessageStatusUseCase {
  constructor(
    @inject(DI_TOKENS.OutboxRepository)
    private readonly outboxRepository: IOutboxRepository,
    @inject(DI_TOKENS.DomainEventBus)
    private readonly bus: IDomainEventBus,
  ) {}

  async execute(input: UpdateMessageStatusInput): Promise<void> {
    const allowedFrom = MESSAGE_STATUSES.filter((from) =>
      canTransitionTo(from, input.status),
    );
    // Nothing can rise to this status (e.g. an incoming PENDING) — no-op.
    if (allowedFrom.length === 0) return;

    const updated = await this.outboxRepository.applyMonotonicStatus(
      input.waMessageId,
      input.status,
      allowedFrom,
    );
    if (!updated) return;

    this.bus.publish({
      type: "message.status",
      deviceId: updated.deviceId,
      messageId: updated.id,
      status: updated.status,
    });
  }
}
