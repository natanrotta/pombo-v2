export const semanticTokens = {
  colors: {
    "bg.canvas": {
      default: "#f3f7fc",
      _dark: "#0d0d10",
    },
    "bg.surface": {
      default: "#ffffff",
      _dark: "#16161b",
    },
    "bg.elevated": {
      default: "#ffffff",
      _dark: "#1d1d23",
    },
    "bg.sunken": {
      default: "#f0f4f8",
      _dark: "#0a0a0d",
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
      _dark: "rgba(22, 22, 27, 0.78)",
    },
    "bg.topbar": {
      default: "rgba(255, 255, 255, 0.92)",
      _dark: "rgba(22, 22, 27, 0.88)",
    },
    "bg.brand.subtle": {
      default: "brand.50",
      _dark: "rgba(95, 161, 255, 0.14)",
    },
    "bg.brand.emphasis": {
      default: "brand.500",
      _dark: "brand.400",
    },
    // Brand button states — light uses brand.500/600/700; dark de-saturates one
    // step (brand.400/300/500) so the CTA reads as a button on slate, not a
    // hyperlink. Consumed by the Button "solid" variant.
    "bg.brand.solid": {
      default: "brand.500",
      _dark: "brand.400",
    },
    "bg.brand.solid-hover": {
      default: "brand.600",
      _dark: "brand.300",
    },
    "bg.brand.solid-active": {
      default: "brand.700",
      _dark: "brand.500",
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
      default: "#1f2937",
      _dark: "#f1f0f3",
    },
    "text.secondary": {
      default: "#4b5563",
      _dark: "#a8a6b1",
    },
    "text.muted": {
      default: "neutral.400",
      // ≈ 4.6:1 contrast on bg.surface (#16161b) — meets WCAG AA for body text
      _dark: "#83828d",
    },
    "text.disabled": {
      default: "neutral.300",
      _dark: "#48474f",
    },
    "text.inverse": {
      default: "#ffffff",
      _dark: "#0d0d10",
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
    "text.onBrand": {
      default: "#ffffff",
      _dark: "#ffffff",
    },

    "border.subtle": {
      default: "rgba(15, 23, 42, 0.07)",
      _dark: "rgba(255, 255, 255, 0.06)",
    },
    "border.default": {
      default: "rgba(15, 23, 42, 0.12)",
      _dark: "rgba(255, 255, 255, 0.11)",
    },
    "border.strong": {
      default: "rgba(15, 23, 42, 0.20)",
      _dark: "rgba(255, 255, 255, 0.20)",
    },
    "border.brand": {
      default: "brand.200",
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

    "status.info.fg": { default: "brand.600", _dark: "brand.300" },
    "status.info.bg": { default: "brand.50", _dark: "rgba(95, 161, 255, 0.12)" },
    "status.info.border": { default: "brand.200", _dark: "rgba(95, 161, 255, 0.30)" },

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
    // In Slate Studio dark mode, surface separation is carried by borders, not
    // by heavy drop shadows. Cards rely on a 1px border + tiny shadow; only
    // panels and overlays get a real, soft, near-black shadow.
    "shadow.card": {
      default: "0px 1px 2px rgba(15, 23, 42, 0.06), 0px 4px 12px -2px rgba(15, 23, 42, 0.08)",
      _dark: "0px 1px 0 rgba(0, 0, 0, 0.20)",
    },
    "shadow.cardHover": {
      default: "0px 4px 8px rgba(15, 23, 42, 0.06), 0px 12px 28px -4px rgba(15, 23, 42, 0.12)",
      _dark: "0px 0 0 1px rgba(255, 255, 255, 0.04), 0px 8px 24px -8px rgba(0, 0, 0, 0.55)",
    },
    "shadow.panel": {
      default: "0px 8px 24px -4px rgba(15, 23, 42, 0.14), 0px 2px 6px rgba(15, 23, 42, 0.06)",
      _dark: "0px 12px 32px -8px rgba(0, 0, 0, 0.55), 0px 2px 6px rgba(0, 0, 0, 0.35)",
    },
    "shadow.lg": {
      default: "0px 16px 40px -8px rgba(15, 23, 42, 0.16), 0px 4px 12px rgba(15, 23, 42, 0.06)",
      _dark: "0px 20px 48px -12px rgba(0, 0, 0, 0.60), 0px 4px 12px rgba(0, 0, 0, 0.35)",
    },
    "shadow.inner": {
      default: "inset 0 2px 4px 0 rgba(15, 23, 42, 0.06)",
      _dark: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.30)",
    },
    // Focus-related shadows use bare keys (no `shadow.` prefix) so they
    // override Chakra's default focus lookup AND existing consumers like
    // `boxShadow: "input-focus"` keep working without edits. Dark mode lifts
    // alpha so the ring still reads on slate canvas.
    outline: {
      default: "0 0 0 3px rgba(47, 128, 237, 0.30)",
      _dark: "0 0 0 3px rgba(143, 192, 255, 0.45)",
    },
    "input-focus": {
      default: "0 0 0 3px rgba(47, 128, 237, 0.15)",
      _dark: "0 0 0 3px rgba(143, 192, 255, 0.28)",
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
      default: "0px 0px 0px 3px rgba(47, 128, 237, 0.20), 0px 4px 12px rgba(47, 128, 237, 0.15)",
      _dark: "0px 0px 0px 3px rgba(143, 192, 255, 0.18), 0px 4px 12px rgba(95, 161, 255, 0.18)",
    },
    "accent-glow": {
      default: "0px 0px 0px 3px rgba(30, 178, 138, 0.20), 0px 4px 12px rgba(30, 178, 138, 0.15)",
      _dark: "0px 0px 0px 3px rgba(93, 220, 182, 0.16), 0px 4px 12px rgba(50, 200, 159, 0.18)",
    },
  },
};
