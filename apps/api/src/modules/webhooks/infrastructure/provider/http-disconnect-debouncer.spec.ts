import { HttpDisconnectDebouncer } from "./http-disconnect-debouncer";
import { mockAppConfig } from "@test/mocks";

describe("HttpDisconnectDebouncer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = () => {
    const debouncer = new HttpDisconnectDebouncer(
      mockAppConfig({ DISCONNECT_DEBOUNCE_MS: 1000 }),
    );
    const flushed: { deviceId: string; reason: string }[] = [];
    debouncer.setOnFlush((deviceId, reason) =>
      flushed.push({ deviceId, reason }),
    );
    return { debouncer, flushed };
  };

  it("flushes exactly one disconnect when the drop persists past the window", () => {
    const { debouncer, flushed } = make();
    debouncer.schedule("d1", "dropped");

    vi.advanceTimersByTime(1000);

    expect(flushed).toEqual([{ deviceId: "d1", reason: "dropped" }]);
  });

  it("cancels a pending disconnect (a reconnect within the window)", () => {
    const { debouncer, flushed } = make();
    debouncer.schedule("d1", "dropped");
    debouncer.cancel("d1");

    vi.advanceTimersByTime(1000);

    expect(flushed).toEqual([]);
  });

  it("re-arming restarts the window and carries the latest reason", () => {
    const { debouncer, flushed } = make();
    debouncer.schedule("d1", "first");
    vi.advanceTimersByTime(500);
    debouncer.schedule("d1", "second");
    vi.advanceTimersByTime(500);
    expect(flushed).toEqual([]); // window restarted, not yet flushed
    vi.advanceTimersByTime(500);
    expect(flushed).toEqual([{ deviceId: "d1", reason: "second" }]);
  });
});
