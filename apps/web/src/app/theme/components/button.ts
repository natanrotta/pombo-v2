import { defineStyleConfig } from "@chakra-ui/react";

export const Button = defineStyleConfig({
  defaultProps: {
    colorScheme: "brand",
    size: "sm",
  },
  baseStyle: {
    borderRadius: "sm",
    fontWeight: "500",
    transitionProperty: "all",
    transitionDuration: "200ms",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  variants: {
    solid: {
      bg: "bg.brand.solid",
      color: "text.onBrand",
      // Emerald-tinted shadow to match the green brand (mirrors the colored
      // shadow the `danger` variant uses for red).
      boxShadow: "0 1px 2px rgba(4, 120, 87, 0.28)",
      _hover: {
        bg: "bg.brand.solid-hover",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(4, 120, 87, 0.36)",
      },
      _active: {
        bg: "bg.brand.solid-active",
        transform: "translateY(0)",
        boxShadow: "0 1px 2px rgba(4, 120, 87, 0.28)",
      },
    },
    subtle: {
      bg: "bg.brand.subtle",
      color: "text.brand",
      _hover: {
        bg: "bg.brand.subtle",
        filter: "brightness(0.97)",
        transform: "translateY(-1px)",
      },
      _active: {
        filter: "brightness(0.94)",
        transform: "translateY(0)",
      },
    },
    ghost: {
      color: "text.primary",
      bg: "transparent",
      _hover: {
        bg: "bg.hover",
      },
      _active: {
        bg: "bg.active",
      },
    },
    outline: {
      border: "1px solid",
      borderColor: "border.default",
      color: "text.brand",
      bg: "bg.surface",
      _hover: {
        bg: "bg.brand.subtle",
        borderColor: "border.brand",
        transform: "translateY(-1px)",
      },
      _active: {
        filter: "brightness(0.95)",
        transform: "translateY(0)",
      },
    },
    danger: {
      bg: "red.500",
      // White in both modes — the danger button is always red (not brand),
      // so it must NOT follow the grayscale `text.onBrand` (which is
      // near-black in dark and would fail contrast on red).
      color: "#ffffff",
      boxShadow: "0 1px 2px rgba(239, 68, 68, 0.20)",
      _hover: {
        bg: "red.600",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.30)",
      },
      _active: {
        bg: "red.700",
        transform: "translateY(0)",
      },
    },
  },
});
