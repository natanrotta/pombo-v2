import { numberInputAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(
  numberInputAnatomy.keys
);

const outline = definePartsStyle({
  field: {
    borderRadius: "sm",
    bg: "bg.surface",
    borderColor: "border.default",
    borderWidth: "1.5px",
    color: "text.primary",
    fontSize: "sm",
    h: "40px",
    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
    _hover: {
      borderColor: "border.strong",
    },
    _focusVisible: {
      borderColor: "border.focus",
      boxShadow: "input-focus",
      bg: "bg.surface",
    },
    _invalid: {
      borderColor: "status.error.fg",
      boxShadow: "input-error",
    },
    _placeholder: {
      color: "text.muted",
      fontSize: "sm",
    },
    _disabled: {
      borderColor: "border.subtle",
      bg: "bg.muted",
      opacity: 0.7,
      cursor: "not-allowed",
    },
    _readOnly: {
      borderColor: "border.default",
      bg: "bg.muted",
      cursor: "default",
      _focusVisible: {
        boxShadow: "none",
        borderColor: "border.default",
      },
    },
  },
  stepper: {
    borderColor: "border.default",
    color: "text.muted",
    _active: {
      bg: "bg.hover",
    },
  },
});

export const NumberInput = defineMultiStyleConfig({
  defaultProps: {
    variant: "outline",
  },
  variants: {
    outline,
  },
});
