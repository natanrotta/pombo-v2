import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ApiTokenTab } from "@/modules/account/presentation/components/ApiTokenTab";

/** Standalone "API" screen (was a tab in the old Settings page). */
export function ApiPage() {
  const { t } = useTranslation("settings");

  return (
    <>
      <PageHeader
        title={t("apiPage.title")}
        description={t("apiPage.description")}
      />
      <ApiTokenTab />
    </>
  );
}
