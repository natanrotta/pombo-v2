import type { PaginationParams } from "@/shared/types/pagination";

export function buildPaginationQuery(params: PaginationParams): URLSearchParams {
  return new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.search ? { search: params.search } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    ...(params.tagIds?.length ? { tagIds: params.tagIds.join(",") } : {}),
  });
}
