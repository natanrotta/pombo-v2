import { defineStyleConfig } from "@chakra-ui/react";

export const Button = defineStyleConfig({
  defaultProps: {
    colorScheme: "brand",
    size: "md",
  },
  baseStyle: {
    borderRadius: "full",
    fontWeight: "600",
    letterSpacing: "0.01em",
    textDecoration: "none",
    transitionProperty: "all",
    transitionDuration: "240ms",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    _hover: { textDecoration: "none" },
  },
  sizes: {
    md: { h: 11, px: 6, fontSize: "sm" },
    lg: { h: 12, px: 7, fontSize: "md" },
  },
  variants: {
    solid: {
      bg: "bg.brand.solid",
      color: "text.onBrand",
      boxShadow: "0 1px 2px rgba(47, 128, 237, 0.25), 0 8px 24px -8px rgba(47, 128, 237, 0.45)",
      _hover: {
        bg: "bg.brand.solid-hover",
        transform: "translateY(-2px)",
        boxShadow:
          "0 4px 12px rgba(47, 128, 237, 0.32), 0 16px 36px -10px rgba(47, 128, 237, 0.55)",
        _disabled: { transform: "none" },
      },
      _active: {
        transform: "translateY(0)",
      },
    },
    outline: {
      border: "1px solid",
      borderColor: "border.default",
      color: "text.primary",
      bg: "transparent",
      backdropFilter: "blur(6px)",
      _hover: {
        bg: "bg.brand.subtle",
        borderColor: "border.brand",
        color: "text.brand",
        transform: "translateY(-2px)",
      },
      _active: { transform: "translateY(0)" },
    },
    ghost: {
      color: "text.primary",
      bg: "transparent",
      _hover: { bg: "bg.hover", color: "text.brand" },
    },
    accent: {
      bg: "accent.500",
      color: "text.onBrand",
      boxShadow: "0 1px 2px rgba(30, 178, 138, 0.25), 0 8px 24px -8px rgba(30, 178, 138, 0.45)",
      _hover: {
        bg: "accent.600",
        transform: "translateY(-2px)",
        boxShadow:
          "0 4px 12px rgba(30, 178, 138, 0.32), 0 16px 36px -10px rgba(30, 178, 138, 0.55)",
      },
      _active: { transform: "translateY(0)" },
    },
  },
});
