import { modalAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(
  modalAnatomy.keys
);

const baseStyle = definePartsStyle({
  dialog: {
    borderRadius: "2xl",
    bg: "bg.elevated",
    boxShadow: "shadow.lg",
    overflow: "hidden",
  },
  header: {
    fontSize: "md",
    fontWeight: "600",
    color: "text.primary",
    pb: 2,
  },
  body: {
    color: "text.primary",
    py: 4,
  },
  footer: {
    pt: 2,
  },
  overlay: {
    bg: "bg.overlay",
    backdropFilter: "blur(4px)",
  },
  closeButton: {
    borderRadius: "md",
    color: "text.muted",
    _hover: {
      bg: "bg.hover",
      color: "text.primary",
    },
  },
});

export const Modal = defineMultiStyleConfig({
  baseStyle,
});
