import { Response } from "express";
import { env } from "../../config";
import { parseExpiresIn } from "@shared/util/parse-expires-in";

const isProduction =
  env.NODE_ENV === "production" || env.NODE_ENV === "staging";

const REFRESH_TOKEN_COOKIE = "pombo_rt";
const CSRF_TOKEN_COOKIE = "pombo_csrf";
// Session access JWT. httpOnly so JS can never read it (closes XSS→session
// theft) — the browser sends it automatically with `withCredentials`. Path "/"
// because every API route needs it (unlike the refresh cookie, scoped to
// /api/auth). The JWT's own `exp` (15m) governs real validity; the maxAge just
// mirrors the refresh cookie so the cookie persists across the session and the
// refresh flow rotates it.
const ACCESS_TOKEN_COOKIE = "pombo_at";

/**
 * Sets only the CSRF cookie. Used on its own at sign-up — the account is not
 * yet verified, so there is no refresh token to issue, but the scoped
 * `email:verify` token still drives authenticated POSTs (send/verify PIN)
 * that must pass the double-submit CSRF check. Also reused by `setAuthCookies`.
 */
export function setCsrfCookie(res: Response, csrfToken: string): void {
  const maxAge = parseExpiresIn(env.REFRESH_TOKEN_EXPIRES_IN);

  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, {
    httpOnly: false, // Must be readable by JS for CSRF header
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  });
}

/**
 * Sets the httpOnly access-token cookie (`pombo_at`). Called wherever a
 * session JWT is issued — alongside `setAuthCookies` for the normal flows, and
 * on its own for impersonation (which has no refresh token). Kept separate from
 * `setAuthCookies` so the access/refresh tokens can never be swapped by a
 * positional-argument mistake.
 */
export function setAccessTokenCookie(res: Response, accessToken: string): void {
  const maxAge = parseExpiresIn(env.REFRESH_TOKEN_EXPIRES_IN);

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  });
}

export function setAuthCookies(
  res: Response,
  refreshToken: string,
  csrfToken: string,
): void {
  const maxAge = parseExpiresIn(env.REFRESH_TOKEN_EXPIRES_IN);

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth",
    maxAge,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  });

  setCsrfCookie(res, csrfToken);
}

// A cookie set with a `domain` attribute can only be cleared by a clearCookie
// that passes the SAME domain — otherwise the browser keeps it. Read at call
// time (like the setters) so it tracks the configured COOKIE_DOMAIN.
function domainOpt(): { domain?: string } {
  return env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {};
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/auth", ...domainOpt() });
  res.clearCookie(CSRF_TOKEN_COOKIE, { path: "/", ...domainOpt() });
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/", ...domainOpt() });
}

/**
 * Clears ONLY the access cookie (+ CSRF), leaving the refresh cookie intact.
 * Used to end a support-impersonation session — which has no refresh credential
 * — without disturbing a real session that a misdirected call might carry.
 */
export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/", ...domainOpt() });
  res.clearCookie(CSRF_TOKEN_COOKIE, { path: "/", ...domainOpt() });
}

export { REFRESH_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE };
