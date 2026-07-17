import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useConfirm } from "./useConfirm";

describe("useConfirm", () => {
  it("starts closed with no pending id", () => {
    const { result } = renderHook(() => useConfirm());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingId).toBeNull();
  });

  it("opens the dialog when requestConfirm is called", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.requestConfirm("entity-1");
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.pendingId).toBe("entity-1");
  });

  it("closes without executing the action on cancel", () => {
    const { result } = renderHook(() => useConfirm());
    const action = vi.fn();

    act(() => result.current.requestConfirm("entity-1"));
    act(() => result.current.cancel());

    expect(result.current.isOpen).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it("invokes the action with the pending id and clears state on confirm", () => {
    const { result } = renderHook(() => useConfirm());
    const action = vi.fn();

    act(() => result.current.requestConfirm("entity-7"));
    act(() => result.current.confirm(action));

    expect(action).toHaveBeenCalledWith("entity-7");
    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingId).toBeNull();
  });

  it("does not invoke the action when there is no pending id", () => {
    const { result } = renderHook(() => useConfirm());
    const action = vi.fn();

    act(() => result.current.confirm(action));

    expect(action).not.toHaveBeenCalled();
  });
});
