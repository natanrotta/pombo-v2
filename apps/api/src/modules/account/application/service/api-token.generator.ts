import { randomBytes, createHash } from "node:crypto";

export interface GeneratedApiToken {
  /** The clear `pmb_…` token. Returned to the client EXACTLY once, then dropped
   *  — only `tokenHash` is persisted. */
  token: string;
  /** SHA-256 hash stored at rest (R22). */
  tokenHash: string;
  /** Display-safe fragment (`pmb_…` + last chars) for the settings screen. */
  tokenPrefix: string;
}

const TOKEN_PREFIX = "pmb_";

/**
 * Mints a public-API token: `pmb_` + 40 hex chars (20 random bytes = 160 bits,
 * brute-force-infeasible). The raw token is hashed with SHA-256 for storage;
 * the display prefix keeps the head and tail so a user can recognize which
 * token is active without ever seeing the secret again.
 */
export function generateApiToken(): GeneratedApiToken {
  const token = `${TOKEN_PREFIX}${randomBytes(20).toString("hex")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const tokenPrefix = `${token.slice(0, 8)}…${token.slice(-4)}`;
  return { token, tokenHash, tokenPrefix };
}
