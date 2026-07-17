/**
 * Build-time version identifier for this web build, injected by Vite's `define`
 * (see vite.config.ts). Resolves, in order: an explicit `VITE_APP_VERSION`
 * (e.g. stamped to match the API's vX.Y deploy tag) → the Cloudflare Pages
 * deploy commit (`CF_PAGES_COMMIT_SHA`, short) → "dev" for local runs.
 *
 * This is the WEB app's own version, distinct from the API version reported at
 * GET /api/health.
 */
export const APP_VERSION: string = __APP_VERSION__;
