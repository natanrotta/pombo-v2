import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import {
  DrainOutboxUseCase,
  UpdateMessageStatusUseCase,
} from "@modules/messaging/application/use-case/messages";

/**
 * Wires the bus events `messaging` cares about:
 *  - `session.message_status` → apply the monotonic delivery-status update.
 *  - `session.connected` → drain the outbox (send what queued while the device
 *    was offline). `devices` publishes both; `messaging` subscribes. `devices`
 *    does not know `messaging` — the getMessage side is injected as a plain
 *    function in the composition root, not a module import.
 *
 * Called from the composition root only when `WHATSAPP_ENABLED=true`.
 */
export function registerMessageListeners(): void {
  const bus = container.resolve<IDomainEventBus>(DI_TOKENS.DomainEventBus);

  bus.subscribe("session.message_status", async (event) => {
    await container
      .resolve(UpdateMessageStatusUseCase)
      .execute({ waMessageId: event.waMessageId, status: event.status });
  });

  bus.subscribe("session.connected", async (event) => {
    // MUST be container.resolve (not `new`): DrainOutboxUseCase is registered as
    // a SINGLETON and its per-device single-flight guard lives in the instance.
    // A transient resolve would reset the guard on every reconnect event.
    await container
      .resolve(DrainOutboxUseCase)
      .execute({ deviceId: event.deviceId });
  });
}
