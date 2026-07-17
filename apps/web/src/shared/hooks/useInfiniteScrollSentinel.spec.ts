import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInfiniteScrollSentinel } from "./useInfiniteScrollSentinel";

type IOEntry = { isIntersecting: boolean; target: Element };
type IOCallback = (entries: IOEntry[]) => void;

interface MockObserver {
  callback: IOCallback;
  options: IntersectionObserverInit | undefined;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (isIntersecting: boolean) => void;
}

const observers: MockObserver[] = [];

class TestIntersectionObserver implements MockObserver {
  callback: IOCallback;
  options: IntersectionObserverInit | undefined;
  observe = vi.fn();
  disconnect = vi.fn();
  private observedNode: Element | null = null;

  constructor(callback: IOCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    this.observe = vi.fn((node: Element) => {
      this.observedNode = node;
    });
    observers.push(this);
  }

  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);

  trigger(isIntersecting: boolean) {
    if (!this.observedNode) throw new Error("trigger() before observe()");
    this.callback([{ isIntersecting, target: this.observedNode }]);
  }
}

beforeEach(() => {
  observers.length = 0;
  // Override the jsdom stub from setup.ts with a controllable mock.
  (window as unknown as Record<string, unknown>).IntersectionObserver = TestIntersectionObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function latestObserver() {
  return observers[observers.length - 1];
}

describe("useInfiniteScrollSentinel", () => {
  it("attaches an observer when the sentinel mounts and disconnects when it unmounts", () => {
    const fetchNextPage = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScrollSentinel({
        fetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      })
    );

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    const observer = latestObserver();
    expect(observer.observe).toHaveBeenCalledWith(node);

    act(() => result.current.sentinelRef(null));
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("calls fetchNextPage only when intersecting AND hasNextPage AND !isFetchingNextPage", () => {
    const fetchNextPage = vi.fn();
    const { result, rerender } = renderHook(
      ({ hasNextPage, isFetchingNextPage }) =>
        useInfiniteScrollSentinel({
          fetchNextPage,
          hasNextPage,
          isFetchingNextPage,
        }),
      { initialProps: { hasNextPage: true, isFetchingNextPage: false } }
    );

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    // Not intersecting → no fetch.
    act(() => latestObserver().trigger(false));
    expect(fetchNextPage).not.toHaveBeenCalled();

    // Intersecting + hasNextPage + !isFetchingNextPage → fetch.
    act(() => latestObserver().trigger(true));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    // hasNextPage flips false (last page) → no further fetch.
    rerender({ hasNextPage: false, isFetchingNextPage: false });
    act(() => latestObserver().trigger(true));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    // Already fetching → no duplicate fetch.
    rerender({ hasNextPage: true, isFetchingNextPage: true });
    act(() => latestObserver().trigger(true));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("works when the sentinel mounts after the first render (the AnimatePresence regression)", () => {
    const fetchNextPage = vi.fn();
    const { result, rerender } = renderHook(
      ({ hasNextPage }) =>
        useInfiniteScrollSentinel({
          fetchNextPage,
          hasNextPage,
          isFetchingNextPage: false,
        }),
      { initialProps: { hasNextPage: false } }
    );

    // First commit: data branch not in DOM yet. No observer.
    expect(observers).toHaveLength(0);

    // Data arrives, hasNextPage flips, BUT the sentinel is still not mounted
    // (mode="wait" delays mount until exit animation finishes).
    rerender({ hasNextPage: true });
    expect(observers).toHaveLength(0);

    // Animation completes: sentinel mounts. Observer should attach now.
    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));
    expect(observers).toHaveLength(1);
    expect(latestObserver().observe).toHaveBeenCalledWith(node);

    // It triggers a fetch on intersection.
    act(() => latestObserver().trigger(true));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("re-attaches the observer with the correct root when rootRef binds late", () => {
    const fetchNextPage = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScrollSentinel({
        fetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      })
    );

    const sentinelNode = document.createElement("div");
    const rootNode = document.createElement("div");

    // Sentinel ref binds first (DFS post-order in commit phase) — observer
    // attaches with a viewport (null) root.
    act(() => result.current.sentinelRef(sentinelNode));
    const firstObserver = latestObserver();
    expect(firstObserver.options?.root ?? null).toBe(null);

    // Root ref binds afterwards — hook re-renders with the new root, the
    // sentinel ref identity changes, React re-runs it, observer is rebuilt
    // with the correct root.
    act(() => result.current.rootRef(rootNode));
    act(() => result.current.sentinelRef(sentinelNode));
    expect(firstObserver.disconnect).toHaveBeenCalled();
    const secondObserver = latestObserver();
    expect(secondObserver).not.toBe(firstObserver);
    expect(secondObserver.options?.root).toBe(rootNode);
  });

  it("re-observes when hasNextPage flips false → true so an already-visible sentinel reloads", () => {
    // Repro of the post-import bug: a list short enough to fit fully in the
    // viewport keeps the sentinel permanently intersecting. While the page
    // had `hasNextPage=false` (single-row dataset), the observer's initial
    // callback fired, was rejected by the guard, and never fired again.
    // After a CSV import grew the dataset to multiple pages, `hasNextPage`
    // flipped to true — but IntersectionObserver only fires on intersection
    // *transitions*, so the next page was never requested.
    const fetchNextPage = vi.fn();
    const { result, rerender } = renderHook(
      ({ hasNextPage }) =>
        useInfiniteScrollSentinel({
          fetchNextPage,
          hasNextPage,
          isFetchingNextPage: false,
        }),
      { initialProps: { hasNextPage: false } }
    );

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    // Sentinel intersects, but `hasNextPage` is false → guard rejects.
    act(() => latestObserver().trigger(true));
    expect(fetchNextPage).not.toHaveBeenCalled();

    const observerBeforeFlip = latestObserver();

    // Source data grows (e.g. import completed) → `hasNextPage` flips to
    // true. The observer should be re-attached so its initial callback
    // fires against the still-visible sentinel.
    rerender({ hasNextPage: true });

    expect(observerBeforeFlip.disconnect).toHaveBeenCalled();
    const observerAfterFlip = latestObserver();
    expect(observerAfterFlip).not.toBe(observerBeforeFlip);
    expect(observerAfterFlip.observe).toHaveBeenCalledWith(node);

    // The freshly attached observer fires its initial callback — guard now
    // passes, fetchNextPage is requested.
    act(() => observerAfterFlip.trigger(true));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("uses the latest fetchNextPage closure without re-creating the observer", () => {
    const firstFetch = vi.fn();
    const secondFetch = vi.fn();
    const { result, rerender } = renderHook(
      ({ fetchNextPage }) =>
        useInfiniteScrollSentinel({
          fetchNextPage,
          hasNextPage: true,
          isFetchingNextPage: false,
        }),
      { initialProps: { fetchNextPage: firstFetch } }
    );

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));
    const observer = latestObserver();

    // Swap fetchNextPage. The hook must NOT tear down the observer for this.
    rerender({ fetchNextPage: secondFetch });
    expect(observer.disconnect).not.toHaveBeenCalled();

    act(() => observer.trigger(true));
    expect(firstFetch).not.toHaveBeenCalled();
    expect(secondFetch).toHaveBeenCalledTimes(1);
  });
});
