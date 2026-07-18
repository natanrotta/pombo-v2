import type { ICacheProvider } from "@shared/provider/cache-provider.interface";

/**
 * Codec between a domain entity and its JSON-safe cache representation. The
 * entity carries `Date`s and (via getters) private props; the cached form is a
 * plain object with ISO-string dates. `deserialize` receives the already
 * JSON-parsed object (the cache provider parses on `get`).
 */
export interface CacheCodec<T> {
  /** Return a JSON-serializable plain object (ISO-string dates). `withCache`
   *  calls `JSON.stringify` on the result before writing the raw string to the
   *  store — do NOT stringify here. */
  serialize(value: T): unknown;
  /** Rehydrate the entity from the already-JSON-parsed cache value (the cache
   *  provider parses on `get`). */
  deserialize(raw: unknown): T;
}

/**
 * Read-aside cache helper. Tries the cache first; on a miss (or any cache
 * error) it runs `loader` against the source of truth and back-fills the cache.
 *
 * PURE OPTIMIZATION — fail-open by construction: every cache interaction is
 * guarded, so an unreachable/throwing/corrupt cache silently degrades to a
 * direct `loader()` call. It never turns a cache problem into a request error.
 *
 * Only non-null results are cached: caching "not found" would let a later
 * create be masked by a stale negative entry.
 */
export async function withCache<T>(
  cache: ICacheProvider,
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T | null>,
  codec: CacheCodec<T>,
): Promise<T | null> {
  let raw: unknown = null;
  try {
    raw = await cache.get<unknown>(key);
  } catch {
    raw = null; // fail-open: treat a cache error as a miss
  }

  if (raw !== null && raw !== undefined) {
    try {
      return codec.deserialize(raw);
    } catch {
      // Corrupt/shape-drifted entry — treat as a miss and reload below.
    }
  }

  const loaded = await loader();
  if (loaded !== null && loaded !== undefined) {
    try {
      await cache.set(key, JSON.stringify(codec.serialize(loaded)), ttlSeconds);
    } catch {
      // fail-open: a failed back-fill just means the next read reloads.
    }
  }
  return loaded;
}

/**
 * Best-effort cache eviction after a successful write to the source of truth.
 * Fail-open: if the delete can't reach the store, the entry's TTL still expires
 * it — a stale read for at most the TTL window, never a request failure.
 */
export async function invalidateCache(
  cache: ICacheProvider,
  key: string,
): Promise<void> {
  try {
    await cache.delete(key);
  } catch {
    // fail-open — TTL is the backstop
  }
}
