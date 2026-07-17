import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BaseEntity } from "@/core/domain/CrudRepository";
import type { EntityQueryKeys } from "@/core/query/entityQueryKeys";
import type { PaginatedResponse } from "@/shared/types/pagination";
import { useErrorHandler } from "@/core/query/useErrorHandler";

interface InfinitePaginatedData<T> {
  pages: PaginatedResponse<T>[];
  pageParams: unknown[];
}

function isInfinitePaginatedData<T>(value: unknown): value is InfinitePaginatedData<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "pages" in value &&
    Array.isArray((value as { pages: unknown }).pages)
  );
}

function isSinglePagePaginatedData<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  );
}

interface UseEntityListOptions<T extends BaseEntity> {
  repo: {
    list(): Promise<T[]>;
    delete(id: string): Promise<void>;
  };
  keys: EntityQueryKeys;
  enabled?: boolean;
  errorMessages: {
    delete: string;
    bulkDelete?: string;
  };
  bulkRepo?: {
    bulkDelete(ids: string[]): Promise<void>;
  };
  /** Override per-query stale time — use `STALE_TIMES.reference` for reference data. */
  staleTime?: number;
}

export function useEntityList<T extends BaseEntity>({
  repo,
  keys,
  enabled = true,
  errorMessages,
  bulkRepo,
  staleTime,
}: UseEntityListOptions<T>) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const { data: items = [], isLoading } = useQuery({
    queryKey: keys.list(),
    queryFn: () => repo.list(),
    enabled,
    staleTime,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: keys.list() });
      const previous = queryClient.getQueryData<T[]>(keys.list());
      queryClient.setQueryData<T[]>(
        keys.list(),
        (prev) => prev?.filter((item) => item.id !== deletedId) ?? []
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(keys.list(), context.previous);
      }
      handleError(error, errorMessages.delete);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.list() });
      queryClient.invalidateQueries({ queryKey: keys.search() });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!bulkRepo) throw new Error("Bulk delete not supported");
      return bulkRepo.bulkDelete(ids);
    },
    onMutate: async (deletedIds) => {
      await queryClient.cancelQueries({ queryKey: keys.list() });
      await queryClient.cancelQueries({ queryKey: keys.search() });
      const previousList = queryClient.getQueryData<T[]>(keys.list());
      queryClient.setQueryData<T[]>(
        keys.list(),
        (prev) => prev?.filter((item) => !deletedIds.includes(item.id)) ?? []
      );
      const removedSet = new Set(deletedIds);
      queryClient.setQueriesData<unknown>({ queryKey: keys.search() }, (prev: unknown) => {
        if (!prev) return prev;
        if (isInfinitePaginatedData<T>(prev)) {
          let removed = 0;
          const pages = prev.pages.map((page) => {
            const filteredData = page.data.filter((item) => !removedSet.has(item.id));
            removed += page.data.length - filteredData.length;
            return { ...page, data: filteredData };
          });
          return {
            ...prev,
            pages: pages.map((page) => ({
              ...page,
              meta: { ...page.meta, total: Math.max(0, page.meta.total - removed) },
            })),
          };
        }
        if (isSinglePagePaginatedData<T>(prev)) {
          const filteredData = prev.data.filter((item) => !removedSet.has(item.id));
          const removed = prev.data.length - filteredData.length;
          return {
            ...prev,
            data: filteredData,
            meta: { ...prev.meta, total: Math.max(0, prev.meta.total - removed) },
          };
        }
        return prev;
      });
      return { previousList };
    },
    onError: (error, _ids, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(keys.list(), context.previousList);
      }
      handleError(error, errorMessages.bulkDelete ?? errorMessages.delete);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.list() });
      queryClient.invalidateQueries({ queryKey: keys.search() });
    },
  });

  return {
    items,
    isLoading,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    bulkDeleteItems: bulkRepo ? bulkDeleteMutation.mutateAsync : undefined,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
}
