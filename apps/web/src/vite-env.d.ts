/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin. Unset falls back to the same-origin `/api` proxy. */
  readonly VITE_API_URL?: string;
  /** Google OAuth client id for the Sign in with Google button. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Bugsnag browser notifier API key. Unset disables error reporting. */
  readonly VITE_BUGSNAG_API_KEY?: string;
  /** Release stamp forwarded to Bugsnag; falls back to __APP_VERSION__. */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Build-time version stamp injected by Vite's `define` (see vite.config.ts). */
declare const __APP_VERSION__: string;
