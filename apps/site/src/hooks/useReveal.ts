import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/hooks/useGsap";

type RevealVariant = "slide-up" | "slide-left" | "slide-right" | "scale" | "fade" | "mask";

type Options = {
  variant?: RevealVariant;
  /** Child selector used to stagger children inside the container. */
  childSelector?: string;
  /** Delay before the reveal starts (seconds). */
  delay?: number;
  /** Stagger between children (seconds). */
  stagger?: number;
  /** Overall duration (seconds). */
  duration?: number;
  /** When the reveal should fire relative to the viewport. */
  start?: string;
};

/**
 * Drop-in scroll-reveal hook. Returns a ref to attach to the container.
 * The reveal runs once when the container enters the viewport.
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>({
  variant = "slide-up",
  childSelector,
  delay = 0,
  stagger = 0.08,
  duration = 0.9,
  start = "top 85%",
}: Options = {}) => {
  const ref = useRef<T | null>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const targets = childSelector ? gsap.utils.toArray<HTMLElement>(childSelector, root) : [root];
      if (targets.length === 0) return;

      const from = (() => {
        switch (variant) {
          case "slide-up":
            return { y: 60, opacity: 0 };
          case "slide-left":
            return { x: -80, opacity: 0 };
          case "slide-right":
            return { x: 80, opacity: 0 };
          case "scale":
            return { scale: 0.86, opacity: 0, transformOrigin: "50% 50%" };
          case "fade":
            return { opacity: 0 };
          case "mask":
            return { clipPath: "inset(0 100% 0 0)", opacity: 0 };
          default:
            return { opacity: 0 };
        }
      })();

      const to: gsap.TweenVars = {
        ...Object.fromEntries(
          Object.keys(from).map((key) => [
            key,
            key === "opacity"
              ? 1
              : key === "scale"
                ? 1
                : key === "clipPath"
                  ? "inset(0 0% 0 0)"
                  : 0,
          ])
        ),
        duration,
        delay,
        ease: "power3.out",
        stagger,
      };

      gsap.fromTo(targets, from, {
        ...to,
        scrollTrigger: {
          trigger: root,
          start,
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: ref, dependencies: [variant, childSelector, delay, stagger, duration, start] }
  );

  return ref;
};

export const refreshScrollTriggers = () => {
  ScrollTrigger.refresh();
};
