import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import { EASE_ORGANIC } from "@/shared/constants/animation";

const MotionBox = motion(Box);

interface FadeInProps {
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  y = 8,
}: PropsWithChildren<FadeInProps>) {
  return (
    <MotionBox
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE_ORGANIC }}
    >
      {children}
    </MotionBox>
  );
}

interface StaggerContainerProps {
  staggerDelay?: number;
}

const containerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_ORGANIC },
  },
};

export function StaggerContainer({
  children,
  staggerDelay = 0.05,
}: PropsWithChildren<StaggerContainerProps>) {
  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={staggerDelay}
    >
      {children}
    </MotionBox>
  );
}

export function StaggerItem({ children }: PropsWithChildren) {
  return <MotionBox variants={itemVariants}>{children}</MotionBox>;
}
