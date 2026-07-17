import { inject, injectable } from "tsyringe";
import Redis, { type RedisOptions } from "ioredis";
import type {
  EventBusSubscription,
  IEventBus,
} from "@shared/provider/event-bus.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { DI_TOKENS } from "@core/container/tokens";
import { env } from "@core/config";

// Redis pub/sub requires DEDICATED subscriber connections (a subscribed
// client can't issue regular commands). The publisher is shared and lazily
// connected; each subscribe call creates its own client and disposes it
// when the subscription is closed.
@injectable()
export class RedisEventBus implements IEventBus {
  private publisher: Redis | null = null;

  constructor(
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
  ) {}

  async publish(channel: string, payload: string): Promise<void> {
    const client = this.getPublisher();
    if (!client) return;
    try {
      await client.publish(channel, payload);
    } catch (error) {
      this.logger.warn(
        {
          service: "redis-event-bus",
          channel,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to publish event",
      );
    }
  }

  async subscribe(
    channel: string,
    handler: (payload: string) => void,
  ): Promise<EventBusSubscription> {
    const client = new Redis({
      ...this.connectionOptions(),
      lazyConnect: false,
      maxRetriesPerRequest: null,
    });
    // Without a listener, ioredis dumps connection errors on the raw console
    // and the subscription dies silently (SSE consumers just stop receiving).
    client.on("error", (error) => {
      this.logger.warn(
        {
          service: "redis-event-bus",
          channel,
          error: error instanceof Error ? error.message : String(error),
        },
        "Subscriber connection error",
      );
    });
    client.on("message", (_channel, payload) => handler(payload));
    await client.subscribe(channel);

    return {
      unsubscribe: async () => {
        try {
          await client.unsubscribe(channel);
        } catch {
          // ignore — we're closing the connection anyway
        }
        await client.quit().catch(() => undefined);
      },
    };
  }

  async shutdown(): Promise<void> {
    if (this.publisher) {
      await this.publisher.quit().catch(() => undefined);
      this.publisher = null;
    }
  }

  private getPublisher(): Redis | null {
    if (this.publisher) return this.publisher;
    if (!env.REDIS_HOST) return null;
    this.publisher = new Redis({
      ...this.connectionOptions(),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    this.publisher.on("error", (error) => {
      this.logger.warn(
        {
          service: "redis-event-bus",
          error: error instanceof Error ? error.message : String(error),
        },
        "Publisher connection error",
      );
    });
    return this.publisher;
  }

  private connectionOptions(): RedisOptions {
    return {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
    };
  }
}
