import { ISendRateLimiter } from "@modules/messaging/domain/provider/send-rate-limiter.interface";

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

/**
 * A per-device token bucket. Capacity `max` (the burst allowance), refilled at
 * `max` tokens per `windowMs` (i.e. a steady rate of `max/windowMs` tokens/ms).
 * Each device gets its own bucket, created full on first use so a freshly-seen
 * device can burst up to `max` immediately, then paces at the steady rate.
 *
 * In-memory and safe here because the advisory lock guarantees exactly one
 * process owns the sockets — there is no second limiter to keep in sync. `now`
 * is injectable so the refill math is unit-testable without real time.
 *
 * Buckets are never evicted: one small entry (~a few bytes) per device ever
 * seen. Bounded by the device cardinality, which is small for this app; if the
 * fleet ever grows to many thousands, add an eviction hook on device delete.
 */
export class TokenBucketSendRateLimiter implements ISendRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly refillPerMs: number;

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.refillPerMs = max / windowMs;
  }

  private bucketFor(deviceId: string): Bucket {
    const t = this.now();
    let bucket = this.buckets.get(deviceId);
    if (!bucket) {
      bucket = { tokens: this.max, lastRefillMs: t };
      this.buckets.set(deviceId, bucket);
      return bucket;
    }
    const elapsed = t - bucket.lastRefillMs;
    if (elapsed > 0) {
      bucket.tokens = Math.min(
        this.max,
        bucket.tokens + elapsed * this.refillPerMs,
      );
      bucket.lastRefillMs = t;
    }
    return bucket;
  }

  tryConsume(deviceId: string): boolean {
    const bucket = this.bucketFor(deviceId);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  msUntilNextToken(deviceId: string): number {
    const bucket = this.bucketFor(deviceId);
    if (bucket.tokens >= 1) return 0;
    return Math.ceil((1 - bucket.tokens) / this.refillPerMs);
  }
}
