import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteScrollSentinelOptions {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Defaults to "200px" — start prefetching slightly before the sentinel. */
  rootMargin?: string;
  /** Defaults to 0.1 — fire as soon as ~10% of the sentinel is visible. */
  threshold?: number;
}

interface UseInfiniteScrollSentinelResult {
  /** Ref callback for the sentinel element observed by IntersectionObserver. */
  sentinelRef: (node: Element | null) => void;
  /**
   * Optional ref callback for a custom scroll root (e.g. a modal body or
   * popover). Wire it up only when the observer should NOT fall back to the
   * viewport. State-tracked so observer re-binds when the root mounts late.
   */
  rootRef: (node: Element | null) => void;
}

/**
 * Robust infinite-scroll sentinel.
 *
 * The classic `useRef + useEffect(observer.observe(ref.current))` pattern
 * silently breaks whenever the sentinel mounts late — including inside
 * `<AnimatePresence mode="wait">`, where the data branch waits for the
 * skeleton's exit animation to finish. By the time the sentinel is in the
 * DOM, the effect's dependencies have settled and it does not re-run, so
 * the observer never attaches.
 *
 * This hook uses callback refs instead. They run synchronously at mount and
 * unmount, regardless of animation timing or conditional rendering, so the
 * observer can never miss the sentinel.
 */
export function useInfiniteScrollSentinel({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = "200px",
  threshold = 0.1,
}: UseInfiniteScrollSentinelOptions): UseInfiniteScrollSentinelResult {
  // Mirror the latest values into refs so the IntersectionObserver callback
  // (created once per attachment) always reads fresh state without forcing
  // the observer to be torn down on every render.
  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
    hasNextPageRef.current = hasNextPage;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // The custom scroll root is tracked as state so that mounting the root
  // late (typical for modals/popovers, where the parent ref binds AFTER the
  // sentinel ref in commit DFS post-order) triggers a re-render and a fresh
  // sentinelRef identity, which re-attaches the observer with the correct
  // root.
  const [root, setRoot] = useState<Element | null>(null);
  const rootRef = useCallback((node: Element | null) => {
    setRoot(node);
  }, []);

  const observerRef = useRef<IntersectionObserver | null>(null);
  // Latest sentinel node, kept so we can re-observe when `hasNextPage`
  // flips from false to true. IntersectionObserver only fires its callback
  // on intersection-state transitions; if the sentinel was already
  // intersecting before `hasNextPage` became true (e.g. after a list
  // refetched in-place and the page is short enough that the sentinel is
  // permanently in the viewport), the observer never re-fires and the next
  // page is never requested. Re-observing forces a fresh initial callback.
  const sentinelNodeRef = useRef<Element | null>(null);

  const attachObserver = useCallback(
    (node: Element) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          if (!hasNextPageRef.current) return;
          if (isFetchingNextPageRef.current) return;
          fetchNextPageRef.current();
        },
        { root, rootMargin, threshold }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [root, rootMargin, threshold]
  );

  const sentinelRef = useCallback(
    (node: Element | null) => {
      sentinelNodeRef.current = node;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      attachObserver(node);
    },
    [attachObserver]
  );

  // Re-observe when `hasNextPage` transitions to true so an already-visible
  // sentinel triggers a fresh initial callback. Without this, lists that
  // fit fully in the viewport never load page 2 after the source data grows
  // (e.g. after a CSV import refetches the contacts list in place).
  useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelNodeRef.current;
    if (!node) return;
    attachObserver(node);
  }, [hasNextPage, attachObserver]);

  return { sentinelRef, rootRef };
}
