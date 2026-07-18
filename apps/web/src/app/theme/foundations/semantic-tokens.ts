export const semanticTokens = {
  colors: {
    "bg.canvas": {
      default: "#fafbfb",
      _dark: "#0b0f0e",
    },
    "bg.surface": {
      default: "#ffffff",
      _dark: "#121917",
    },
    "bg.elevated": {
      default: "#ffffff",
      _dark: "#17201c",
    },
    "bg.sunken": {
      default: "#eef1f0",
      _dark: "#080b0a",
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
      _dark: "rgba(18, 25, 23, 0.78)",
    },
    "bg.topbar": {
      default: "rgba(255, 255, 255, 0.92)",
      _dark: "rgba(18, 25, 23, 0.88)",
    },
    "bg.brand.subtle": {
      default: "brand.50",
      // Faint emerald wash on the dark canvas.
      _dark: "rgba(16, 185, 129, 0.14)",
    },
    "bg.brand.emphasis": {
      default: "brand.800",
      _dark: "brand.200",
    },
    // Primary action ("solid" button) — the emerald. Light mode uses the
    // button-safe deep emerald (600) with WHITE text; dark mode flips to a
    // bright emerald (500) with near-black emerald-ink text, so the CTA pops on
    // the dark canvas while staying legible in both modes. Hover/active deepen
    // (light) or brighten (dark) for press feedback.
    "bg.brand.solid": {
      default: "brand.600",
      _dark: "brand.500",
    },
    "bg.brand.solid-hover": {
      default: "brand.700",
      _dark: "brand.400",
    },
    "bg.brand.solid-active": {
      default: "brand.800",
      _dark: "brand.600",
    },
    "bg.accent.subtle": {
      default: "accent.50",
      _dark: "rgba(16, 185, 129, 0.14)",
    },
    "bg.overlay": {
      default: "blackAlpha.400",
      _dark: "rgba(0, 0, 0, 0.72)",
    },

    "text.primary": {
      default: "#0f1a17",
      _dark: "#ecf5f1",
    },
    "text.secondary": {
      default: "#47554f",
      _dark: "#a5b2ac",
    },
    "text.muted": {
      default: "neutral.400",
      // ≈ 4.5:1 contrast on bg.surface (#121917) — meets WCAG AA for body text
      _dark: "#7e8b85",
    },
    "text.disabled": {
      default: "neutral.300",
      _dark: "#495049",
    },
    "text.inverse": {
      default: "#ffffff",
      _dark: "#0b0f0e",
    },
    // Links / brand text use the readable "deep emerald" (700 ≈ 5.5:1 on white);
    // dark mode lifts to a bright emerald (300) on the dark canvas.
    "text.link": {
      default: "brand.700",
      _dark: "brand.300",
    },
    "text.brand": {
      default: "brand.700",
      _dark: "brand.300",
    },
    "text.accent": {
      default: "accent.700",
      _dark: "accent.300",
    },
    // Text/icon color that sits ON the primary emerald button — white in light
    // mode (on deep emerald), near-black emerald-ink in dark mode (on bright
    // emerald). Both directions clear WCAG AA.
    "text.onBrand": {
      default: "#ffffff",
      _dark: "#052e21",
    },

    "border.subtle": {
      default: "rgba(15, 26, 23, 0.07)",
      _dark: "rgba(255, 255, 255, 0.06)",
    },
    "border.default": {
      default: "rgba(15, 26, 23, 0.12)",
      _dark: "rgba(255, 255, 255, 0.11)",
    },
    "border.strong": {
      default: "rgba(15, 26, 23, 0.20)",
      _dark: "rgba(255, 255, 255, 0.20)",
    },
    "border.brand": {
      default: "brand.400",
      _dark: "brand.500",
    },
    // Emerald callout border. Pairs with `bg.accent.subtle`: the dark value is a
    // translucent emerald (16,185,129 + 0.32 alpha) so it reads as a soft
    // outline over the dark surface instead of a solid slab.
    "border.accent": {
      default: "accent.300",
      _dark: "rgba(16, 185, 129, 0.32)",
    },
    // Focus ring color — emerald, so every focused control carries the brand
    // (paired with the `outline`/`input-focus` shadows below).
    "border.focus": {
      default: "brand.500",
      _dark: "brand.400",
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

    // Info maps to BLUE (not the brand) — the brand is now green, so an
    // emerald "info" would be indistinguishable from the green "success".
    // Blue is the conventional information hue and keeps the two semantics apart.
    "status.info.fg": { default: "blue.600", _dark: "blue.300" },
    "status.info.bg": { default: "blue.50", _dark: "rgba(59, 130, 246, 0.12)" },
    "status.info.border": { default: "blue.200", _dark: "rgba(59, 130, 246, 0.30)" },

    "status.neutral.fg": { default: "neutral.600", _dark: "#a5b2ac" },
    "status.neutral.bg": { default: "neutral.100", _dark: "rgba(255, 255, 255, 0.06)" },
    "status.neutral.border": { default: "neutral.200", _dark: "rgba(255, 255, 255, 0.12)" },

    // Blue — count/total emphasis (e.g. the Devices "Total" stat card). Shares
    // the blue family with `status.info`; they never collide in the same view.
    "status.blue.fg": { default: "blue.600", _dark: "blue.300" },
    "status.blue.bg": { default: "blue.50", _dark: "rgba(59, 130, 246, 0.12)" },
    "status.blue.border": { default: "blue.200", _dark: "rgba(59, 130, 246, 0.30)" },

    // Gold — INTENTIONAL, SCOPED exception to the project's no-yellow/orange/amber
    // rule. A favorite/primary "star" is conventionally gold and reads wrong in any
    // other color; per explicit product request this is the ONE place gold is
    // allowed. Use ONLY for the primary/favorite star affordance — never for
    // status, warnings, or general accents (warnings stay purple). Dark uses a
    // brighter gold for contrast on the dark surface.
    "accent.gold": { default: "#E0A500", _dark: "#FACC15" },
  },
  shadows: {
    // Surface separation is carried by borders + a soft green-ink shadow
    // (rgba 13,26,22 ≈ the #0f1a17 emerald-ink text color). Cards rely on a 1px
    // border + tiny shadow; only panels and overlays get a real, soft shadow.
    "shadow.card": {
      default: "0px 1px 2px rgba(13, 26, 22, 0.06), 0px 4px 12px -2px rgba(13, 26, 22, 0.08)",
      _dark: "0px 1px 0 rgba(0, 0, 0, 0.20)",
    },
    "shadow.cardHover": {
      default: "0px 4px 8px rgba(13, 26, 22, 0.06), 0px 12px 28px -4px rgba(13, 26, 22, 0.12)",
      _dark: "0px 0 0 1px rgba(255, 255, 255, 0.04), 0px 8px 24px -8px rgba(0, 0, 0, 0.55)",
    },
    "shadow.panel": {
      default: "0px 8px 24px -4px rgba(13, 26, 22, 0.14), 0px 2px 6px rgba(13, 26, 22, 0.06)",
      _dark: "0px 12px 32px -8px rgba(0, 0, 0, 0.55), 0px 2px 6px rgba(0, 0, 0, 0.35)",
    },
    "shadow.lg": {
      default: "0px 16px 40px -8px rgba(13, 26, 22, 0.16), 0px 4px 12px rgba(13, 26, 22, 0.06)",
      _dark: "0px 20px 48px -12px rgba(0, 0, 0, 0.60), 0px 4px 12px rgba(0, 0, 0, 0.35)",
    },
    "shadow.inner": {
      default: "inset 0 2px 4px 0 rgba(13, 26, 22, 0.06)",
      _dark: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.30)",
    },
    // Focus-related shadows use bare keys (no `shadow.` prefix) so they
    // override Chakra's default focus lookup AND existing consumers like
    // `boxShadow: "input-focus"` keep working without edits. All focus rings
    // carry the emerald (16,185,129); dark lifts alpha so it still reads.
    outline: {
      default: "0 0 0 3px rgba(16, 185, 129, 0.40)",
      _dark: "0 0 0 3px rgba(16, 185, 129, 0.45)",
    },
    "input-focus": {
      default: "0 0 0 3px rgba(16, 185, 129, 0.20)",
      _dark: "0 0 0 3px rgba(16, 185, 129, 0.28)",
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
      // Emerald glow to match the primary action.
      default: "0px 0px 0px 3px rgba(16, 185, 129, 0.20), 0px 4px 12px rgba(16, 185, 129, 0.15)",
      _dark: "0px 0px 0px 3px rgba(16, 185, 129, 0.18), 0px 4px 12px rgba(16, 185, 129, 0.20)",
    },
    "accent-glow": {
      default: "0px 0px 0px 3px rgba(16, 185, 129, 0.20), 0px 4px 12px rgba(16, 185, 129, 0.15)",
      _dark: "0px 0px 0px 3px rgba(16, 185, 129, 0.16), 0px 4px 12px rgba(16, 185, 129, 0.18)",
    },
  },
};
