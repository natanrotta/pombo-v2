/**
 * Shared recovery for a "stale chunk" — a dynamic `import()` whose hashed JS
 * chunk no longer exists at the URL the loaded app remembers (Vite regenerating
 * its optimized-dep chunks in dev, or a new deploy replacing the chunk graph in
 * prod). The fix is a full page reload so the browser fetches the current
 * `index.html` + live chunk graph; the browser caches a rejected `import()`
 * promise, so re-running the same import can never recover. In dev this only
 * works because vite.config.ts strips the `immutable` cache header from
 * optimized dep chunks — otherwise the reload would re-use the poisoned parent
 * chunk straight from the browser's disk cache (same `?v=` browserHash) and
 * fail forever.
 *
 * Every recovery path (lazyWithRetry, the global `vite:preloadError` listener,
 * RouteErrorBoundary) shares the ONE guard below so they cooperate on a single
 * "reload at most once per window" budget instead of reloading each other in a
 * loop.
 */

const RELOAD_GUARD_KEY = "pombo:chunk-reload";
const RELOAD_DEBOUNCE_MS = 10_000;

/** `sessionStorage` can throw when storage is fully blocked (privacy modes) — never let that kill the recovery path. */
function readGuard(): number {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function writeGuard(): void {
  try {
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Without storage the debounce degrades to "reload every time" — still
    // better than a dead screen, and the window only matters for broken builds.
  }
}

/**
 * Reload the page to recover from a stale chunk — but at most once per
 * `RELOAD_DEBOUNCE_MS`, so a genuinely broken build can't reload forever.
 * Returns `true` if a reload was triggered, `false` if suppressed because a
 * recovery reload already happened within the window. The guard is NEVER
 * cleared early by a healthy load: with multiple lazy chunks per page, a
 * healthy sibling resolving while the broken one rejects would re-arm the
 * reload on every cycle — an infinite reload loop. Letting the window expire
 * naturally caps recovery at one reload per window, period.
 */
export function reloadForStaleChunk(): boolean {
  if (Date.now() - readGuard() < RELOAD_DEBOUNCE_MS) return false;
  writeGuard();
  window.location.reload();
  return true;
}

/**
 * Install a global net for dynamic-import failures that DON'T flow through a
 * `lazyWithRetry`/React.lazy boundary — most importantly Vite's
 * `vite:preloadError`, emitted by the production `__vitePreload` helper when a
 * deploy has swapped the chunk graph under an open tab. Call once at startup.
 * Returns a teardown (used by tests). No-op effect in dev, where native dynamic
 * imports don't go through the preload helper and the event never fires.
 */
export function installStaleChunkReloadListener(): () => void {
  const onPreloadError = (event: Event) => {
    // Only swallow the error when we actually reloaded. If the guard
    // suppressed the reload, let Vite rethrow the original chunk error so a
    // boundary still sees a chunk-shaped failure — preventDefault here would
    // make the import "succeed" with `undefined` and crash downstream with an
    // error `isChunkLoadError` can't recognize. (The runtime event is Vite's
    // `VitePreloadErrorEvent`, which carries the authoritative error in
    // `event.payload` — unused here because we reload unconditionally, but it
    // is what Vite's default handler rethrows on the suppressed path.)
    if (reloadForStaleChunk()) {
      event.preventDefault();
    }
  };
  window.addEventListener("vite:preloadError", onPreloadError);
  return () => window.removeEventListener("vite:preloadError", onPreloadError);
}
