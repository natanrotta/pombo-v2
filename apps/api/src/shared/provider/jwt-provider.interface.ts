/**
 * JWT payload shape. Single-user boilerplate: the session is bound to a
 * `userId` only — there are no accounts, memberships or roles.
 */
export interface JwtPayload {
  userId: string;
  tokenVersion: number;
  /**
   * Capability scope for narrow-purpose tokens (e.g. the `email:verify`
   * token minted at sign-up). Absent = full-access session token.
   */
  scope?: string;
}

export interface TokenPairResult {
  token: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/** Raw refresh credential + the matching expiration timestamps. Issued by
 *  sign-up before the user's id exists; the JWT itself is signed only after
 *  the transaction commits and the final id is known. */
export interface RefreshCredentialResult {
  refreshToken: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface ScopedTokenResult {
  token: string;
  expiresAt: Date;
}

export interface IJwtProvider {
  /**
   * Sign a full-access token. `ttlSeconds` overrides the default
   * `JWT_EXPIRES_IN`.
   */
  sign(payload: JwtPayload, ttlSeconds?: number): string;
  verify(token: string): JwtPayload;
  generateRefreshToken(): string;
  /**
   * Derive the at-rest hash of a refresh token. The DB stores the hash,
   * the cookie holds the raw value — compare via this helper on refresh.
   */
  hashRefreshToken(rawToken: string): string;
  generateTokenPair(payload: JwtPayload): TokenPairResult;
  /**
   * Issues a refresh token and computes the matching expiration timestamps
   * WITHOUT signing a JWT. Used by sign-up, where the user id is only known
   * after the atomic create transaction commits.
   */
  issueRefreshCredential(): RefreshCredentialResult;
  /**
   * Issue a short-lived, capability-scoped token (e.g. `email:verify`).
   * A scoped token is rejected by every route that doesn't explicitly opt in.
   */
  signScoped(
    payload: JwtPayload,
    scope: string,
    ttlSeconds: number,
  ): ScopedTokenResult;
}
