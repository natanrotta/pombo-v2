import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { IJwtProvider } from "@shared/provider";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { JWT_SCOPES } from "@modules/auth/constant/jwt-scopes";
import { extractRequestToken } from "../helpers/extract-request-token";

// Promotes `?access_token=` to the Authorization header so EventSource and
// `<a download>` routes can authenticate (browser APIs can't set custom
// headers). Mount on read-only paths only — tokens on URLs leak into proxy
// logs and browser history.
export function bearerFromQueryToken() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
      const queryToken = req.query["access_token"];
      if (typeof queryToken === "string" && queryToken.length > 0) {
        req.headers.authorization = `Bearer ${queryToken}`;
      }
    }
    next();
  };
}

/**
 * Session auth guard. Verifies the JWT, checks the token version against the
 * user row (revocation), and populates `req.auth`.
 *
 * **Scoped tokens are rejected by default** (SEC-C1). A route that
 * legitimately consumes a scope opts in via
 * `authMiddleware({ allowScopes: [scope] })`; every other route stays
 * fail-closed automatically.
 */
export function authMiddleware(options: { allowScopes?: string[] } = {}) {
  const allowScopes = options.allowScopes ?? [];
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = extractRequestToken(req);

      if (!token) {
        throw new UnauthorizedError(
          "No token provided",
          undefined,
          ErrorCodes.AUTH_NO_TOKEN,
        );
      }

      const jwtProvider = container.resolve<IJwtProvider>("JwtProvider");
      const payload = jwtProvider.verify(token);

      const userRepository =
        container.resolve<IUserRepository>("UserRepository");
      const user = await userRepository.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedError(
          "User not found",
          undefined,
          ErrorCodes.AUTH_TOKEN_INVALID,
        );
      }

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedError(
          "Token has been revoked",
          undefined,
          ErrorCodes.AUTH_TOKEN_REVOKED,
        );
      }

      // Scoped token on a route that didn't opt in (SEC-C1): reject fail-closed.
      if (payload.scope && !allowScopes.includes(payload.scope)) {
        throw new UnauthorizedError(
          "Scoped token cannot be used on this route",
          undefined,
          ErrorCodes.AUTH_TOKEN_INVALID,
        );
      }

      req.auth = {
        userId: payload.userId,
        accountId: user.accountId,
        language: user.language,
        scope: payload.scope,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Gate for the e-mail-confirmation endpoints (`POST /auth/email-verification/
 * send` and `/verify`). Accepts ONLY a token carrying the `email:verify`
 * scope (minted by sign-up). Populates `req.emailVerifyAuth` with the user id.
 */
export function emailVerificationAuthMiddleware() {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError(
          "No token provided",
          undefined,
          ErrorCodes.AUTH_NO_TOKEN,
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const jwtProvider = container.resolve<IJwtProvider>("JwtProvider");
      const payload = jwtProvider.verify(token);

      if (payload.scope !== JWT_SCOPES.EmailVerification) {
        throw new UnauthorizedError(
          "Token scope does not authorize this route",
          undefined,
          ErrorCodes.AUTH_TOKEN_INVALID,
        );
      }

      const userRepository =
        container.resolve<IUserRepository>("UserRepository");
      const user = await userRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError(
          "User not found",
          undefined,
          ErrorCodes.AUTH_TOKEN_INVALID,
        );
      }
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedError(
          "Token has been revoked",
          undefined,
          ErrorCodes.AUTH_TOKEN_REVOKED,
        );
      }

      req.emailVerifyAuth = { userId: payload.userId };
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Gate that rejects capability-scoped tokens on routes that must only accept
// full-access sessions.
export function rejectScopedTokens() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.auth.scope) {
      next(
        new UnauthorizedError(
          "Scoped token cannot be used on this route",
          undefined,
          ErrorCodes.AUTH_TOKEN_INVALID,
        ),
      );
      return;
    }
    next();
  };
}

export function requireScope(scope: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.auth.scope !== scope) {
      next(
        new UnauthorizedError(
          "Token scope does not authorize this route",
          undefined,
          ErrorCodes.AUTH_TOKEN_INVALID,
        ),
      );
      return;
    }
    next();
  };
}
