import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDanger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  isDanger = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation("common");
  const cancelRef = useRef<HTMLButtonElement>(null);

  const resolvedTitle = title ?? t("confirmDialog.defaultTitle");
  const resolvedDescription = description ?? t("confirmDialog.defaultDescription");
  const resolvedConfirmLabel = confirmLabel ?? t("actions.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("actions.cancel");

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay bg="blackAlpha.300" backdropFilter="blur(2px)">
        <AlertDialogContent borderRadius="lg" mx={{ base: 4, md: 0 }}>
          <AlertDialogHeader fontSize="md" fontWeight="700">
            {resolvedTitle}
          </AlertDialogHeader>
          <AlertDialogBody fontSize="sm" color="text.secondary">
            {resolvedDescription}
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} size="sm" variant="ghost" onClick={onClose}>
              {resolvedCancelLabel}
            </Button>
            <Button
              size="sm"
              colorScheme={isDanger ? "red" : "brand"}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {resolvedConfirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
