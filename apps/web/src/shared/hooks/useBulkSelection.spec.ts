import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";

const showWarning = vi.fn();

vi.mock("@/shared/hooks/useNotify", () => ({
  useNotify: () => ({
    showWarning,
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showError: vi.fn(),
    showAutoSaved: vi.fn(),
  }),
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: "pt-BR" } }),
  };
});

import { useBulkSelection } from "./useBulkSelection";

interface Item {
  id: string;
}

function items(n: number): Item[] {
  return Array.from({ length: n }, (_, i) => ({ id: `item-${i}` }));
}

describe("useBulkSelection", () => {
  beforeEach(() => {
    showWarning.mockClear();
  });

  it("starts empty and not selecting", () => {
    const { result } = renderHook(() => useBulkSelection(items(5)));

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelecting).toBe(false);
    expect(result.current.allSelected).toBe(false);
  });

  it("toggles a single item in/out of the selection", () => {
    const { result } = renderHook(() => useBulkSelection(items(5)));

    act(() => result.current.toggleSelect("item-1"));
    expect(result.current.selectedIds.has("item-1")).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.toggleSelect("item-1"));
    expect(result.current.selectedIds.has("item-1")).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("selectAll picks every item up to maxSelection", () => {
    const { result } = renderHook(() => useBulkSelection(items(5), { maxSelection: 10 }));

    act(() => result.current.selectAll());
    expect(result.current.selectedCount).toBe(5);
    expect(result.current.allSelected).toBe(true);
  });

  it("selectAll caps at maxSelection and warns the user when exceeded", () => {
    const { result } = renderHook(() => useBulkSelection(items(60), { maxSelection: 50 }));

    act(() => result.current.selectAll());

    expect(result.current.selectedCount).toBe(50);
    expect(showWarning).toHaveBeenCalledTimes(1);
  });

  it("toggleSelect refuses to add beyond maxSelection and warns once", () => {
    const { result } = renderHook(() => useBulkSelection(items(10), { maxSelection: 2 }));

    act(() => result.current.toggleSelect("item-0"));
    act(() => result.current.toggleSelect("item-1"));
    act(() => result.current.toggleSelect("item-2"));
    act(() => result.current.toggleSelect("item-3"));

    expect(result.current.selectedCount).toBe(2);
    // Warning fires once even though two toggles were rejected.
    expect(showWarning).toHaveBeenCalledTimes(1);
  });

  it("startSelecting flips the mode and resets the warning latch", () => {
    const { result } = renderHook(() => useBulkSelection(items(3), { maxSelection: 1 }));

    act(() => result.current.toggleSelect("item-0"));
    act(() => result.current.toggleSelect("item-1")); // rejected → warns
    expect(showWarning).toHaveBeenCalledTimes(1);

    act(() => result.current.startSelecting());
    expect(result.current.isSelecting).toBe(true);

    act(() => result.current.toggleSelect("item-2")); // rejected again → warns once more
    expect(showWarning).toHaveBeenCalledTimes(2);
  });

  it("cancelSelection clears state and exits selecting mode", () => {
    const { result } = renderHook(() => useBulkSelection(items(3)));

    act(() => result.current.startSelecting());
    act(() => result.current.toggleSelect("item-0"));
    act(() => result.current.cancelSelection());

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("clears selection when resetDeps change", () => {
    const { result, rerender } = renderHook(
      ({ search }: { search: string }) => useBulkSelection(items(3), { resetDeps: [search] }),
      { initialProps: { search: "" } }
    );

    act(() => result.current.toggleSelect("item-0"));
    expect(result.current.selectedCount).toBe(1);

    rerender({ search: "alice" });
    expect(result.current.selectedCount).toBe(0);
  });
});
