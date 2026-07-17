import { Request } from "express";
import { ACCESS_TOKEN_COOKIE } from "./auth-cookies";

/**
 * Resolves the session JWT for a request from one of two sources, in order:
 *
 *  1. `Authorization: Bearer <token>` — used by `apps/admin`, API clients, the
 *     SSE `?access_token=` path (promoted to this header by
 *     `bearerFromQueryToken`), and as the migration/escape-hatch path.
 *  2. The `boilerplate_at` httpOnly cookie — the web app's credential after the
 *     localStorage→cookie migration. JS can't read it; the browser attaches it
 *     automatically with `withCredentials`.
 *
 * Bearer takes precedence so an explicit header always wins over a cookie.
 * Returns `null` when neither source carries a token.
 */
export function extractRequestToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}
