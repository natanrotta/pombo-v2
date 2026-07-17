import { memo } from "react";
import {
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { FiMoreVertical } from "@/shared/components/icons";
import type { IconType } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";

export interface ActionMenuItem {
  label: string;
  icon?: IconType;
  onClick: () => void;
  isDisabled?: boolean;
  isDanger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

function ActionMenuComponent({ items }: ActionMenuProps) {
  const { t } = useTranslation("common");
  const normalItems = items.filter((item) => !item.isDanger);
  const dangerItems = items.filter((item) => item.isDanger);

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label={t("actions.actions")}
        icon={<FiMoreVertical />}
        variant="ghost"
        size="sm"
        borderRadius="md"
      />
      <Portal>
        <MenuList>
          {normalItems.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.icon ? <Icon as={item.icon} boxSize={4} /> : undefined}
              onClick={item.onClick}
              isDisabled={item.isDisabled}
            >
              {item.label}
            </MenuItem>
          ))}
          {dangerItems.length > 0 && normalItems.length > 0 && <MenuDivider />}
          {dangerItems.map((item) => (
            <MenuItem
              key={item.label}
              icon={
                item.icon ? <Icon as={item.icon} boxSize={4} color="status.error.fg" /> : undefined
              }
              onClick={item.onClick}
              isDisabled={item.isDisabled}
              color="status.error.fg"
              _hover={{ bg: "status.error.bg", color: "status.error.fg" }}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
}

export const ActionMenu = memo(ActionMenuComponent);
