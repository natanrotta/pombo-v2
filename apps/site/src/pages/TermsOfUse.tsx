import { LegalLayout } from "@/components/LegalLayout";
import { useLocale } from "@/hooks/useLocale";
import { termsContentEn, termsContentEs, termsContentPt } from "@/pages/legal/terms-content";

export const TermsOfUse = () => {
  const { t, locale } = useLocale();
  const content =
    locale === "en" ? termsContentEn : locale === "es" ? termsContentEs : termsContentPt;

  return (
    <LegalLayout
      eyebrow={t("legal.eyebrow")}
      title={t("legal.termsTitle")}
      updatedAt={t("legal.updatedAtDate")}
      intro={t("legal.termsIntro")}
    >
      {content}
    </LegalLayout>
  );
};
