import { Redis } from "ioredis";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import type { Store } from "express-rate-limit";
import { env } from "../../config";
import { logger } from "../logger";

/**
 * Shared Redis backing for the HTTP rate limiters. Counters survive deploys
 * and hold across replicas — the in-memory default resets both.
 *
 * Fail-open by design: a Redis outage rejects a command within `commandTimeout`
 * and every limiter sets `passOnStoreError`, so it degrades to unthrottled
 * traffic, never to 500s. The security-critical gates (PIN brute force,
 * signature OTP) keep their own fail-closed Redis counters at the use-case layer.
 *
 * Boot safety: `enableOfflineQueue: true` lets the store's init-time SCRIPT LOAD
 * (fired by rate-limit-redis at middleware construction, before the socket is
 * ready) WAIT for the connection instead of rejecting. With the queue OFF that
 * rejection was unhandled and crashed the process at boot — it shipped in v1.9.
 * `commandTimeout` still bounds every command so the offline queue can neither
 * pile up nor hang a request.
 */
let client: Redis | null = null;

function getClient(): Redis | null {
  if (!env.REDIS_HOST) return null;
  if (client) return client;
  client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    lazyConnect: true,
    // ON (was false): rate-limit-redis fires a one-shot SCRIPT LOAD at store
    // construction, before this lazyConnect socket is ready. With the queue OFF
    // that command rejected instantly and the library does not await/catch it →
    // the unhandled rejection CRASHED the boot (v1.9). With the queue ON it
    // waits for the connection; `commandTimeout` below keeps fail-open honest.
    enableOfflineQueue: true,
    maxRetriesPerRequest: 1,
    // Hard cap so a Redis outage can't hang a request on the offline queue nor
    // let commands accumulate there: a command rejects within this window →
    // express-rate-limit's passOnStoreError lets the request through (fail
    // open). Generous vs a healthy round-trip; only an outage ever trips it.
    commandTimeout: 800,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });
  client.on("error", (error) => {
    logger.warn(
      {
        service: "rate-limit-redis",
        error: error instanceof Error ? error.message : String(error),
      },
      "Rate-limit Redis connection error — limiters fail open",
    );
  });
  return client;
}

export function createRateLimitStore(prefix: string): Store | undefined {
  const redis = getClient();
  if (!redis) return undefined;
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args: string[]) => {
      const [command, ...rest] = args;
      const call = redis.call(command!, ...rest) as Promise<RedisReply>;
      // Backstop: rate-limit-redis fires this store's SCRIPT LOAD un-awaited at
      // boot. If it ever rejects (Redis unreachable past commandTimeout),
      // swallow it so the process never crashes — the script reloads on the
      // first request. Request-time commands are NOT swallowed: they reject and
      // express-rate-limit's passOnStoreError fails open.
      if (command?.toUpperCase() === "SCRIPT") {
        return call.catch(() => "" as unknown as RedisReply);
      }
      return call;
    },
  });
}

/** Closes the shared connection. Called from the graceful-shutdown path. */
export async function shutdownRateLimitStore(): Promise<void> {
  if (!client) return;
  await client.quit().catch(() => undefined);
  client = null;
}
