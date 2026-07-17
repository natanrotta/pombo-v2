import { Fragment, useRef } from "react";
import { Box, chakra } from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";
import { gsap, useGSAP } from "@/hooks/useGsap";

const Letter = chakra("span");

export type ScatterSegment = { text: string; gradient?: boolean };

type TextScatterProps = BoxProps & {
  /** Each inner array is a line; each segment can opt into the brand gradient. */
  lines: ScatterSegment[][];
  /** Cursor influence radius in px. */
  radius?: number;
  /** Max displacement in px. */
  strength?: number;
};

/**
 * Interactive letter-scatter headline. Letters fly in on mount and are repelled
 * by the pointer; they spring back when it moves away. Falls back to plain,
 * fully-visible text on touch devices and when reduced motion is requested.
 */
export const TextScatter = ({ lines, radius = 130, strength = 70, ...rest }: TextScatterProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const letters = gsap.utils.toArray<HTMLElement>("[data-scatter-letter]", root);
      if (!letters.length) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;

      if (reduce) {
        gsap.set(letters, { opacity: 1, yPercent: 0 });
      } else {
        gsap.from(letters, {
          yPercent: 120,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.02,
        });
      }

      if (reduce || !fine) return;

      // quickSetter is GSAP's lowest-overhead writer; we drive a per-frame lerp
      // ourselves so the motion is one continuous spring instead of a tween that
      // restarts its ease on every pointer move (that restart is what feels janky).
      const setX = letters.map((el) => gsap.quickSetter(el, "x", "px"));
      const setY = letters.map((el) => gsap.quickSetter(el, "y", "px"));
      const setR = letters.map((el) => gsap.quickSetter(el, "rotation", "deg"));
      const cur = letters.map(() => ({ x: 0, y: 0, r: 0 }));

      // Base centers are layout positions (unaffected by the x/y transforms),
      // cached so the loop doesn't thrash layout reading each letter's rect.
      let bases: { x: number; y: number }[] = [];
      const measure = () => {
        bases = letters.map((el) => ({
          x: el.offsetLeft + el.offsetWidth / 2,
          y: el.offsetTop + el.offsetHeight / 2,
        }));
      };
      measure();

      const EASE = 0.18;
      let mx = -99999;
      let my = -99999;
      let raf = 0;

      const tick = () => {
        const rect = root.getBoundingClientRect();
        let alive = false;
        for (let i = 0; i < letters.length; i++) {
          const cx = rect.left + bases[i].x;
          const cy = rect.top + bases[i].y;
          const dx = cx - mx;
          const dy = cy - my;
          const dist = Math.hypot(dx, dy);
          let tx = 0;
          let ty = 0;
          let tr = 0;
          if (dist < radius) {
            const f = 1 - dist / radius;
            const ang = Math.atan2(dy, dx);
            tx = Math.cos(ang) * f * strength;
            ty = Math.sin(ang) * f * strength;
            tr = (i % 2 ? 1 : -1) * f * 22;
            alive = true;
          }
          const c = cur[i];
          c.x += (tx - c.x) * EASE;
          c.y += (ty - c.y) * EASE;
          c.r += (tr - c.r) * EASE;
          setX[i](c.x);
          setY[i](c.y);
          setR[i](c.r);
          if (Math.abs(c.x) > 0.05 || Math.abs(c.y) > 0.05 || Math.abs(c.r) > 0.05) {
            alive = true;
          }
        }
        raf = alive ? requestAnimationFrame(tick) : 0;
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const onMove = (e: PointerEvent) => {
        mx = e.clientX;
        my = e.clientY;
        kick();
      };
      const reset = () => {
        mx = -99999;
        my = -99999;
        kick();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", measure);
      root.addEventListener("pointerleave", reset);

      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", measure);
        root.removeEventListener("pointerleave", reset);
        if (raf) cancelAnimationFrame(raf);
      };
    },
    { scope: ref }
  );

  return (
    <Box ref={ref} position="relative" {...rest}>
      {lines.map((line, li) => {
        // Group letters into words so a line only ever wraps BETWEEN words —
        // each word is an inline-block/nowrap unit, never split mid-word.
        const words: { text: string; gradient?: boolean }[] = [];
        line.forEach((seg) => {
          seg.text
            .split(/\s+/)
            .filter(Boolean)
            .forEach((w) => words.push({ text: w, gradient: seg.gradient }));
        });
        return (
          <Box as="span" display="block" key={li}>
            {words.map((word, wi) => (
              <Fragment key={wi}>
                {wi > 0 ? " " : null}
                <Box as="span" display="inline-block" whiteSpace="nowrap">
                  {[...word.text].map((ch, ci) => (
                    <Letter
                      key={ci}
                      data-scatter-letter
                      display="inline-block"
                      willChange="transform"
                      {...(word.gradient
                        ? {
                            bgGradient: "linear(135deg, brand.500, accent.500)",
                            bgClip: "text",
                            sx: { WebkitTextFillColor: "transparent" },
                          }
                        : {})}
                    >
                      {ch}
                    </Letter>
                  ))}
                </Box>
              </Fragment>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};
