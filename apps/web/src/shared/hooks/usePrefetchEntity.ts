import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EntityQueryKeysWithDetail } from "@/core/query/entityQueryKeys";
import { STALE_TIMES } from "@/core/query/staleTimes";

interface UsePrefetchEntityOptions<T> {
  repo: { getById(id: string): Promise<T | null> };
  keys: EntityQueryKeysWithDetail;
  staleTime?: number;
}

/**
 * Returns a `prefetch(id)` callback that warms the detail cache for
 * an entity. Wire into `EntityCard onHover` / `onFocus` from list pages
 * so the detail page mounts with the query already resolved. Safe to
 * call repeatedly — TanStack Query dedupes within `staleTime`.
 */
export function usePrefetchEntity<T>({
  repo,
  keys,
  staleTime = STALE_TIMES.default,
}: UsePrefetchEntityOptions<T>) {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      void queryClient.prefetchQuery({
        queryKey: keys.detail(id),
        queryFn: () => repo.getById(id),
        staleTime,
      });
    },
    [queryClient, repo, keys, staleTime]
  );
}
