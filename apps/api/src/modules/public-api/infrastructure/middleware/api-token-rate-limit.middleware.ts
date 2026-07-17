import rateLimit from "express-rate-limit";
import { env } from "@core/config";
import { i18n } from "@shared/i18n";
import { ErrorCodes } from "@shared/error";
import { createRateLimitStore } from "@core/http/middlewares/rate-limit-store";

/**
 * Per-token limiter for the public `/api/v1` surface, keyed by the api_token id
 * (`req.apiAuth.tokenId`) — so one account's token can't exhaust another's
 * budget. Layered ON TOP of the app-level global (IP) limiter. Mounted AFTER
 * `apiTokenAuthMiddleware`, so `req.apiAuth` is always set here.
 */
export const apiTokenRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_API_WINDOW_MS,
  max: env.RATE_LIMIT_API_MAX,
  store: createRateLimitStore("api"),
  passOnStoreError: true,
  keyGenerator: (req) => req.apiAuth?.tokenId ?? "unauthenticated",
  handler: (req, res) => {
    const locale = req.locale || "pt-BR";
    const message = i18n.t(`errors:${ErrorCodes.RATE_LIMIT}`, { lng: locale });
    res.status(429).json({
      ok: false,
      error: { message, code: ErrorCodes.RATE_LIMIT },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Behind `app.set("trust proxy", 1)` — opt out of the upstream warning, and
  // we key by token id (not IP) anyway.
  validate: { ip: false, keyGeneratorIpFallback: false },
});
