import {
  CacheStatus,
  ICacheProvider,
} from "@shared/provider/cache-provider.interface";

/**
 * Functional in-memory `ICacheProvider` for specs — a Map that mirrors the real
 * RedisCacheProvider's contract (`set` stores the raw string, `get` JSON-parses
 * it). Use it to exercise real cache-aside behavior (hit/miss/invalidate) in the
 * decorator + middleware tests, instead of the call-spy `mockCacheProvider()`.
 *
 * Set `available = false` (or pass `{ failing: true }`) to simulate an
 * unreachable/erroring store and assert fail-open behavior.
 */
export class InMemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<string, string>();
  public available = true;
  /** Test counters — how many times each op was called. */
  public calls = { get: 0, set: 0, delete: 0 };

  constructor(private readonly opts: { failing?: boolean } = {}) {}

  async get<T = string>(key: string): Promise<T | null> {
    this.calls.get += 1;
    if (this.opts.failing) throw new Error("cache down");
    if (!this.available) return null;
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, _ttlSeconds?: number): Promise<void> {
    this.calls.set += 1;
    if (this.opts.failing) throw new Error("cache down");
    if (!this.available) return;
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.calls.delete += 1;
    if (this.opts.failing) throw new Error("cache down");
    if (!this.available) return;
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.available && this.store.has(key);
  }

  async increment(key: string, _ttlSeconds: number): Promise<number> {
    // Same failure-simulation guards as the other ops (the real provider fails
    // CLOSED here — increment throws when the store is unreachable).
    if (this.opts.failing) throw new Error("cache down");
    if (!this.available) return 0;
    const next = Number(this.store.get(key) ?? 0) + 1;
    this.store.set(key, String(next));
    return next;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async getStatus(): Promise<CacheStatus> {
    return { reachable: this.available };
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }

  /** Test helper: whether a key is currently stored. */
  has(key: string): boolean {
    return this.store.has(key);
  }
}
