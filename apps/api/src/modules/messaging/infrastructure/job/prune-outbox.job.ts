import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { AppConfig } from "@shared/provider/app-config.interface";

/**
 * Periodic TTL prune — the outbox is protocol, not history. Deletes rows past
 * `expires_at`. `start` returns a stop function. The timer is unref'd so it
 * never keeps the process alive on its own.
 *
 * Only started by the composition root when `WHATSAPP_ENABLED=true`.
 */
@injectable()
export class PruneOutboxJob {
  constructor(
    @inject(DI_TOKENS.OutboxRepository)
    private readonly outboxRepository: IOutboxRepository,
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
    @inject(DI_TOKENS.AppConfig)
    private readonly config: AppConfig,
  ) {}

  private async tick(): Promise<void> {
    try {
      const pruned = await this.outboxRepository.pruneExpired(new Date());
      if (pruned > 0) {
        this.logger.info({ count: pruned }, "pruned expired outbox rows");
      }
    } catch (error) {
      this.logger.error(
        {
          message: error instanceof Error ? error.message : String(error),
        },
        "outbox prune failed",
      );
    }
  }

  start(): () => void {
    const timer = setInterval(
      () => void this.tick(),
      this.config.OUTBOX_PRUNE_INTERVAL_MS,
    );
    timer.unref();
    return () => clearInterval(timer);
  }
}
