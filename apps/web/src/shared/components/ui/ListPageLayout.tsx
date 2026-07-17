import { Box, Flex, SimpleGrid } from "@chakra-ui/react";
import { type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiSearch } from "@/shared/components/icons";
import type { IconType } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { FilterBar } from "@/shared/components/ui/FilterBar";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { EntityCardSkeleton } from "@/shared/components/skeletons/EntityCardSkeleton";
import { StaggerContainer, StaggerItem } from "@/shared/components/animations/FadeIn";
import { EASE_ORGANIC } from "@/shared/constants/animation";
import { useInfiniteScrollSentinel } from "@/shared/hooks/useInfiniteScrollSentinel";

const MotionBox = motion(Box);

interface DeleteConfirmState {
  isOpen: boolean;
  cancel: () => void;
  confirm: (action: (id: string) => void) => void;
}

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: IconType;
}

interface ListPageLayoutProps<T> {
  title: string;
  description?: string;
  headerActions?: ReactNode;
  totalCount?: number;
  countLabel?: string;
  primaryAction?: PageHeaderAction;

  isLoading: boolean;
  isFetching?: boolean;
  skeletonColumns?: Record<string, number>;

  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showFilterWhenEmpty?: boolean;

  isEmpty: boolean;
  emptyIcon: IconType;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;

  pagedItems: T[];
  renderCard: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  gridColumns?: Record<string, number>;

  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage?: boolean;

  deleteConfirm?: DeleteConfirmState;
  onDelete?: (id: string) => void;
  deleteTitle?: string;
  deleteDescription?: string;

  children?: ReactNode;
}

export function ListPageLayout<T>({
  title,
  description,
  headerActions,
  totalCount,
  countLabel,
  primaryAction,

  isLoading,
  isFetching = false,
  skeletonColumns = { base: 1, md: 2, lg: 3 },

  searchPlaceholder,
  searchValue,
  onSearchChange,
  showFilterWhenEmpty = true,

  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  pagedItems,
  renderCard,
  keyExtractor,
  gridColumns = { base: 1, md: 2, xl: 3 },

  fetchNextPage,
  hasNextPage,
  isFetchingNextPage = false,

  deleteConfirm,
  onDelete,
  deleteTitle,
  deleteDescription,

  children,
}: ListPageLayoutProps<T>) {
  const { t } = useTranslation("common");

  // Track whether the first query resolution has happened. Until it has, we
  // must never show the empty state — `isEmpty` is typically computed as
  // `items.length === 0 && !search && !tagIds.length`, which is trivially
  // true on the first render before data arrives. Without this gate, the
  // content area can briefly render "empty → loading → data" on mount.
  const [hasSettled, setHasSettled] = useState(!isLoading);
  useEffect(() => {
    if (!isLoading && !hasSettled) setHasSettled(true);
  }, [isLoading, hasSettled]);

  // Callback ref keeps the IntersectionObserver bound to the sentinel even
  // when the data branch mounts late (e.g. after AnimatePresence mode="wait").
  const { sentinelRef } = useInfiniteScrollSentinel({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const filterBar = (
    <FilterBar
      searchPlaceholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
    />
  );

  // Content state machine. Only one of these is ever true at a time, and the
  // rendered variant is cross-faded via AnimatePresence so the viewer never
  // sees a bare frame between states.
  //
  // - `skeleton`: initial load, before the first query resolution. We stay on
  //   this state until `hasSettled` flips, so we never briefly render the
  //   empty state just because `items.length === 0` on the first render.
  // - `empty`: the page genuinely has no data and no filter applied. Shown
  //   as the onboarding EmptyState.
  // - `noResults`: the page has data but the current search/filter excludes
  //   everything.
  // - `data`: the grid of cards.
  const contentState: "skeleton" | "empty" | "noResults" | "data" = !hasSettled
    ? "skeleton"
    : isEmpty
      ? "empty"
      : pagedItems.length === 0 && !isFetching
        ? "noResults"
        : "data";

  const dimWhileRefetching =
    hasSettled && isFetching && !isFetchingNextPage && contentState === "data";

  const fadeTransition = { duration: 0.18, ease: EASE_ORGANIC };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        count={hasSettled ? totalCount : undefined}
        countLabel={countLabel}
        primaryAction={primaryAction}
        actions={headerActions}
      />

      <Flex direction="column" gap={4}>
        {(contentState !== "empty" || showFilterWhenEmpty) && filterBar}

        <Box
          minH="320px"
          position="relative"
          opacity={dimWhileRefetching ? 0.6 : 1}
          transition="opacity 0.15s ease"
        >
          <AnimatePresence mode="wait" initial={false}>
            {contentState === "skeleton" && (
              <MotionBox
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
              >
                <SimpleGrid columns={skeletonColumns} gap={4}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <EntityCardSkeleton key={`initial-skeleton-${i}`} />
                  ))}
                </SimpleGrid>
              </MotionBox>
            )}

            {contentState === "empty" && (
              <MotionBox
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
              >
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  description={emptyDescription}
                  actionLabel={emptyActionLabel}
                  onAction={onEmptyAction}
                />
              </MotionBox>
            )}

            {contentState === "noResults" && (
              <MotionBox
                key="noResults"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
              >
                <EmptyState
                  icon={FiSearch}
                  title={t("status.noResults")}
                  description={t("list.noResultsHint")}
                  size="sm"
                />
              </MotionBox>
            )}

            {contentState === "data" && (
              <MotionBox
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
              >
                <StaggerContainer>
                  <SimpleGrid columns={gridColumns} gap={4} alignItems="stretch">
                    {pagedItems.map((item) => (
                      <StaggerItem key={keyExtractor(item)}>
                        <Box h="100%">{renderCard(item)}</Box>
                      </StaggerItem>
                    ))}
                  </SimpleGrid>
                </StaggerContainer>

                <Box ref={sentinelRef} h="1px" mt={-1} />

                {isFetchingNextPage && (
                  <SimpleGrid columns={gridColumns} gap={4} mt={4}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <EntityCardSkeleton key={`skeleton-${i}`} />
                    ))}
                  </SimpleGrid>
                )}

                {!hasNextPage && pagedItems.length > 0 && (
                  <Flex justify="center" pt={8} pb={2}>
                    <Box h="1px" w="60px" bg="border.subtle" borderRadius="full" />
                  </Flex>
                )}
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>
      </Flex>

      {deleteConfirm && onDelete && (
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={deleteConfirm.cancel}
          onConfirm={() => deleteConfirm.confirm(onDelete)}
          title={deleteTitle ?? t("list.deleteTitle")}
          description={deleteDescription ?? t("list.deleteDescription")}
          confirmLabel={t("actions.delete")}
          isDanger
        />
      )}

      {children}
    </>
  );
}
