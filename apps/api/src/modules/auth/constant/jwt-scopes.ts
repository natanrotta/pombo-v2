// Capability scopes for short-lived JWTs issued to transports that can't
// keep the token off the URL (SSE, `<a download>`). A scoped token is
// rejected by every route that doesn't explicitly opt in to it via
// `requireScope(...)`. Adding a new scope: declare it here, mint via
// `IJwtProvider.signScoped`, and gate the consumer route(s).
import { EMAIL_VERIFY_JWT_SCOPE } from "@boilerplate/shared-types";

export const JWT_SCOPES = {
  ImportsStream: "imports:stream",
  // Issued by sign-up to a freshly-registered (email+password) user whose
  // e-mail is not yet confirmed. Its payload carries `accountId: null`, so
  // `authMiddleware()` already rejects it on every account-bound route by
  // default — the only routes that accept it are the send/verify-PIN
  // endpoints gated by `emailVerificationAuthMiddleware()`. Value is shared
  // with the web client via `@boilerplate/shared-types` to prevent drift.
  EmailVerification: EMAIL_VERIFY_JWT_SCOPE,
  // Issued by the admin Google sign-in to a user with `is_support = true`.
  // Carries `accountId: null` (support is account-agnostic), so the regular
  // account-bound `authMiddleware()` already rejects it everywhere; only the
  // `/admin/*` routes opt in via `supportAuthMiddleware()`.
  Support: "support",
} as const;

export type JwtScope = (typeof JWT_SCOPES)[keyof typeof JWT_SCOPES];

export const STREAM_TOKEN_TTL_SECONDS = 5 * 60;

// The email-verify token must outlive the PIN itself so the user can request
// a fresh PIN (resend) without the session expiring underneath them. 60 min
// gives generous head-room over the 15-min PIN TTL.
export const EMAIL_VERIFICATION_TOKEN_TTL_SECONDS = 60 * 60;

// Admin-panel session length. No refresh-token rotation for the support
// session (it would clobber the shared `user.refresh_token_hash` used by the
// web app), so the access token itself is long-lived; on expiry the support
// user re-authenticates with a single Google click.
export const SUPPORT_TOKEN_TTL_SECONDS = 12 * 60 * 60;
