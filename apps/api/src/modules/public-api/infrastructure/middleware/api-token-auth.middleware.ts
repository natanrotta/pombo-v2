import { Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IApiTokenRepository } from "@modules/account/domain/repository/api-token-repository.interface";
import type { ICacheProvider } from "@shared/provider/cache-provider.interface";
import type { AppConfig } from "@shared/provider/app-config.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

interface ApiAuth {
  accountId: string;
  tokenId: string;
}

/**
 * Auth guard for the public `/api/v1` surface. Resolves the `Authorization:
 * Bearer pmb_…` token to its owning account:
 *
 *  - no Bearer header       → 401 API_TOKEN_MISSING
 *  - unknown OR revoked hash → 401 API_TOKEN_INVALID (indistinguishable)
 *
 * The raw token is hashed (SHA-256) and matched against the stored hash — the
 * clear token is never compared or logged (R22).
 *
 * A read-aside Redis cache (`apitoken:{hash}` → `{ accountId, tokenId }`, TTL
 * `CACHE_API_TOKEN_TTL_SECONDS`) short-circuits the DB lookup on the hot path.
 * REVOCATION TRADE-OFF: `rotate` can't invalidate the old hash, so a revoked
 * token keeps working for at most one TTL window — keep the TTL small. The
 * `last_used_at` stamp only runs on a cache MISS (a DB round-trip is happening
 * anyway), so `last_used_at` is accurate to within the TTL and the cache path
 * stays read-only.
 */
export function apiTokenAuthMiddleware() {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith("Bearer ")) {
        throw new UnauthorizedError(
          "Missing API token",
          undefined,
          ErrorCodes.API_TOKEN_MISSING,
        );
      }

      const token = header.slice("Bearer ".length).trim();
      if (!token) {
        throw new UnauthorizedError(
          "Missing API token",
          undefined,
          ErrorCodes.API_TOKEN_MISSING,
        );
      }

      const tokenHash = createHash("sha256").update(token).digest("hex");
      const cacheKey = `apitoken:${tokenHash}`;
      const cache = container.resolve<ICacheProvider>(DI_TOKENS.CacheProvider);

      // Fast path: a cached resolution. Fail-open — a cache error is a miss.
      let cached: ApiAuth | null = null;
      try {
        cached = await cache.get<ApiAuth>(cacheKey);
      } catch {
        cached = null;
      }
      if (cached) {
        req.apiAuth = cached;
        next();
        return;
      }

      // Miss: hit the DB, back-fill the cache, and stamp last-used (a DB
      // round-trip is happening here anyway).
      const repo = container.resolve<IApiTokenRepository>(
        DI_TOKENS.ApiTokenRepository,
      );
      const apiToken = await repo.findActiveByHash(tokenHash);
      if (!apiToken) {
        throw new UnauthorizedError(
          "Invalid API token",
          undefined,
          ErrorCodes.API_TOKEN_INVALID,
        );
      }

      const apiAuth: ApiAuth = {
        accountId: apiToken.accountId,
        tokenId: apiToken.id,
      };
      req.apiAuth = apiAuth;

      const config = container.resolve<AppConfig>(DI_TOKENS.AppConfig);
      try {
        await cache.set(
          cacheKey,
          JSON.stringify(apiAuth),
          config.CACHE_API_TOKEN_TTL_SECONDS,
        );
      } catch {
        // fail-open — the next request just re-resolves from the DB
      }

      // Best-effort last-used stamp — never block the request on it, but log a
      // failure instead of swallowing it silently.
      void repo.touchLastUsed(apiToken.id).catch((error: unknown) => {
        container.resolve<ILoggerProvider>(DI_TOKENS.LoggerProvider).warn(
          {
            tokenId: apiToken.id,
            message: error instanceof Error ? error.message : String(error),
          },
          "api token last-used stamp failed",
        );
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}
