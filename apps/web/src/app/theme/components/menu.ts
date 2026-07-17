import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(
  menuAnatomy.keys
);

const baseStyle = definePartsStyle({
  list: {
    boxShadow: "shadow.panel",
    borderRadius: "lg",
    border: "1px solid",
    borderColor: "border.subtle",
    p: 1.5,
    overflow: "hidden",
    bg: "bg.elevated",
    minW: "180px",
    zIndex: "popover",
  },
  item: {
    borderRadius: "md",
    fontSize: "sm",
    fontWeight: "500",
    color: "text.primary",
    bg: "transparent",
    transition: "all 0.15s",
    px: 3,
    py: 2,
    _hover: {
      bg: "bg.hover",
    },
    _focus: {
      bg: "bg.hover",
    },
  },
  divider: {
    borderColor: "border.subtle",
    my: 1,
  },
});

export const Menu = defineMultiStyleConfig({
  baseStyle,
});
