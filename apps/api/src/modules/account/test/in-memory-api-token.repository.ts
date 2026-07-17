import { randomUUID } from "node:crypto";
import { ApiToken } from "@modules/account/domain/entity/api-token.entity";
import {
  IApiTokenRepository,
  CreateApiTokenData,
} from "@modules/account/domain/repository/api-token-repository.interface";

/**
 * In-memory `IApiTokenRepository` for specs — mocks at the repository boundary
 * (R25). Enforces the same invariant the DB rotation does: `rotate` revokes the
 * account's active token before creating the new one, so there is never more
 * than one active token per account.
 */
export class InMemoryApiTokenRepository implements IApiTokenRepository {
  private readonly tokens = new Map<string, ApiToken>();

  async findActiveByAccount(accountId: string): Promise<ApiToken | null> {
    const active = [...this.tokens.values()]
      .filter((t) => t.accountId === accountId && t.revokedAt === null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active[0] ?? null;
  }

  async rotate(data: CreateApiTokenData): Promise<ApiToken> {
    // Revoke every currently-active token for the account.
    for (const [id, token] of this.tokens.entries()) {
      if (token.accountId === data.accountId && token.revokedAt === null) {
        this.tokens.set(
          id,
          new ApiToken({
            id: token.id,
            accountId: token.accountId,
            tokenHash: "",
            tokenPrefix: token.tokenPrefix,
            createdByUserId: "",
            lastUsedAt: token.lastUsedAt,
            revokedAt: new Date(),
            createdAt: token.createdAt,
          }),
        );
      }
    }

    const created = new ApiToken({
      id: randomUUID(),
      accountId: data.accountId,
      tokenHash: data.tokenHash,
      tokenPrefix: data.tokenPrefix,
      createdByUserId: data.createdByUserId,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date(),
    });
    this.tokens.set(created.id, created);
    return created;
  }

  /** Test helper: total rows (active + revoked) for an account. */
  countForAccount(accountId: string): number {
    return [...this.tokens.values()].filter((t) => t.accountId === accountId)
      .length;
  }
}
