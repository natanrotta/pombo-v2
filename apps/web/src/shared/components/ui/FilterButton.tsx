import { forwardRef } from "react";
import { Badge, Button, Icon, type ButtonProps } from "@chakra-ui/react";
import type { IconType } from "@/shared/components/icons";

interface FilterButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon"> {
  icon?: IconType;
  label: string;
  count?: number;
}

export const FilterButton = forwardRef<HTMLButtonElement, FilterButtonProps>(function FilterButton(
  { icon, label, count, children, ...rest },
  ref
) {
  return (
    <Button
      ref={ref}
      size="sm"
      variant="ghost"
      leftIcon={icon ? <Icon as={icon} boxSize={4} color="text.muted" /> : undefined}
      h={{ base: "40px", md: "36px" }}
      borderRadius="sm"
      bg="bg.surface"
      borderWidth="1.5px"
      borderColor="border.default"
      color="text.secondary"
      fontWeight="500"
      fontSize="sm"
      px={{ base: 3, md: 4 }}
      _hover={{ borderColor: "border.strong", bg: "bg.hover" }}
      _expanded={{ borderColor: "border.focus", boxShadow: "input-focus" }}
      {...rest}
    >
      {label}
      {count != null && count > 0 && (
        <Badge ml={1.5} colorScheme="brand" borderRadius="full" fontSize="2xs">
          {count}
        </Badge>
      )}
      {children}
    </Button>
  );
});
