import { Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DetailPageSkeleton } from "@/shared/components/skeletons/DetailPageSkeleton";

interface DetailPageGuardProps {
  isLoading: boolean;
  error?: unknown;
  entity: unknown;
  skeletonVariant?: "two-column" | "profile" | "single";
  errorMessage?: string;
  notFoundMessage?: string;
  children: ReactNode;
}

export function DetailPageGuard({
  isLoading,
  error,
  entity,
  skeletonVariant = "two-column",
  errorMessage,
  notFoundMessage,
  children,
}: DetailPageGuardProps) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return <DetailPageSkeleton variant={skeletonVariant} />;
  }

  if (error) {
    return (
      <Text color="red.500" textAlign="center" py={10}>
        {errorMessage ?? t("errors.loadError")}
      </Text>
    );
  }

  if (!entity) {
    return (
      <Text color="text.secondary" textAlign="center" py={10}>
        {notFoundMessage ?? t("errors.notFound")}
      </Text>
    );
  }

  return <>{children}</>;
}
