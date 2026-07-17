/**
 * True when an error is the "stale chunk" failure: a lazy `import()` whose
 * hashed JS chunk no longer exists at the URL the loaded app remembers. It
 * happens when Vite re-optimizes dependencies mid dev-session, or when a new
 * production deploy swaps the chunk hashes while a user still has the previous
 * `index.html` open. Each browser engine words it differently, so we match all
 * the known phrasings.
 *
 * The recovery for this class of error is ALWAYS a full page reload — the
 * browser memoizes a rejected `import()` promise, so re-running the same import
 * (e.g. a soft error-boundary retry) can never succeed. See `lazyWithRetry`.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    // Chromium + Firefox (Vite dynamic import)
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    // Safari
    message.includes("Importing a module script failed") ||
    // Vite's `__vitePreload` when a chunk's CSS dep is gone after a deploy
    message.includes("Unable to preload CSS") ||
    // A missing `.js` served the SPA `index.html` fallback → wrong MIME type
    message.includes("is not a valid JavaScript MIME type")
  );
}
