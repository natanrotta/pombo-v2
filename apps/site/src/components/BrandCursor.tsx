import { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { Global } from "@emotion/react";

const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label, [data-cursor]";
const DEFAULT_LABEL = "Boilerplate";

/**
 * Brand custom cursor: a gradient arrow tracks the pointer while a pill label
 * trails behind it with a soft spring and tilts with the pointer's velocity.
 * The label shows {DEFAULT_LABEL} by default; any element can override it via
 * `data-cursor-label`. Active only on fine pointers with motion enabled — touch
 * and reduced-motion keep the native cursor untouched.
 */
export const BrandCursor = () => {
  const arrowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const arrow = arrowRef.current;
    const label = labelRef.current;
    if (!arrow || !label) return;

    document.documentElement.classList.add("brand-cursor-active");
    label.textContent = DEFAULT_LABEL;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let ax = mx;
    let ay = my;
    let lx = mx;
    let ly = my;
    let prevMx = mx;
    let tilt = 0;
    let pressed = false;
    let visible = false;
    let raf = 0;

    const show = (v: boolean) => {
      visible = v;
      arrow.style.opacity = v ? "1" : "0";
      label.style.opacity = v ? "1" : "0";
    };

    const tick = () => {
      ax += (mx - ax) * 0.4;
      ay += (my - ay) * 0.4;
      lx += (mx - lx) * 0.16;
      ly += (my - ly) * 0.16;
      const vx = mx - prevMx;
      prevMx = mx;
      const targetTilt = Math.max(-12, Math.min(12, vx * 0.5));
      tilt += (targetTilt - tilt) * 0.2;

      arrow.style.transform = `translate(${ax}px, ${ay}px) translate(-5px, -4px) scale(${
        pressed ? 0.82 : 1
      })`;
      label.style.transform = `translate(${lx}px, ${ly}px) translate(22px, 10px) rotate(${tilt}deg)`;

      const settled =
        Math.abs(mx - ax) < 0.1 &&
        Math.abs(my - ay) < 0.1 &&
        Math.abs(mx - lx) < 0.1 &&
        Math.abs(my - ly) < 0.1 &&
        Math.abs(tilt) < 0.1 &&
        !pressed;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) show(true);
      kick();
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(INTERACTIVE) as
        | HTMLElement
        | null
        | undefined;
      label.textContent = el?.getAttribute("data-cursor-label") || DEFAULT_LABEL;
    };
    const onLeave = () => show(false);
    const onDown = () => {
      pressed = true;
      kick();
    };
    const onUp = () => {
      pressed = false;
      kick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("brand-cursor-active");
    };
  }, []);

  return (
    <Box display={{ base: "none", md: "block" }} aria-hidden>
      <Global
        styles={{
          "html.brand-cursor-active, html.brand-cursor-active *": {
            cursor: "none !important",
          },
        }}
      />
      <Box
        ref={arrowRef}
        position="fixed"
        top={0}
        left={0}
        zIndex={99999}
        pointerEvents="none"
        opacity={0}
        sx={{ transition: "opacity 200ms ease", transformOrigin: "top left" }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          style={{
            display: "block",
            filter: "drop-shadow(0 4px 10px rgba(47, 128, 237, 0.4))",
          }}
        >
          <defs>
            <linearGradient id="brand-cursor-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2f80ed" />
              <stop offset="100%" stopColor="#1eb28a" />
            </linearGradient>
          </defs>
          <path
            d="M5 3.5 L21 12 L13 13.2 L10.5 21 Z"
            fill="url(#brand-cursor-grad)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      <Box
        ref={labelRef}
        position="fixed"
        top={0}
        left={0}
        zIndex={99999}
        pointerEvents="none"
        px={3}
        py={1}
        borderRadius="full"
        bgGradient="linear(135deg, brand.500, accent.500)"
        color="white"
        fontSize="sm"
        fontWeight="700"
        whiteSpace="nowrap"
        opacity={0}
        boxShadow="0 6px 18px -4px rgba(47, 128, 237, 0.5)"
        sx={{ transition: "opacity 200ms ease", transformOrigin: "left center" }}
      />
    </Box>
  );
};
