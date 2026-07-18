/**
 * Application-facing view of the runtime configuration.
 *
 * The application layer must never import `@core/config` directly
 * (layer rule: domain ← application ← infrastructure). This port lists ONLY
 * the config values application code consumes; the composition root
 * (`core/container`) registers the parsed `env` object as the
 * implementation — it structurally satisfies this interface, which is why
 * the SCREAMING_CASE names are kept as-is.
 */
export interface AppConfig {
  FRONTEND_URL: string;
  PASSWORD_RESET_TOKEN_TTL_MINUTES: number;
  EMAIL_VERIFICATION_PIN_TTL_MINUTES: number;

  // ── WhatsApp Gateway (pombo) ──────────────────────────────────────────────
  WHATSAPP_ENABLED: boolean;
  DISCONNECT_DEBOUNCE_MS: number;
  RECONNECT_BASE_DELAY_MS: number;
  RECONNECT_MAX_DELAY_MS: number;
  OUTBOX_TTL_HOURS: number;
  OUTBOX_PRUNE_INTERVAL_MS: number;
  SEND_RATE_MAX: number;
  SEND_RATE_WINDOW_MS: number;
  WEBHOOK_TIMEOUT_MS: number;
  WEBHOOK_MAX_ATTEMPTS: number;
  WEBHOOK_RETRY_BASE_DELAY_MS: number;
  ADVISORY_LOCK_HEARTBEAT_MS: number;

  // ── Redis read-aside caches ───────────────────────────────────────────────
  CACHE_ENTITY_TTL_SECONDS: number;
  CACHE_API_TOKEN_TTL_SECONDS: number;
}
