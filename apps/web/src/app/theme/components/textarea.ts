import { defineStyleConfig } from "@chakra-ui/react";

const outline = {
  borderRadius: "sm",
  bg: "bg.surface",
  borderColor: "border.default",
  borderWidth: "1.5px",
  color: "text.primary",
  fontSize: { base: "16px", md: "sm" },
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
};

export const Textarea = defineStyleConfig({
  defaultProps: {
    variant: "outline",
  },
  variants: {
    outline,
  },
});
