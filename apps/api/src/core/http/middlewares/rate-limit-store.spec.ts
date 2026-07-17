const { MockRedis, redisInstances, MockRedisStore, storeInstances } =
  vi.hoisted(() => {
    const redisInstances: any[] = [];
    class MockRedis {
      options: any;
      call = vi.fn().mockResolvedValue("OK");
      quit = vi.fn().mockResolvedValue("OK");
      on = vi.fn().mockReturnThis();
      constructor(options: any) {
        this.options = options;
        redisInstances.push(this);
      }
    }
    const storeInstances: any[] = [];
    class MockRedisStore {
      options: any;
      constructor(options: any) {
        this.options = options;
        storeInstances.push(this);
      }
    }
    return { MockRedis, redisInstances, MockRedisStore, storeInstances };
  });

vi.mock("ioredis", () => ({ Redis: MockRedis }));
vi.mock("rate-limit-redis", () => ({ RedisStore: MockRedisStore }));
vi.mock("../logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe("rate-limit-store", () => {
  beforeEach(() => {
    vi.resetModules();
    redisInstances.length = 0;
    storeInstances.length = 0;
  });

  it("returns undefined when REDIS_HOST is not configured (memory-store fallback)", async () => {
    vi.doMock("../../config", () => ({ env: { REDIS_HOST: "" } }));
    const { createRateLimitStore } = await import("./rate-limit-store.js");

    expect(createRateLimitStore("user")).toBeUndefined();
    expect(redisInstances).toHaveLength(0);
  });

  it("creates a RedisStore with a per-limiter prefix", async () => {
    vi.doMock("../../config", () => ({
      env: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
      },
    }));
    const { createRateLimitStore } = await import("./rate-limit-store.js");

    const store = createRateLimitStore("auth");

    expect(store).toBeDefined();
    expect(storeInstances[0].options.prefix).toBe("rl:auth:");
  });

  it("reuses one shared connection across limiters", async () => {
    vi.doMock("../../config", () => ({
      env: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
      },
    }));
    const { createRateLimitStore } = await import("./rate-limit-store.js");

    createRateLimitStore("user");
    createRateLimitStore("ai");

    expect(redisInstances).toHaveLength(1);
  });

  it("configures the connection to survive a cold boot yet fail open on outage (offline queue on, capped command timeout + retry)", async () => {
    vi.doMock("../../config", () => ({
      env: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
      },
    }));
    const { createRateLimitStore } = await import("./rate-limit-store.js");

    createRateLimitStore("user");

    const options = redisInstances[0].options;
    expect(options.lazyConnect).toBe(true);
    // ON so the init-time SCRIPT LOAD waits for the connection instead of
    // rejecting and crashing the boot; commandTimeout keeps fail-open honest.
    expect(options.enableOfflineQueue).toBe(true);
    expect(options.commandTimeout).toBe(800);
    expect(options.retryStrategy(1)).toBe(200);
    expect(options.retryStrategy(1000)).toBe(5000);
  });

  it("delegates sendCommand to redis.call", async () => {
    vi.doMock("../../config", () => ({
      env: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
      },
    }));
    const { createRateLimitStore } = await import("./rate-limit-store.js");

    createRateLimitStore("user");
    await storeInstances[0].options.sendCommand("INCR", "rl:user:abc");

    expect(redisInstances[0].call).toHaveBeenCalledWith("INCR", "rl:user:abc");
  });

  it("swallows a failing SCRIPT LOAD (boot safety) but propagates request-time errors", async () => {
    vi.doMock("../../config", () => ({
      env: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
      },
    }));
    const { createRateLimitStore } = await import("./rate-limit-store.js");

    createRateLimitStore("user");
    const send = storeInstances[0].options.sendCommand;
    const boom = new Error(
      "Stream isn't writeable and enableOfflineQueue options is false",
    );

    // The store's un-awaited init-time SCRIPT LOAD must never reject — an
    // unhandled rejection there crashed the boot (v1.9). It resolves instead.
    redisInstances[0].call.mockRejectedValueOnce(boom);
    await expect(send("SCRIPT", "LOAD", "return 1")).resolves.toBe("");

    // A request-time increment still rejects so passOnStoreError can fail open.
    redisInstances[0].call.mockRejectedValueOnce(boom);
    await expect(send("INCR", "rl:user:abc")).rejects.toThrow(boom);
  });

  it("shutdownRateLimitStore quits the shared connection", async () => {
    vi.doMock("../../config", () => ({
      env: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
        REDIS_DB: 0,
      },
    }));
    const { createRateLimitStore, shutdownRateLimitStore } =
      await import("./rate-limit-store.js");

    createRateLimitStore("user");
    await shutdownRateLimitStore();

    expect(redisInstances[0].quit).toHaveBeenCalled();
  });
});
