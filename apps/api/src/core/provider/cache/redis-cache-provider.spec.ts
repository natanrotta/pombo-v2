import "reflect-metadata";

const { mockRedisInstance, RedisCtor } = vi.hoisted(() => {
  const mockRedisInstance = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    info: vi.fn(),
    on: vi.fn(),
    quit: vi.fn(),
    multi: vi.fn(),
    status: "ready",
  };
  const RedisCtor = vi.fn(() => mockRedisInstance);
  return { mockRedisInstance, RedisCtor };
});

vi.mock("ioredis", () => ({
  default: RedisCtor,
}));

vi.mock("../../config", () => ({
  env: {
    NODE_ENV: "test",
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
    REDIS_PASSWORD: "",
    REDIS_DB: 0,
  },
}));

import { ILoggerProvider } from "@shared/provider";
import { CacheUnavailableError } from "@shared/provider/cache-provider.interface";
import { RedisCacheProvider } from "./redis-cache-provider";

const mockLogger: ILoggerProvider = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe("RedisCacheProvider", () => {
  let sut: RedisCacheProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisInstance.quit.mockResolvedValue("OK");
    mockRedisInstance.status = "ready";
    sut = new RedisCacheProvider(mockLogger);
  });

  describe("connection resilience", () => {
    it("retryStrategy never gives up (no null) and caps the backoff at 5s", () => {
      const calls = RedisCtor.mock.calls as unknown as Array<
        [{ retryStrategy: (times: number) => number | null }]
      >;
      const options = calls.at(-1)![0];

      expect(options.retryStrategy(1)).toBe(200);
      expect(options.retryStrategy(4)).toBe(800);
      expect(options.retryStrategy(1_000)).toBe(5000);
      expect(options.retryStrategy(100_000)).not.toBeNull();
    });
  });

  describe("get", () => {
    it("should return parsed JSON for valid JSON string", async () => {
      mockRedisInstance.get.mockResolvedValue('{"name":"John"}');

      const result = await sut.get("key");

      expect(result).toEqual({ name: "John" });
      expect(mockRedisInstance.get).toHaveBeenCalledWith("key");
    });

    it("should treat a corrupt (non-JSON) value as a miss", async () => {
      mockRedisInstance.get.mockResolvedValue("plain-string");

      const result = await sut.get("key");

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should return null when key does not exist", async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await sut.get("missing-key");

      expect(result).toBeNull();
    });

    it("fails open (null) when the client is not ready", async () => {
      mockRedisInstance.status = "reconnecting";

      const result = await sut.get("key");

      expect(result).toBeNull();
      expect(mockRedisInstance.get).not.toHaveBeenCalled();
    });

    it("fails open (null) when the command rejects", async () => {
      mockRedisInstance.get.mockRejectedValue(new Error("connection reset"));

      const result = await sut.get("key");

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("set", () => {
    it("should call redis SET with EX and default TTL", async () => {
      await sut.set("key", "value");

      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        "key",
        "value",
        "EX",
        43200,
      );
    });

    it("should call redis SET with custom TTL", async () => {
      await sut.set("key", "value", 300);

      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        "key",
        "value",
        "EX",
        300,
      );
    });

    it("fails open (no-op) when the command rejects", async () => {
      mockRedisInstance.set.mockRejectedValue(new Error("connection reset"));

      await expect(sut.set("key", "value")).resolves.toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("skips the command when the client is not ready", async () => {
      mockRedisInstance.status = "end";

      await sut.set("key", "value");

      expect(mockRedisInstance.set).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should call redis DEL", async () => {
      await sut.delete("key");

      expect(mockRedisInstance.del).toHaveBeenCalledWith("key");
    });

    it("fails open (no-op) when the command rejects", async () => {
      mockRedisInstance.del.mockRejectedValue(new Error("connection reset"));

      await expect(sut.delete("key")).resolves.toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("exists", () => {
    it("should return true when redis.exists returns 1", async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      const result = await sut.exists("key");

      expect(result).toBe(true);
    });

    it("should return false when redis.exists returns 0", async () => {
      mockRedisInstance.exists.mockResolvedValue(0);

      const result = await sut.exists("key");

      expect(result).toBe(false);
    });

    it("fails open (false) when the command rejects", async () => {
      mockRedisInstance.exists.mockRejectedValue(new Error("connection reset"));

      const result = await sut.exists("key");

      expect(result).toBe(false);
    });
  });

  describe("increment (fail-closed)", () => {
    it("still throws CacheUnavailableError when the client is not ready", async () => {
      mockRedisInstance.status = "reconnecting";

      await expect(sut.increment("key", 60)).rejects.toBeInstanceOf(
        CacheUnavailableError,
      );
    });

    it("increments and applies the TTL when ready", async () => {
      const exec = vi.fn().mockResolvedValue([
        [null, 3],
        [null, 1],
      ]);
      mockRedisInstance.multi.mockReturnValue({
        incr: vi.fn(),
        expire: vi.fn(),
        exec,
      });

      const result = await sut.increment("key", 60);

      expect(result).toBe(3);
    });
  });

  describe("getStatus", () => {
    it("parses used_memory and uptime_in_seconds from INFO", async () => {
      mockRedisInstance.info.mockResolvedValue(
        "# Server\r\nredis_version:7.2.0\r\nuptime_in_seconds:7200\r\n# Memory\r\nused_memory:1048576\r\n",
      );

      const result = await sut.getStatus();

      expect(result).toEqual({
        reachable: true,
        usedMemoryBytes: 1048576,
        uptimeSeconds: 7200,
      });
    });

    it("returns reachable:false when the client is not ready", async () => {
      mockRedisInstance.status = "connecting";

      const result = await sut.getStatus();

      expect(result).toEqual({ reachable: false });
      expect(mockRedisInstance.info).not.toHaveBeenCalled();
    });

    it("returns reachable:false when INFO throws", async () => {
      mockRedisInstance.info.mockRejectedValue(new Error("connection lost"));

      const result = await sut.getStatus();

      expect(result).toEqual({ reachable: false });
    });
  });

  describe("disconnect", () => {
    it("quits the client and makes the provider unavailable", async () => {
      await sut.disconnect();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
      expect(sut.isAvailable()).toBe(false);
    });

    it("is a no-op when there is no client", async () => {
      await sut.disconnect();
      await expect(sut.disconnect()).resolves.toBeUndefined();
    });
  });
});
