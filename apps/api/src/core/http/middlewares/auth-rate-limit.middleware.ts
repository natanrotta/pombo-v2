import rateLimit from "express-rate-limit";
import { env } from "../../config";
import { i18n } from "@shared/i18n";
import { ErrorCodes } from "@shared/error";
import { createRateLimitStore } from "./rate-limit-store";

/**
 * IP-keyed limiter for the unauthenticated auth surface (sign-in, sign-up,
 * password reset, refresh). Default 10 req / 15min matches the historical
 * inline definition that previously lived in `auth.routes.ts`. Extracted into
 * a named middleware so a future signup-specific cap doesn't need to clone
 * the boilerplate.
 *
 * Intentionally IP-only — no `keyGenerator` override — because the surface is
 * pre-auth. `app.set("trust proxy", 1)` in `app.ts` keeps the client IP intact
 * behind the load balancer.
 */
export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  store: createRateLimitStore("auth"),
  passOnStoreError: true,
  handler: (req, res) => {
    const locale = req.locale || "pt-BR";
    const message = i18n.t(`errors:${ErrorCodes.AUTH_RATE_LIMIT}`, {
      lng: locale,
    });
    res.status(429).json({
      ok: false,
      error: { message, code: ErrorCodes.AUTH_RATE_LIMIT },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Project is behind `app.set("trust proxy", 1)` — opt out of the
  // upstream startup warning the other rate-limit middlewares also skip.
  validate: { ip: false, keyGeneratorIpFallback: false },
});
