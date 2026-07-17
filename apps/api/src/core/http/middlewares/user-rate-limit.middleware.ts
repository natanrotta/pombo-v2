import rateLimit from "express-rate-limit";
import { env } from "../../config";
import { i18n } from "@shared/i18n";
import { ErrorCodes } from "@shared/error";
import { createRateLimitStore } from "./rate-limit-store";

export const userRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_USER_WINDOW_MS,
  max: env.RATE_LIMIT_USER_MAX,
  store: createRateLimitStore("user"),
  passOnStoreError: true,
  keyGenerator: (req) => {
    return req.auth?.userId || req.ip || "anonymous";
  },
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
  validate: { ip: false, keyGeneratorIpFallback: false },
});
