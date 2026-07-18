export const semanticTokens = {
  colors: {
    "bg.canvas": {
      default: "#f6f4f1",
      _dark: "#100f0e",
    },
    "bg.surface": {
      default: "#ffffff",
      _dark: "#1a1917",
    },
    "bg.elevated": {
      default: "#ffffff",
      _dark: "#211f1c",
    },
    "bg.sunken": {
      default: "#efece8",
      _dark: "#0c0b0a",
    },
    "bg.muted": {
      default: "neutral.50",
      _dark: "rgba(255, 255, 255, 0.04)",
    },
    "bg.hover": {
      default: "neutral.100",
      _dark: "rgba(255, 255, 255, 0.07)",
    },
    "bg.active": {
      default: "neutral.200",
      _dark: "rgba(255, 255, 255, 0.11)",
    },
    "bg.glass": {
      default: "rgba(255, 255, 255, 0.80)",
      _dark: "rgba(26, 25, 23, 0.78)",
    },
    "bg.topbar": {
      default: "rgba(255, 255, 255, 0.92)",
      _dark: "rgba(26, 25, 23, 0.88)",
    },
    "bg.brand.subtle": {
      default: "brand.50",
      // Faint warm-graphite wash on the dark canvas (matches the grayscale brand).
      _dark: "rgba(150, 142, 133, 0.14)",
    },
    "bg.brand.emphasis": {
      default: "brand.800",
      _dark: "brand.200",
    },
    // Brand button states — monochrome CTA. Light mode reads near-black
    // (brand.800/900) with white text; dark mode inverts to a light-gray
    // pill (brand.200/100) with near-black text. Consumed by the Button
    // "solid" variant via `text.onBrand`.
    "bg.brand.solid": {
      default: "brand.800",
      _dark: "brand.200",
    },
    "bg.brand.solid-hover": {
      default: "brand.900",
      _dark: "brand.100",
    },
    "bg.brand.solid-active": {
      default: "brand.700",
      _dark: "brand.300",
    },
    "bg.accent.subtle": {
      default: "accent.50",
      _dark: "rgba(50, 200, 159, 0.14)",
    },
    "bg.overlay": {
      default: "blackAlpha.400",
      _dark: "rgba(0, 0, 0, 0.72)",
    },

    "text.primary": {
      default: "#292524",
      _dark: "#f1f0f3",
    },
    "text.secondary": {
      default: "#57534e",
      _dark: "#a8a6b1",
    },
    "text.muted": {
      default: "neutral.400",
      // ≈ 4.6:1 contrast on bg.surface (#1a1917) — meets WCAG AA for body text
      _dark: "#83828d",
    },
    "text.disabled": {
      default: "neutral.300",
      _dark: "#48474f",
    },
    "text.inverse": {
      default: "#ffffff",
      _dark: "#100f0e",
    },
    "text.link": {
      default: "brand.600",
      _dark: "brand.300",
    },
    "text.brand": {
      default: "brand.600",
      _dark: "brand.300",
    },
    "text.accent": {
      default: "accent.600",
      _dark: "accent.300",
    },
    // Text/icon color that sits ON the solid brand button. Light: white on
    // the near-black CTA. Dark: near-black on the light-gray CTA pill.
    "text.onBrand": {
      default: "#ffffff",
      _dark: "#1a1817",
    },

    "border.subtle": {
      default: "rgba(41, 37, 36, 0.07)",
      _dark: "rgba(255, 255, 255, 0.06)",
    },
    "border.default": {
      default: "rgba(41, 37, 36, 0.12)",
      _dark: "rgba(255, 255, 255, 0.11)",
    },
    "border.strong": {
      default: "rgba(41, 37, 36, 0.20)",
      _dark: "rgba(255, 255, 255, 0.20)",
    },
    "border.brand": {
      // brand.200 was too faint as a graphite outline on white — bump to
      // brand.400 so a "brand" border is actually visible in light mode.
      default: "brand.400",
      _dark: "brand.500",
    },
    // Accent (green) callout border. Pairs with `bg.accent.subtle`: the dark
    // value is a translucent green from the same (50,200,159) family + 0.30
    // alpha (mirrors `status.success.border`), so it reads as a soft outline
    // over the dark surface instead of a muddy solid green.
    "border.accent": {
      default: "accent.200",
      _dark: "rgba(50, 200, 159, 0.30)",
    },
    "border.focus": {
      default: "brand.400",
      _dark: "brand.300",
    },

    "status.success.fg": { default: "green.600", _dark: "green.300" },
    "status.success.bg": { default: "green.50", _dark: "rgba(34, 197, 94, 0.12)" },
    "status.success.border": { default: "green.200", _dark: "rgba(34, 197, 94, 0.30)" },

    // Warning deliberately maps to a purple/caution palette (not yellow/orange) —
    // project memory: never use yellow/orange tones in the UI.
    "status.warning.fg": { default: "purple.600", _dark: "purple.300" },
    "status.warning.bg": { default: "purple.50", _dark: "rgba(168, 85, 247, 0.12)" },
    "status.warning.border": { default: "purple.200", _dark: "rgba(168, 85, 247, 0.30)" },

    "status.error.fg": { default: "red.600", _dark: "red.300" },
    "status.error.bg": { default: "red.50", _dark: "rgba(239, 68, 68, 0.12)" },
    "status.error.border": { default: "red.200", _dark: "rgba(239, 68, 68, 0.30)" },

    // Info maps to the warm grayscale brand family — a neutral graphite callout
    // (the dark rgba is warm graphite, not the old blue).
    "status.info.fg": { default: "brand.600", _dark: "brand.300" },
    "status.info.bg": { default: "brand.50", _dark: "rgba(150, 142, 133, 0.14)" },
    "status.info.border": { default: "brand.300", _dark: "rgba(150, 142, 133, 0.32)" },

    "status.neutral.fg": { default: "neutral.600", _dark: "#a8a6b1" },
    "status.neutral.bg": { default: "neutral.100", _dark: "rgba(255, 255, 255, 0.06)" },
    "status.neutral.border": { default: "neutral.200", _dark: "rgba(255, 255, 255, 0.12)" },

    // Gold — INTENTIONAL, SCOPED exception to the project's no-yellow/orange/amber
    // rule. A favorite/primary "star" is conventionally gold and reads wrong in any
    // other color; per explicit product request this is the ONE place gold is
    // allowed. Use ONLY for the primary/favorite star affordance — never for
    // status, warnings, or general accents (warnings stay purple). Dark uses a
    // brighter gold for contrast on the dark surface.
    "accent.gold": { default: "#E0A500", _dark: "#FACC15" },
  },
  shadows: {
    // Surface separation is carried by borders + a soft WARM-charcoal shadow
    // (was cold slate). Cards rely on a 1px border + tiny shadow; only panels
    // and overlays get a real, soft shadow.
    "shadow.card": {
      default: "0px 1px 2px rgba(41, 37, 36, 0.06), 0px 4px 12px -2px rgba(41, 37, 36, 0.08)",
      _dark: "0px 1px 0 rgba(0, 0, 0, 0.20)",
    },
    "shadow.cardHover": {
      default: "0px 4px 8px rgba(41, 37, 36, 0.06), 0px 12px 28px -4px rgba(41, 37, 36, 0.12)",
      _dark: "0px 0 0 1px rgba(255, 255, 255, 0.04), 0px 8px 24px -8px rgba(0, 0, 0, 0.55)",
    },
    "shadow.panel": {
      default: "0px 8px 24px -4px rgba(41, 37, 36, 0.14), 0px 2px 6px rgba(41, 37, 36, 0.06)",
      _dark: "0px 12px 32px -8px rgba(0, 0, 0, 0.55), 0px 2px 6px rgba(0, 0, 0, 0.35)",
    },
    "shadow.lg": {
      default: "0px 16px 40px -8px rgba(41, 37, 36, 0.16), 0px 4px 12px rgba(41, 37, 36, 0.06)",
      _dark: "0px 20px 48px -12px rgba(0, 0, 0, 0.60), 0px 4px 12px rgba(0, 0, 0, 0.35)",
    },
    "shadow.inner": {
      default: "inset 0 2px 4px 0 rgba(41, 37, 36, 0.06)",
      _dark: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.30)",
    },
    // Focus-related shadows use bare keys (no `shadow.` prefix) so they
    // override Chakra's default focus lookup AND existing consumers like
    // `boxShadow: "input-focus"` keep working without edits. Dark mode lifts
    // alpha so the ring still reads on the dark canvas.
    outline: {
      // Warm-graphite focus ring (was cold graphite) — light uses a mid warm
      // charcoal, dark lifts to a light warm-gray so the ring reads on canvas.
      default: "0 0 0 3px rgba(107, 101, 96, 0.35)",
      _dark: "0 0 0 3px rgba(195, 188, 181, 0.45)",
    },
    "input-focus": {
      default: "0 0 0 3px rgba(107, 101, 96, 0.18)",
      _dark: "0 0 0 3px rgba(195, 188, 181, 0.28)",
    },
    "input-error": {
      default: "0 0 0 3px rgba(245, 101, 101, 0.12)",
      _dark: "0 0 0 3px rgba(252, 165, 165, 0.22)",
    },
    "input-error-focus": {
      default: "0 0 0 3px rgba(245, 101, 101, 0.20)",
      _dark: "0 0 0 3px rgba(252, 165, 165, 0.32)",
    },
    "brand-glow": {
      // Warm-graphite glow to match the grayscale brand (was cold).
      default: "0px 0px 0px 3px rgba(107, 101, 96, 0.20), 0px 4px 12px rgba(107, 101, 96, 0.15)",
      _dark: "0px 0px 0px 3px rgba(195, 188, 181, 0.18), 0px 4px 12px rgba(150, 142, 133, 0.18)",
    },
    "accent-glow": {
      default: "0px 0px 0px 3px rgba(30, 178, 138, 0.20), 0px 4px 12px rgba(30, 178, 138, 0.15)",
      _dark: "0px 0px 0px 3px rgba(93, 220, 182, 0.16), 0px 4px 12px rgba(50, 200, 159, 0.18)",
    },
  },
};
