import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import { PrismaOutboxRepository } from "@modules/messaging/infrastructure/repository/prisma-outbox.repository";

/**
 * DI wiring for the messaging domain (outbox + delivery status). Registers the
 * outbox repository; the use cases are `@injectable()` and resolved on demand.
 * The `ResolveOutboxText` function (Baileys getMessage) is bound in the
 * container composition root so `devices` never imports `messaging`.
 */
export function registerMessagingModule(container: DependencyContainer): void {
  container.registerSingleton<IOutboxRepository>(
    DI_TOKENS.OutboxRepository,
    PrismaOutboxRepository,
  );
}
