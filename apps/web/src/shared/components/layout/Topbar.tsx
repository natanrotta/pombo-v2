import {
  Avatar,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiLogOut, FiMenu, FiUser } from "@/shared/components/icons";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import { useAuth } from "@/modules/auth";
import { ColorModeToggle } from "@/shared/components/ui/ColorModeToggle";

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { t } = useTranslation("common");
  const { user, signOut, isSubmitting } = useAuth();
  const shouldShowMenuButton = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex
      align="center"
      justify="space-between"
      px={{ base: 4, md: 6 }}
      py={3.5}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      bg="bg.topbar"
      backdropFilter="blur(16px)"
      position="sticky"
      top={0}
      zIndex={5}
    >
      <Flex align="center" gap={3}>
        {shouldShowMenuButton ? (
          <IconButton
            aria-label="Open navigation"
            icon={<FiMenu />}
            variant="ghost"
            size="sm"
            onClick={onOpenSidebar}
          />
        ) : null}
      </Flex>

      <Flex align="center" gap={2}>
        <ColorModeToggle size="sm" />
        <Menu>
          <MenuButton>
            <Flex align="center" gap={3}>
              <Text
                display={{ base: "none", md: "block" }}
                fontWeight="500"
                color="text.secondary"
                fontSize="sm"
              >
                {user?.name}
              </Text>
              <Avatar
                size="sm"
                src={user?.avatarUrl}
                name={user?.name}
                bg="brand.500"
                color="text.onBrand"
              />
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem as={RouterLink} to={ROUTE_PATHS.profile} icon={<FiUser />}>
              {t("topbar.myProfile")}
            </MenuItem>
            <MenuItem icon={<FiLogOut />} onClick={() => void signOut()} isDisabled={isSubmitting}>
              {t("topbar.signOut")}
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
}
