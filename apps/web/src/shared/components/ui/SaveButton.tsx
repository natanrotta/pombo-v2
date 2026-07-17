import { memo } from "react";
import { Button } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface SaveButtonProps {
  isDirty: boolean;
  isSaving: boolean;
  onClick: () => void;
  label?: string;
}

function SaveButtonComponent({ isDirty, isSaving, onClick, label }: SaveButtonProps) {
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t("actions.save");
  return (
    <Button
      size="sm"
      colorScheme="brand"
      isLoading={isSaving}
      onClick={onClick}
      isDisabled={!isDirty}
    >
      {resolvedLabel}
    </Button>
  );
}

export const SaveButton = memo(SaveButtonComponent);
