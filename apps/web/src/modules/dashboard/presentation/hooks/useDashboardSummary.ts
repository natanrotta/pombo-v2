import { useQuery } from "@tanstack/react-query";
import { repositories } from "@/core/di/repositories";
import { queryKeys } from "@/core/query/queryKeys";
import { STALE_TIMES } from "@/core/query/staleTimes";

/**
 * Fetches the aggregated dashboard payload for the current user. Wire the
 * repository to your product's summary endpoint; the boilerplate ships a
 * minimal generic shape.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => repositories.dashboard.getSummary(),
    staleTime: STALE_TIMES.default,
  });
}
