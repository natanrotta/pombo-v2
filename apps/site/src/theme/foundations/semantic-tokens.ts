export const semanticTokens = {
  colors: {
    "bg.canvas": { default: "#f3f7fc", _dark: "#0d0d10" },
    "bg.surface": { default: "#ffffff", _dark: "#16161b" },
    "bg.elevated": { default: "#ffffff", _dark: "#1d1d23" },
    "bg.sunken": { default: "#f0f4f8", _dark: "#0a0a0d" },
    "bg.muted": { default: "neutral.50", _dark: "rgba(255, 255, 255, 0.04)" },
    "bg.hover": { default: "neutral.100", _dark: "rgba(255, 255, 255, 0.07)" },
    "bg.glass": {
      default: "rgba(255, 255, 255, 0.78)",
      _dark: "rgba(22, 22, 27, 0.72)",
    },
    // Floating header pill: kept on the glass language (backdrop-blur +
    // saturate) but near-opaque so busy hero content behind it never bleeds
    // through and hurts legibility. Distinct from `bg.glass` (Hero/Modules
    // cards), which stays lighter on purpose.
    "bg.topbar": {
      default: "rgba(255, 255, 255, 0.94)",
      _dark: "rgba(22, 22, 27, 0.92)",
    },
    "bg.brand.subtle": {
      default: "brand.50",
      _dark: "rgba(95, 161, 255, 0.14)",
    },
    "bg.brand.solid": { default: "brand.500", _dark: "brand.400" },
    "bg.brand.solid-hover": { default: "brand.600", _dark: "brand.300" },
    "bg.accent.subtle": {
      default: "accent.50",
      _dark: "rgba(50, 200, 159, 0.14)",
    },

    "text.primary": { default: "#1f2937", _dark: "#f1f0f3" },
    "text.secondary": { default: "#4b5563", _dark: "#a8a6b1" },
    "text.muted": { default: "neutral.400", _dark: "#83828d" },
    "text.inverse": { default: "#ffffff", _dark: "#0d0d10" },
    "text.brand": { default: "brand.600", _dark: "brand.300" },
    "text.accent": { default: "accent.600", _dark: "accent.300" },
    "text.onBrand": { default: "#ffffff", _dark: "#ffffff" },

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
    "border.brand": { default: "brand.200", _dark: "brand.500" },
  },
  shadows: {
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
    "brand-glow": {
      default: "0px 0px 0px 3px rgba(47, 128, 237, 0.20), 0px 6px 24px rgba(47, 128, 237, 0.22)",
      _dark: "0px 0px 0px 3px rgba(143, 192, 255, 0.18), 0px 8px 28px rgba(95, 161, 255, 0.22)",
    },
    "accent-glow": {
      default: "0px 0px 0px 3px rgba(30, 178, 138, 0.20), 0px 6px 24px rgba(30, 178, 138, 0.22)",
      _dark: "0px 0px 0px 3px rgba(93, 220, 182, 0.16), 0px 8px 28px rgba(50, 200, 159, 0.22)",
    },
  },
};
