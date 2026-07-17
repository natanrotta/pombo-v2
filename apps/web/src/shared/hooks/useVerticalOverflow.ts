import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

/**
 * Tracks vertical overflow state for a scroll container and exposes a
 * `scrollToBottom` helper. Pair with `<VerticalScrollArrow />` so an indicator
 * appears whenever there's content below the fold; hovering or clicking the
 * indicator jumps the user to the end of the list.
 */
export function useVerticalOverflow(deps: DependencyList = []) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollHeight > el.clientHeight + 1;
    setHasOverflow(overflows);
    setShowBottom(el.scrollTop < el.scrollHeight - el.clientHeight - 1);
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

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  const mouseHandlers = {
    onMouseEnter: useCallback(() => setIsHovered(true), []),
    onMouseLeave: useCallback(() => setIsHovered(false), []),
  };

  return {
    scrollRef,
    hasOverflow,
    isHovered,
    showBottom,
    handleScroll,
    scrollToBottom,
    mouseHandlers,
  };
}
