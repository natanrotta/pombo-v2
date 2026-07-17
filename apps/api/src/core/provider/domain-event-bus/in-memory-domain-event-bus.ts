import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import type {
  DomainEvent,
  DomainEventType,
  IDomainEventBus,
} from "@shared/provider/domain-event-bus.interface";

type AnyHandler = (event: DomainEvent) => Promise<void>;

/**
 * In-process, typed domain event bus for the WhatsApp gateway. Registered as a
 * singleton so every module resolves the SAME bus instance (the Baileys adapter
 * publishes, `messaging`/`webhooks` subscribe).
 *
 * Each subscriber is isolated: one throwing handler must never break the
 * publisher or a sibling handler. `publish` is fire-and-forget (`void`).
 */
@injectable()
export class InMemoryDomainEventBus implements IDomainEventBus {
  private readonly handlers = new Map<DomainEventType, AnyHandler[]>();

  constructor(
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
  ) {}

  publish(event: DomainEvent): void {
    for (const handler of this.handlers.get(event.type) ?? []) {
      void this.runHandler(handler, event);
    }
  }

  subscribe<T extends DomainEventType>(
    type: T,
    handler: (event: Extract<DomainEvent, { type: T }>) => Promise<void>,
  ): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as AnyHandler);
    this.handlers.set(type, list);
  }

  private async runHandler(
    handler: AnyHandler,
    event: DomainEvent,
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      // A failing subscriber (a webhook delivery, a DB write in a session
      // listener) is not the publisher's problem — swallow, but log it so the
      // failure isn't invisible.
      this.logger.error(
        {
          type: event.type,
          message: error instanceof Error ? error.message : String(error),
        },
        "domain event handler failed",
      );
    }
  }
}
