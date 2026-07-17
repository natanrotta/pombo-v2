import { useMemo } from "react";
import { Box, SimpleGrid } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiActivity, FiCheckCircle, FiTrendingUp } from "@/shared/components/icons";
import { useAuth } from "@/modules/auth";
import { FadeIn } from "@/shared/components/animations/FadeIn";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { extractFirstName } from "@/modules/dashboard/presentation/utils/extractFirstName";

export function DashboardPage() {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();

  const firstName = useMemo(() => {
    if (!user?.name) return t("header.greetingFallback");
    return extractFirstName(user.name) ?? t("header.greetingFallback");
  }, [user, t]);

  return (
    <>
      <PageHeader
        title={t("header.greeting", { name: firstName })}
        description={t("header.subtitle")}
      />

      <FadeIn delay={0.05}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          <StatCard
            label={t("stats.total.label")}
            value="0"
            hint={t("stats.total.hint")}
            icon={FiActivity}
          />
          <StatCard
            label={t("stats.completed.label")}
            value="0"
            hint={t("stats.completed.hint")}
            icon={FiCheckCircle}
          />
          <StatCard
            label={t("stats.growth.label")}
            value="0%"
            hint={t("stats.growth.hint")}
            icon={FiTrendingUp}
            trend="up"
          />
        </SimpleGrid>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Box>
          <EmptyState
            title={t("empty.title")}
            description={t("empty.description")}
            icon={FiActivity}
          />
        </Box>
      </FadeIn>
    </>
  );
}
