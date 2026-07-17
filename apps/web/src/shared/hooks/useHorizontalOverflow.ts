import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

const SCROLL_SPEED = 3.5;

/**
 * Hook: tracks horizontal-overflow state and drives hover-to-scroll behaviour
 * for any container with `overflowX: auto`. Used by `ScrollableTagList` (tag
 * pills on the contact card) and `CopilotActionBar` (copilot quick actions).
 *
 * Usage:
 *   const scroll = useHorizontalOverflow([items.length]);
 *   return (
 *     <Box position="relative" {...scroll.mouseHandlers}>
 *       <Flex ref={scroll.scrollRef} overflowX="auto" onScroll={scroll.handleScroll}>
 *         {children}
 *       </Flex>
 *       {scroll.hasOverflow && scroll.showLeft && (
 *         <HorizontalScrollArrow direction="left" visible={scroll.isHovered} ... />
 *       )}
 *     </Box>
 *   );
 *
 * @param deps Dependency list that triggers a fresh overflow measurement when
 *             its identity changes. Pass whatever signals the children set may
 *             have changed (typically `items.length` or the children array).
 */
export function useHorizontalOverflow(deps: DependencyList = []) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 1;
    setHasOverflow(overflows);
    setShowLeft(el.scrollLeft > 1);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-supplied deps signal when children changed
  }, [checkOverflow, ...deps]);

  const handleScroll = useCallback(() => {
    checkOverflow();
  }, [checkOverflow]);

  const startScrolling = useCallback(
    (direction: "left" | "right") => {
      const step = () => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft += direction === "right" ? SCROLL_SPEED : -SCROLL_SPEED;
        checkOverflow();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [checkOverflow]
  );

  const stopScrolling = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const mouseHandlers = {
    onMouseEnter: useCallback(() => setIsHovered(true), []),
    onMouseLeave: useCallback(() => {
      setIsHovered(false);
      stopScrolling();
    }, [stopScrolling]),
  };

  return {
    scrollRef,
    hasOverflow,
    isHovered,
    showLeft,
    showRight,
    handleScroll,
    startScrolling,
    stopScrolling,
    mouseHandlers,
  };
}
