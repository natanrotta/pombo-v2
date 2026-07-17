import { injectable } from "tsyringe";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  IJwtProvider,
  JwtPayload,
  RefreshCredentialResult,
  ScopedTokenResult,
  TokenPairResult,
} from "@shared/provider";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { env } from "../../config";
import { parseExpiresIn } from "@shared/util/parse-expires-in";

@injectable()
export class JsonWebTokenJwtProvider implements IJwtProvider {
  sign(payload: JwtPayload, ttlSeconds?: number): string {
    return jwt.sign(payload as object, env.JWT_SECRET, {
      expiresIn: ttlSeconds ?? env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  signScoped(
    payload: JwtPayload,
    scope: string,
    ttlSeconds: number,
  ): ScopedTokenResult {
    const token = jwt.sign({ ...payload, scope }, env.JWT_SECRET, {
      expiresIn: ttlSeconds,
    } as jwt.SignOptions);
    return { token, expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
  }

  verify(token: string): JwtPayload {
    try {
      // Pin the algorithm to HS256 to prevent alg-confusion attacks
      // (e.g., a forged `alg: none` token or one re-signed as RS256 with
      // the secret used as the public key). Matches what `sign()` produces.
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
      }) as JwtPayload;
      return {
        userId: decoded.userId,
        tokenVersion: decoded.tokenVersion,
        scope: decoded.scope,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Token expired",
          undefined,
          ErrorCodes.AUTH_TOKEN_EXPIRED,
        );
      }
      throw new UnauthorizedError(
        "Invalid token",
        undefined,
        ErrorCodes.AUTH_TOKEN_INVALID,
      );
    }
  }

  generateRefreshToken(): string {
    return crypto.randomUUID();
  }

  hashRefreshToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  generateTokenPair(payload: JwtPayload): TokenPairResult {
    const credential = this.issueRefreshCredential();
    const token = this.sign(payload);
    return { token, ...credential };
  }

  issueRefreshCredential(): RefreshCredentialResult {
    return {
      refreshToken: this.generateRefreshToken(),
      tokenExpiresAt: new Date(Date.now() + parseExpiresIn(env.JWT_EXPIRES_IN)),
      refreshTokenExpiresAt: new Date(
        Date.now() + parseExpiresIn(env.REFRESH_TOKEN_EXPIRES_IN),
      ),
    };
  }
}
