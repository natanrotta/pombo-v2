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
}
