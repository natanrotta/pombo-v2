import type { PaginatedResponse, PaginationParams } from "@/shared/types/pagination";
import { useInfiniteListPage } from "@/shared/hooks/useInfiniteListPage";

interface UseServerSearchOptions<T> {
  queryKey: readonly unknown[];
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>;
  enabled?: boolean;
  limit?: number;
}

export function useServerSearch<T>({
  queryKey,
  fetchFn,
  enabled = true,
  limit = 20,
}: UseServerSearchOptions<T>) {
  return useInfiniteListPage({
    queryKey,
    fetchFn,
    defaultLimit: limit,
    enabled,
  });
}
