import { Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { LanguageSelector } from "@/shared/components/ui/LanguageSelector";
import { ColorModeToggle } from "@/shared/components/ui/ColorModeToggle";
import { AppTabs } from "@/shared/components/ui/AppTabs";
import { ProfileTab } from "@/modules/settings/presentation/components/ProfileTab";
import { ApiTokenTab } from "@/modules/account";

export function SettingsPage() {
  const { t } = useTranslation("settings");

  const tabs = [
    {
      id: "profile",
      label: t("tabs.profile"),
      content: <ProfileTab />,
    },
    {
      id: "api",
      label: t("tabs.api"),
      content: <ApiTokenTab />,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("page.title")}
        description={t("page.description")}
        actions={
          <Flex align="center" gap={2}>
            <LanguageSelector />
            <ColorModeToggle />
          </Flex>
        }
      />
      <AppTabs items={tabs} syncWithUrl />
    </>
  );
}
