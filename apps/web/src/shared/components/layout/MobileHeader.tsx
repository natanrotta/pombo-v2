import { memo } from "react";
import { Avatar, Flex, IconButton, Image, Text } from "@chakra-ui/react";
import { FiMenu } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export const MobileHeader = memo(function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  const { t } = useTranslation("common");
  const { user } = useAuth();

  return (
    <Flex
      display={{ base: "flex", lg: "none" }}
      align="center"
      justify="space-between"
      px={4}
      py={2.5}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      bg="bg.topbar"
      backdropFilter="blur(16px)"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex align="center" gap={3}>
        <IconButton
          aria-label={t("layout.openMenu")}
          icon={<FiMenu />}
          variant="ghost"
          size="sm"
          onClick={onOpenSidebar}
          minW="40px"
          minH="40px"
        />
        <Flex align="center" gap={2}>
          <Image
            src="/pombo-icon.png"
            alt="Pombo"
            w={7}
            h={7}
            borderRadius="22%"
            objectFit="cover"
            flexShrink={0}
          />
          <Text fontSize="sm" fontWeight="700" color="text.primary" letterSpacing="-0.01em">
            Pombo
          </Text>
        </Flex>
      </Flex>

      <Flex align="center" gap={1}>
        {user && (
          <Avatar
            size="sm"
            name={user.name}
            src={user.avatarUrl || undefined}
            bg="brand.500"
            color="text.onBrand"
            fontSize="xs"
            fontWeight="700"
            w={8}
            h={8}
          />
        )}
      </Flex>
    </Flex>
  );
});
