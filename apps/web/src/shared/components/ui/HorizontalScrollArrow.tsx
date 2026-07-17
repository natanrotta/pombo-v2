import { memo } from "react";
import { Flex, Icon } from "@chakra-ui/react";
import { FiChevronRight } from "@/shared/components/icons";

interface HorizontalScrollArrowProps {
  direction: "left" | "right";
  visible: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export const HorizontalScrollArrow = memo(function HorizontalScrollArrow({
  direction,
  visible,
  onHoverStart,
  onHoverEnd,
}: HorizontalScrollArrowProps) {
  const isLeft = direction === "left";

  return (
    <Flex
      position="absolute"
      top={0}
      bottom={0}
      {...(isLeft ? { left: 0 } : { right: 0 })}
      align="center"
      zIndex={1}
      opacity={visible ? 1 : 0}
      transition="opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
      pointerEvents={visible ? "auto" : "none"}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      cursor="pointer"
      aria-label={`Scroll ${direction}`}
    >
      <Flex
        align="center"
        justify="center"
        w={6}
        h={6}
        borderRadius="full"
        bg="bg.surface"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="border.default"
        _hover={{ bg: "bg.sunken", boxShadow: "md" }}
        transition="all 0.15s ease"
      >
        <Icon
          as={FiChevronRight}
          boxSize={3.5}
          color="text.secondary"
          transform={isLeft ? "rotate(180deg)" : undefined}
        />
      </Flex>
    </Flex>
  );
});
