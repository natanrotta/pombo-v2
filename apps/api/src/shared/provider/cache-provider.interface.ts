/**
 * Health snapshot of the cache store, parsed from Redis `INFO`. Degrades to
 * `{ reachable: false }` when the store is down or the command fails.
 */
export interface CacheStatus {
  reachable: boolean;
  usedMemoryBytes?: number;
  uptimeSeconds?: number;
}

export interface ICacheProvider {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /**
   * Atomic counter increment with a TTL applied on first insertion.
   * Returns the new count. Security-enforcing callers (PIN throttling,
   * brute-force gates) should use this instead of read-modify-write to
   * avoid the 2x bypass at the rate-limit boundary.
   *
   * Throws `CacheUnavailableError` when the underlying store is
   * unreachable — callers on security paths MUST surface this as a 503
   * rather than fail-open.
   */
  increment(key: string, ttlSeconds: number): Promise<number>;
  /**
   * Returns true when the underlying store is reachable. Callers on
   * security-enforcing paths should consult this before deciding whether
   * to enforce a cached gate or fail-closed.
   */
  isAvailable(): boolean;
  /**
   * Health snapshot for the admin status panel — runs Redis `INFO` and
   * parses `used_memory` + `uptime_in_seconds`. Never throws: a down/erroring
   * store yields `{ reachable: false }`. Exposes only operational numbers,
   * never secrets.
   */
  getStatus(): Promise<CacheStatus>;
  /** Closes the underlying connection. Called from the graceful-shutdown path. */
  disconnect(): Promise<void>;
}

/**
 * Sentinel thrown by cache implementations when the underlying store is
 * not reachable. Distinct from "key missing" — security gates must
 * fail-closed on this, not interpret the absence of a counter as
 * "no prior attempts".
 */
export class CacheUnavailableError extends Error {
  constructor(message = "Cache provider is unavailable") {
    super(message);
    this.name = "CacheUnavailableError";
  }
}
