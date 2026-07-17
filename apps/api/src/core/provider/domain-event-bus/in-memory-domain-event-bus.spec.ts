import { InMemoryDomainEventBus } from "./in-memory-domain-event-bus";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";

const makeLogger = (): ILoggerProvider => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
});

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("InMemoryDomainEventBus", () => {
  it("delivers a published event to a matching subscriber", async () => {
    const bus = new InMemoryDomainEventBus(makeLogger());
    const received: string[] = [];
    bus.subscribe("session.connected", async (event) => {
      received.push(event.identifier);
    });

    bus.publish({
      type: "session.connected",
      deviceId: "d1",
      identifier: "5599",
    });
    await flush();

    expect(received).toEqual(["5599"]);
  });

  it("does not deliver to subscribers of a different type", async () => {
    const bus = new InMemoryDomainEventBus(makeLogger());
    const handler = vi.fn();
    bus.subscribe("session.logged_out", handler);

    bus.publish({ type: "session.connected", deviceId: "d1", identifier: "x" });
    await flush();

    expect(handler).not.toHaveBeenCalled();
  });

  it("isolates a throwing handler and logs it — siblings still run", async () => {
    const logger = makeLogger();
    const bus = new InMemoryDomainEventBus(logger);
    const sibling = vi.fn();
    bus.subscribe("session.logged_out", async () => {
      throw new Error("boom");
    });
    bus.subscribe("session.logged_out", sibling);

    bus.publish({ type: "session.logged_out", deviceId: "d1" });
    await flush();

    expect(sibling).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
