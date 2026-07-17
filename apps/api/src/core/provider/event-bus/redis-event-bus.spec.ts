import "reflect-metadata";

const { mockRedisInstances, RedisCtor } = vi.hoisted(() => {
  const instances: Array<{
    publish: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
    quit: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    emit: (event: string, ...args: unknown[]) => void;
  }> = [];
  const ctor = vi.fn(() => {
    const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
    const instance = {
      publish: vi.fn().mockResolvedValue(1),
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue("OK"),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        (handlers[event] ??= []).push(handler);
      }),
      emit: (event: string, ...args: unknown[]) =>
        handlers[event]?.forEach((h) => h(...args)),
    };
    instances.push(instance);
    return instance;
  });
  return { mockRedisInstances: instances, RedisCtor: ctor };
});

vi.mock("ioredis", () => ({ default: RedisCtor }));

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
import { RedisEventBus } from "./redis-event-bus";

const logger: ILoggerProvider = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe("RedisEventBus", () => {
  let sut: RedisEventBus;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisInstances.length = 0;
    RedisCtor.mockClear();
    sut = new RedisEventBus(logger);
  });

  describe("publish", () => {
    it("forwards channel + payload to a lazy publisher client", async () => {
      await sut.publish("import-events:account-1", '{"type":"progress"}');

      expect(RedisCtor).toHaveBeenCalledTimes(1);
      const publisher = mockRedisInstances[0]!;
      expect(publisher.publish).toHaveBeenCalledWith(
        "import-events:account-1",
        '{"type":"progress"}',
      );
    });

    it("reuses the same publisher across calls", async () => {
      await sut.publish("ch", "a");
      await sut.publish("ch", "b");
      expect(RedisCtor).toHaveBeenCalledTimes(1);
    });

    it("swallows transport errors and logs a warning", async () => {
      await sut.publish("ch", "x");
      const publisher = mockRedisInstances[0]!;
      publisher.publish.mockRejectedValueOnce(new Error("redis down"));

      await expect(sut.publish("ch", "y")).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ service: "redis-event-bus", channel: "ch" }),
        expect.stringContaining("Failed to publish"),
      );
    });
  });

  describe("subscribe", () => {
    it("creates a dedicated client and subscribes to the channel", async () => {
      const handler = vi.fn();
      const sub = await sut.subscribe("import-events:account-1", handler);

      const subscriber = mockRedisInstances[0]!;
      expect(subscriber.subscribe).toHaveBeenCalledWith(
        "import-events:account-1",
      );
      expect(subscriber.on).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(sub).toBeDefined();
    });

    it("invokes the handler with the message payload (channel arg is dropped)", async () => {
      const handler = vi.fn();
      await sut.subscribe("ch", handler);

      const subscriber = mockRedisInstances[0]!;
      subscriber.emit("message", "ch", '{"x":1}');

      expect(handler).toHaveBeenCalledWith('{"x":1}');
    });

    it("unsubscribe + quit on subscription dispose", async () => {
      const sub = await sut.subscribe("ch", vi.fn());
      const subscriber = mockRedisInstances[0]!;

      await sub.unsubscribe();

      expect(subscriber.unsubscribe).toHaveBeenCalledWith("ch");
      expect(subscriber.quit).toHaveBeenCalled();
    });
  });

  describe("shutdown", () => {
    it("quits the publisher client when one was created", async () => {
      await sut.publish("ch", "x");
      const publisher = mockRedisInstances[0]!;

      await sut.shutdown();

      expect(publisher.quit).toHaveBeenCalled();
    });

    it("is a no-op when no publisher was ever lazily created", async () => {
      await expect(sut.shutdown()).resolves.toBeUndefined();
    });
  });
});
