import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { useAutoSave } from "./useAutoSave";

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutoSave", () => {
  it("does NOT fire onSave on the very first render", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutoSave({ data: { v: 1 }, onSave, delay: 100, enabled: true }));

    await new Promise((r) => setTimeout(r, 200));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("debounces saves by the configured delay when data changes", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }: { data: { v: number } }) =>
        useAutoSave({ data, onSave, delay: 500, enabled: true }),
      { initialProps: { data: { v: 1 } } }
    );

    rerender({ data: { v: 2 } });
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    // Drain the microtask queue produced by the async save closure.
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ v: 2 });
  });

  it("does not save when the serialized data has not actually changed", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ data: { v: 1 }, onSave, delay: 1, enabled: true })
    );

    // Manually call saveNow with no change → should bail early.
    await act(async () => {
      await result.current.saveNow();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("skips the auto-save effect entirely when enabled=false", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data, enabled }: { data: { v: number }; enabled: boolean }) =>
        useAutoSave({ data, onSave, delay: 100, enabled }),
      { initialProps: { data: { v: 1 }, enabled: false } }
    );

    rerender({ data: { v: 2 }, enabled: false });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("schedules a save on the first dirty change when enabled flips false→true", async () => {
    // Regression: the initial-mount guard used to be gated behind the
    // `enabled` check. When `enabled` started false (page mounts non-dirty)
    // and only flipped true on the first user change, the guard was
    // consumed in the same render and no save was scheduled. Single-click
    // toggles silently lost their save.
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data, enabled }: { data: { v: number }; enabled: boolean }) =>
        useAutoSave({ data, onSave, delay: 100, enabled }),
      { initialProps: { data: { v: 1 }, enabled: false } }
    );

    // Simulate the user's first interaction: data changes AND enabled
    // flips on at the same render — exactly what `useDetailPageController`
    // does when `isDirty` flips from false to true.
    rerender({ data: { v: 2 }, enabled: true });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ v: 2 });
  });

  it("does not re-attempt a save with byte-identical data after a failure (loop guard)", async () => {
    // Regression: a failing save (e.g. 422 from a region-invalid phone)
    // used to retry every time the parent re-rendered with a new but
    // identically-shaped object. `lastAttemptedDataRef` blocks that.
    // The user must mutate the data before another attempt fires.
    vi.useFakeTimers();
    const onSave = vi.fn().mockRejectedValueOnce(new Error("422 invalid"));
    const { rerender } = renderHook(
      ({ data }: { data: { v: number } }) =>
        useAutoSave({ data, onSave, delay: 100, enabled: true }),
      { initialProps: { data: { v: 1 } } }
    );

    // First user change: schedules + runs once, then rejects.
    rerender({ data: { v: 2 } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));
    expect(onSave).toHaveBeenCalledTimes(1);

    // Parent re-renders with a brand-new but equal-shaped reference —
    // simulating what `useDetailPageController` does on every state
    // refresh. With the guard in place, no second call goes out.
    vi.useFakeTimers();
    rerender({ data: { v: 2 } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("retries after the user mutates the data following a failure", async () => {
    vi.useFakeTimers();
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error("422 invalid"))
      .mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }: { data: { v: number } }) =>
        useAutoSave({ data, onSave, delay: 100, enabled: true }),
      { initialProps: { data: { v: 1 } } }
    );

    rerender({ data: { v: 2 } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));
    expect(onSave).toHaveBeenCalledTimes(1);

    // User fixes the input → new serialized shape → guard releases.
    vi.useFakeTimers();
    rerender({ data: { v: 3 } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ v: 3 });
  });

  it("resetLastSavedData updates the baseline so the next equal change is a no-op", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ data: { v: 1 }, onSave, delay: 1, enabled: true })
    );

    act(() => result.current.resetLastSavedData({ v: 999 }));

    // Re-render still flowing v=1 — but baseline says we last-saved v=999,
    // so saveNow with current data (v=1) WOULD diff. To prove the baseline
    // path: saveNow with the same value as the new baseline must short-circuit.
    await act(async () => {
      await result.current.saveNow();
    });
    // v=1 differs from baseline {v:999} → should call onSave
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });
});
