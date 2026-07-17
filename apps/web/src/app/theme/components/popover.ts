import { popoverAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(
  popoverAnatomy.keys
);

const baseStyle = definePartsStyle({
  content: {
    bg: "bg.elevated",
    borderColor: "border.subtle",
    color: "text.primary",
    boxShadow: "shadow.panel",
  },
  header: {
    borderColor: "border.subtle",
    color: "text.primary",
  },
  body: {
    color: "text.primary",
  },
  footer: {
    borderColor: "border.subtle",
  },
  arrow: {
    bg: "bg.elevated !important",
  },
  closeButton: {
    color: "text.muted",
    _hover: {
      bg: "bg.hover",
      color: "text.primary",
    },
  },
});

export const Popover = defineMultiStyleConfig({
  baseStyle,
});
