import { memo } from "react";
import { Button, Icon } from "@chakra-ui/react";
import { FiTrash2 } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";

interface UnlinkButtonProps {
  onClick: () => void;
  label?: string;
}

function UnlinkButtonComponent({ onClick, label }: UnlinkButtonProps) {
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t("actions.unlink");
  return (
    <Button
      size="xs"
      variant="ghost"
      color="red.500"
      leftIcon={<Icon as={FiTrash2} />}
      _hover={{ bg: "status.error.bg", color: "red.600" }}
      onClick={onClick}
    >
      {resolvedLabel}
    </Button>
  );
}

export const UnlinkButton = memo(UnlinkButtonComponent);
