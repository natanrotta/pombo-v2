import { useDisclosure } from "@chakra-ui/react";
import type { BaseEntity } from "@/core/domain/CrudRepository";
import type { PaginatedResponse, PaginationParams } from "@/shared/types/pagination";
import { useInfiniteListPage } from "@/shared/hooks/useInfiniteListPage";
import { useBulkSelection } from "@/shared/hooks/useBulkSelection";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useNotify } from "@/shared/hooks/useNotify";

interface UseListPageControllerOptions<T extends BaseEntity> {
  queryKey: readonly unknown[];
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>;
  deleteFn: (id: string) => Promise<void>;
  bulkDeleteFn?: (ids: string[]) => Promise<void>;
  entityLabel: { singular: string; plural: string };
  defaultLimit?: number;
}

export function useListPageController<T extends BaseEntity>({
  queryKey,
  fetchFn,
  deleteFn,
  bulkDeleteFn,
  entityLabel,
  defaultLimit = 12,
}: UseListPageControllerOptions<T>) {
  const { showInfo } = useNotify();
  const deleteConfirm = useConfirm();
  const createModal = useDisclosure();

  const {
    items,
    total,
    isLoading,
    isFetching,
    isFetchingNextPage,
    search,
    setSearch,
    tagIds,
    setTagIds,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteListPage<T>({
    queryKey,
    fetchFn,
    defaultLimit,
  });

  const bulk = useBulkSelection(items, { resetDeps: [search, tagIds] });

  async function handleDelete(id: string) {
    await deleteFn(id);
  }

  async function handleBulkDelete() {
    if (!bulkDeleteFn) return;
    const ids = Array.from(bulk.selectedIds);
    await bulkDeleteFn(ids);
    const count = ids.length;
    const label = count > 1 ? entityLabel.plural : entityLabel.singular;
    showInfo(`${count} ${label} removido${count > 1 ? "s" : ""}`);
    bulk.cancelSelection();
  }

  return {
    items,
    total,
    isLoading,
    isFetching,
    isFetchingNextPage,
    search,
    setSearch,
    tagIds,
    setTagIds,
    fetchNextPage,
    hasNextPage,
    bulk,
    deleteConfirm,
    createModal,
    handleDelete,
    handleBulkDelete,
  };
}
