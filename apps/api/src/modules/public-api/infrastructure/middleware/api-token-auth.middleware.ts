import { Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IApiTokenRepository } from "@modules/account/domain/repository/api-token-repository.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * Auth guard for the public `/api/v1` surface. Resolves the `Authorization:
 * Bearer pmb_…` token to its owning account:
 *
 *  - no Bearer header       → 401 API_TOKEN_MISSING
 *  - unknown OR revoked hash → 401 API_TOKEN_INVALID (indistinguishable)
 *
 * The raw token is hashed (SHA-256) and matched against the stored hash — the
 * clear token is never compared or logged (R22). On success it populates
 * `req.apiAuth = { accountId, tokenId }` and stamps `last_used_at`
 * fire-and-forget (a failed stamp never blocks or fails the request).
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

      req.apiAuth = { accountId: apiToken.accountId, tokenId: apiToken.id };

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
