import { LegalLayout } from "@/components/LegalLayout";
import { useLocale } from "@/hooks/useLocale";
import {
  privacyContentEn,
  privacyContentEs,
  privacyContentPt,
} from "@/pages/legal/privacy-content";

export const PrivacyPolicy = () => {
  const { t, locale } = useLocale();
  const content =
    locale === "en" ? privacyContentEn : locale === "es" ? privacyContentEs : privacyContentPt;

  return (
    <LegalLayout
      eyebrow={t("legal.eyebrow")}
      title={t("legal.privacyTitle")}
      updatedAt={t("legal.updatedAtDate")}
      intro={t("legal.privacyIntro")}
    >
      {content}
    </LegalLayout>
  );
};
