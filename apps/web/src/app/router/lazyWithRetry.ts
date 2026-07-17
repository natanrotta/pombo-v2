import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { isChunkLoadError } from "@/shared/utils/chunkError";
import { reloadForStaleChunk } from "@/shared/utils/chunkReload";

/**
 * Drop-in replacement for `React.lazy` that survives a stale chunk.
 *
 * When a route's dynamic `import()` rejects because its hashed chunk is gone, we
 * reload the page once (via the shared, debounced `reloadForStaleChunk` guard)
 * so the browser fetches the current `index.html` and the live chunk graph.
 * This happens in dev whenever Vite regenerates its optimized dep chunks (e.g.
 * after the `.vite` cache is rebuilt) — the `browserHash` can stay the same, so
 * Vite never signals a reload and an open tab keeps requesting a chunk file that
 * no longer exists. It also happens in prod when a new deploy replaces the chunk
 * graph while a user still has the old `index.html` open.
 *
 * A second failure inside the debounce window is treated as a real error and
 * propagates to `RouteErrorBoundary`. The guard is intentionally NOT cleared on
 * a successful load — a healthy sibling chunk resolving on each reload while a
 * broken one keeps rejecting would otherwise re-arm the reload every cycle and
 * loop forever.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors React.lazy's own `ComponentType<any>` constraint so components with props are accepted
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      if (isChunkLoadError(error) && reloadForStaleChunk()) {
        // Never resolve: hold Suspense until the reload navigates away, so the
        // dead "page load error" screen never flashes before the refresh.
        return new Promise<never>(() => {});
      }
      throw error;
    }
  });
}
