import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useDebounce } from "./useDebounce";

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("returns the initial value immediately on first render", () => {
    const { result } = renderHook(() => useDebounce("hello", 200));
    expect(result.current).toBe("hello");
  });

  it("debounces value changes by the configured delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: "first" } }
    );
    expect(result.current).toBe("first");

    rerender({ value: "second" });
    // Still showing the old value before the delay elapses.
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("second");
  });

  it("cancels the previous timer when value changes mid-flight", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 500),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 400ms elapsed but only the second pending timer survived → still "a".
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Now 500ms after the latest rerender → fires "c", skipping "b" entirely.
    expect(result.current).toBe("c");
  });
});
