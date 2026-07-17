import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import Redis from "ioredis";
import { ICacheProvider, ILoggerProvider } from "@shared/provider";
import {
  CacheUnavailableError,
  CacheStatus,
} from "@shared/provider/cache-provider.interface";
import { env } from "../../config";

@injectable()
export class RedisCacheProvider implements ICacheProvider {
  private client: Redis | null = null;
  private readonly DEFAULT_TTL = 60 * 60 * 12; // 12 hours

  constructor(
    @inject(DI_TOKENS.LoggerProvider) private readonly logger: ILoggerProvider,
  ) {
    if (env.REDIS_HOST) {
      this.connect();
    }
  }

  private connect(): void {
    try {
      this.client = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        // Reconnect forever with a capped backoff. Returning `null` here
        // would permanently kill the client after a short outage, turning
        // the fail-closed security gates (increment/isAvailable) into a
        // permanent 503 until process restart.
        retryStrategy: (times) => {
          if (times === 1 || times % 20 === 0) {
            this.logger.warn(
              { service: "redis", attempt: times },
              "Redis connection lost, retrying with backoff",
            );
          }
          return Math.min(times * 200, 5000);
        },
      });

      this.client.on("connect", () => {
        this.logger.info({ service: "redis" }, "Redis connected");
      });

      this.client.on("error", (error) => {
        this.logger.error(
          {
            service: "redis",
            error: error instanceof Error ? error.message : error,
          },
          "Redis error",
        );
      });
    } catch (error) {
      this.logger.warn(
        {
          service: "redis",
          error: error instanceof Error ? error.message : error,
        },
        "Failed to initialize Redis, running without cache",
      );
      this.client = null;
    }
  }

  // get/set/delete/exists fail OPEN (cache miss semantics) so a Redis outage
  // degrades to DB reads instead of 500s. `increment` stays fail-CLOSED —
  // security gates must not interpret an unreachable store as "no attempts".

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client!.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        this.logger.warn(
          { service: "redis", key },
          "Corrupt cache entry, treating as miss",
        );
        return null;
      }
    } catch (error) {
      this.logCommandFailure("get", key, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const ttl = ttlSeconds ?? this.DEFAULT_TTL;
      await this.client!.set(key, value, "EX", ttl);
    } catch (error) {
      this.logCommandFailure("set", key, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.client!.del(key);
    } catch (error) {
      this.logCommandFailure("delete", key, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      this.logCommandFailure("exists", key, error);
      return false;
    }
  }

  isAvailable(): boolean {
    // ioredis client status transitions: `connecting` → `connect` → `ready`.
    // Only `ready` is safe to issue commands against. Any other state means
    // the security-enforcing caller must fail-closed.
    return this.client !== null && this.client.status === "ready";
  }

  async getStatus(): Promise<CacheStatus> {
    if (!this.client || this.client.status !== "ready") {
      return { reachable: false };
    }
    try {
      // `INFO` returns a CRLF-delimited `key:value` block. We only surface two
      // operational numbers — used memory and uptime — never any secret.
      const info = await this.client.info();
      const usedMemoryBytes = parseInfoNumber(info, "used_memory");
      const uptimeSeconds = parseInfoNumber(info, "uptime_in_seconds");
      return {
        reachable: true,
        ...(usedMemoryBytes !== null && { usedMemoryBytes }),
        ...(uptimeSeconds !== null && { uptimeSeconds }),
      };
    } catch (error) {
      this.logger.warn(
        {
          service: "redis",
          error: error instanceof Error ? error.message : String(error),
        },
        "Redis INFO failed for status probe",
      );
      return { reachable: false };
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (!this.client || this.client.status !== "ready") {
      throw new CacheUnavailableError();
    }
    // Two-command pipeline: INCR (returns the new value) followed by
    // EXPIRE. INCR creates the key set to 1 on first call; EXPIRE is
    // idempotent — calling it on every increment preserves the original
    // window (we re-set the TTL each call, intentionally extending the
    // sliding window so a constant attacker can't dodge the lock by
    // waiting just under the TTL between attempts).
    const pipeline = this.client.multi();
    pipeline.incr(key);
    pipeline.expire(key, ttlSeconds);
    const results = await pipeline.exec();
    if (!results || results.length === 0) {
      throw new CacheUnavailableError("Redis pipeline returned no results");
    }
    const [incrError, incrValue] = results[0]!;
    if (incrError) {
      throw new CacheUnavailableError(
        `Redis INCR failed: ${incrError.message}`,
      );
    }
    return Number(incrValue);
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.quit().catch(() => undefined);
    this.client = null;
  }

  private logCommandFailure(
    command: string,
    key: string,
    error: unknown,
  ): void {
    this.logger.warn(
      {
        service: "redis",
        command,
        key,
        error: error instanceof Error ? error.message : String(error),
      },
      "Redis command failed, treating as cache miss",
    );
  }
}

/** Extracts a numeric `key:value` field from a Redis `INFO` block. Returns
 *  `null` when the field is absent or not a finite number. */
function parseInfoNumber(info: string, key: string): number | null {
  const match = info.match(new RegExp(`^${key}:(\\d+)`, "m"));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}
