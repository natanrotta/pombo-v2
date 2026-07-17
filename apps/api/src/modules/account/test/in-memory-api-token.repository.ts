import { randomUUID } from "node:crypto";
import { ApiToken } from "@modules/account/domain/entity/api-token.entity";
import {
  IApiTokenRepository,
  CreateApiTokenData,
} from "@modules/account/domain/repository/api-token-repository.interface";

interface StoredToken {
  entity: ApiToken;
  /** Kept alongside the entity because the domain entity deliberately never
   *  exposes the hash — the middleware looks it up by hash. */
  tokenHash: string;
}

/**
 * In-memory `IApiTokenRepository` for specs — mocks at the repository boundary
 * (R25). Enforces the same invariant the DB rotation does: `rotate` revokes the
 * account's active token before creating the new one, so there is never more
 * than one active token per account.
 */
export class InMemoryApiTokenRepository implements IApiTokenRepository {
  private readonly tokens = new Map<string, StoredToken>();

  private revoke(stored: StoredToken): StoredToken {
    const t = stored.entity;
    return {
      tokenHash: stored.tokenHash,
      entity: new ApiToken({
        id: t.id,
        accountId: t.accountId,
        tokenHash: "",
        tokenPrefix: t.tokenPrefix,
        createdByUserId: "",
        lastUsedAt: t.lastUsedAt,
        revokedAt: new Date(),
        createdAt: t.createdAt,
      }),
    };
  }

  async findActiveByAccount(accountId: string): Promise<ApiToken | null> {
    const active = [...this.tokens.values()]
      .map((s) => s.entity)
      .filter((t) => t.accountId === accountId && t.revokedAt === null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active[0] ?? null;
  }

  async findActiveByHash(tokenHash: string): Promise<ApiToken | null> {
    for (const stored of this.tokens.values()) {
      if (stored.tokenHash === tokenHash && stored.entity.revokedAt === null) {
        return stored.entity;
      }
    }
    return null;
  }

  async touchLastUsed(tokenId: string): Promise<void> {
    const stored = this.tokens.get(tokenId);
    if (!stored) return;
    const t = stored.entity;
    this.tokens.set(tokenId, {
      tokenHash: stored.tokenHash,
      entity: new ApiToken({
        id: t.id,
        accountId: t.accountId,
        tokenHash: stored.tokenHash,
        tokenPrefix: t.tokenPrefix,
        createdByUserId: "",
        lastUsedAt: new Date(),
        revokedAt: t.revokedAt,
        createdAt: t.createdAt,
      }),
    });
  }

  async rotate(data: CreateApiTokenData): Promise<ApiToken> {
    // Revoke every currently-active token for the account.
    for (const [id, stored] of this.tokens.entries()) {
      if (
        stored.entity.accountId === data.accountId &&
        stored.entity.revokedAt === null
      ) {
        this.tokens.set(id, this.revoke(stored));
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
    this.tokens.set(created.id, {
      entity: created,
      tokenHash: data.tokenHash,
    });
    return created;
  }

  /** Test helper: total rows (active + revoked) for an account. */
  countForAccount(accountId: string): number {
    return [...this.tokens.values()].filter(
      (s) => s.entity.accountId === accountId,
    ).length;
  }
}
