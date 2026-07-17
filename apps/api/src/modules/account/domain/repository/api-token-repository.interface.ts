import { ApiToken } from "../entity/api-token.entity";

export interface CreateApiTokenData {
  accountId: string;
  tokenHash: string;
  tokenPrefix: string;
  createdByUserId: string;
}

/**
 * The port for the account's public-API credential. Scoped by `account_id`
 * (BASELINE R1). The invariant "at most one active token per account" is
 * enforced by `rotate`, which revokes the current active token and creates the
 * new one in a single transaction.
 */
export interface IApiTokenRepository {
  /** The account's current non-revoked token, or null if none. */
  findActiveByAccount(accountId: string): Promise<ApiToken | null>;
  /** Atomically revoke the account's active token (if any) and create a new
   *  one. Returns the newly created token. */
  rotate(data: CreateApiTokenData): Promise<ApiToken>;
}
