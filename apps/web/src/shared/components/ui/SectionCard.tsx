import { memo } from "react";
import { Box, type BoxProps } from "@chakra-ui/react";
import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import { TRANSITION_SLOW } from "@/shared/constants/animation";

const MotionBox = motion(Box);

interface SectionCardProps extends BoxProps {
  isInteractive?: boolean;
  accentColor?: string;
  variant?: "default" | "glass" | "sunken";
}

const variantStyles = {
  default: {
    bg: "bg.surface",
    borderWidth: "1px",
    borderColor: "border.subtle",
    boxShadow: "shadow.card",
  },
  glass: {
    bg: "bg.glass",
    backdropFilter: "blur(12px)",
    borderWidth: "1px",
    borderColor: "border.subtle",
    boxShadow: "shadow.card",
  },
  sunken: {
    bg: "bg.sunken",
    boxShadow: "shadow.inner",
    borderWidth: "1px",
    borderColor: "border.subtle",
  },
} as const;

function SectionCardComponent({
  children,
  isInteractive = false,
  accentColor,
  variant = "default",
  ...props
}: PropsWithChildren<SectionCardProps>) {
  const styles = variantStyles[variant];

  return (
    <MotionBox
      {...styles}
      borderRadius="lg"
      p={{ base: 4, md: 5 }}
      borderLeftWidth={accentColor ? "3px" : undefined}
      borderLeftColor={accentColor}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION_SLOW}
      style={{
        transition:
          "box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      {...(isInteractive && {
        cursor: "pointer",
        _hover: {
          boxShadow: "shadow.cardHover",
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      })}
      {...props}
    >
      {children}
    </MotionBox>
  );
}

export const SectionCard = memo(SectionCardComponent);
