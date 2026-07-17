import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import { UpdateMessageStatusUseCase } from "@modules/messaging/application/use-case/messages";

/**
 * Wires the bus `session.message_status` events → the update-message-status use
 * case. The Baileys adapter (in devices) publishes; `messaging` subscribes.
 * `devices` does not know `messaging` — the getMessage side is injected as a
 * plain function in the composition root, not a module import.
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
}
