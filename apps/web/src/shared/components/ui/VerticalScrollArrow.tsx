import { memo } from "react";
import { Flex, Icon } from "@chakra-ui/react";
import { FiChevronDown } from "@/shared/components/icons";

interface VerticalScrollArrowProps {
  visible: boolean;
  onActivate: () => void;
}

/**
 * "Jump to bottom" indicator. Appears at the bottom edge of a scroll
 * container and triggers a smooth scroll to the end on hover OR click. There
 * is no upward variant by design — once at the bottom, the user can use the
 * native scroll wheel/track to come back up.
 */
export const VerticalScrollArrow = memo(function VerticalScrollArrow({
  visible,
  onActivate,
}: VerticalScrollArrowProps) {
  return (
    <Flex
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      h="36px"
      align="flex-end"
      justify="center"
      pb={1}
      zIndex={2}
      opacity={visible ? 1 : 0}
      transition="opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
      onMouseEnter={onActivate}
      onClick={onActivate}
      cursor="pointer"
      role="button"
      aria-label="Scroll to bottom"
      bgGradient="linear(to-t, bg.surface, bg.surface 50%, transparent)"
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
        pointerEvents="none"
      >
        <Icon as={FiChevronDown} boxSize={3.5} color="text.secondary" />
      </Flex>
    </Flex>
  );
});
