/** Non-secret metadata for the account's active API token (null when the
 *  account has never generated one). Mirrors the backend `toMetadata()`. */
export interface ApiTokenMetadata {
  /** Display-safe fragment (`pmb_…` + last chars) — never the secret. */
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Returned once when a token is generated — carries the clear token. */
export interface GeneratedApiToken {
  token: string;
}
