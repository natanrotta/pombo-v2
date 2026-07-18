import { Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { LanguageSelector } from "@/shared/components/ui/LanguageSelector";
import { ColorModeToggle } from "@/shared/components/ui/ColorModeToggle";
import { ProfileTab } from "@/modules/settings/presentation/components/ProfileTab";

/** Standalone "Perfil" screen (was a tab in the old Settings page). Owns the
 *  account-level language + theme controls in its header. */
export function ProfilePage() {
  const { t } = useTranslation("settings");

  return (
    <>
      <PageHeader
        title={t("profilePage.title")}
        description={t("profilePage.description")}
        actions={
          <Flex align="center" gap={2}>
            <LanguageSelector />
            <ColorModeToggle />
          </Flex>
        }
      />
      <ProfileTab />
    </>
  );
}
