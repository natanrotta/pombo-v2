import { useState, useMemo, useCallback } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import type { PaginatedResponse, PaginationParams } from "@/shared/types/pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";

interface UseInfiniteListPageOptions<T> {
  queryKey: readonly unknown[];
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>;
  defaultLimit?: number;
  enabled?: boolean;
}

export function useInfiniteListPage<T>({
  queryKey,
  fetchFn,
  defaultLimit = 12,
  enabled = true,
}: UseInfiniteListPageOptions<T>) {
  const [search, setSearchRaw] = useState("");
  const [tagIds, setTagIdsRaw] = useState<string[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: [...queryKey, { search: debouncedSearch, limit: defaultLimit, tagIds }],
    queryFn: ({ pageParam }) =>
      fetchFn({
        page: pageParam,
        limit: defaultLimit,
        search: debouncedSearch || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    // Keep showing the previous result set while a new search / filter
    // query is in flight. Prevents the grid from collapsing to a skeleton
    // on every keystroke or tag toggle.
    placeholderData: keepPreviousData,
    enabled,
  });

  const items = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const total = useMemo(() => {
    const pages = data?.pages;
    if (!pages?.length) return 0;
    return pages[pages.length - 1].meta.total;
  }, [data]);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
  }, []);

  const setTagIds = useCallback((ids: string[]) => {
    setTagIdsRaw(ids);
  }, []);

  return {
    items,
    total,
    search,
    setSearch,
    tagIds,
    setTagIds,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
  };
}
