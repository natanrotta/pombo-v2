import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import type { PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface AppModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  borderRadius?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
  primaryColorScheme?: string;
  footerLeft?: ReactNode;
  /**
   * Overrides the footer cancel button. By default it just closes the modal;
   * pass an action (e.g. "discard this draft") + label when cancelling means
   * more than closing. The X / overlay close keeps calling `onClose`.
   */
  onCancelAction?: () => void;
  cancelActionLabel?: string;
  isCancelLoading?: boolean;
  /**
   * Chakra scroll strategy. Pass "inside" for tall bodies (long lists) so the
   * body scrolls while the header + footer stay pinned — keeps the CTA visible.
   */
  scrollBehavior?: "inside" | "outside";
}

export function AppModal({
  isOpen,
  onClose,
  title,
  size,
  borderRadius = "lg",
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryLoading,
  isPrimaryDisabled,
  primaryColorScheme = "brand",
  footerLeft,
  onCancelAction,
  cancelActionLabel,
  isCancelLoading,
  scrollBehavior,
  children,
}: AppModalProps) {
  const { t } = useTranslation("common");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} scrollBehavior={scrollBehavior} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
      <ModalContent borderRadius={borderRadius} mx={{ base: 3, md: 0 }}>
        <ModalHeader fontSize={{ base: "md", md: "lg" }}>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>{children}</ModalBody>
        <ModalFooter flexDirection={{ base: "column-reverse", sm: "row" }} gap={2}>
          {footerLeft && <Flex mr="auto">{footerLeft}</Flex>}
          <Button
            variant="ghost"
            onClick={onCancelAction ?? onClose}
            isLoading={isCancelLoading}
            w={{ base: "full", sm: "auto" }}
          >
            {cancelActionLabel ?? t("actions.cancel")}
          </Button>
          {primaryActionLabel && onPrimaryAction ? (
            <Button
              colorScheme={primaryColorScheme}
              onClick={onPrimaryAction}
              isLoading={isPrimaryLoading}
              isDisabled={isPrimaryDisabled}
              w={{ base: "full", sm: "auto" }}
            >
              {primaryActionLabel}
            </Button>
          ) : null}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
