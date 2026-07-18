import { injectable } from "tsyringe";
import { ApiToken } from "@modules/account/domain/entity/api-token.entity";
import {
  IApiTokenRepository,
  CreateApiTokenData,
} from "@modules/account/domain/repository/api-token-repository.interface";
import { prisma } from "@core/database/prisma/prisma-client";
import { mapPrismaError } from "@core/database/prisma/prisma-error-mapper";
import { api_token as PrismaApiToken } from "@generated/prisma/client";

@injectable()
export class PrismaApiTokenRepository implements IApiTokenRepository {
  private toEntity(row: PrismaApiToken): ApiToken {
    return new ApiToken({
      id: row.id,
      accountId: row.account_id,
      tokenHash: row.token_hash,
      tokenPrefix: row.token_prefix,
      createdByUserId: row.created_by_user_id,
      lastUsedAt: row.last_used_at,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    });
  }

  async findActiveByAccount(accountId: string): Promise<ApiToken | null> {
    try {
      const row = await prisma.api_token.findFirst({
        where: { account_id: accountId, revoked_at: null },
        orderBy: { created_at: "desc" },
      });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findActiveByHash(tokenHash: string): Promise<ApiToken | null> {
    try {
      // token_hash is @unique; the extra revoked_at guard makes a revoked token
      // resolve to null (indistinguishable from unknown to the caller).
      const row = await prisma.api_token.findFirst({
        where: { token_hash: tokenHash, revoked_at: null },
      });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async touchLastUsed(tokenId: string): Promise<void> {
    try {
      await prisma.api_token.update({
        where: { id: tokenId },
        data: { last_used_at: new Date() },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async rotate(data: CreateApiTokenData): Promise<ApiToken> {
    try {
      // Atomic rotation: revoke every active token for the account, then create
      // the replacement — so there is never more than one active token.
      const row = await prisma.$transaction(async (tx) => {
        await tx.api_token.updateMany({
          where: { account_id: data.accountId, revoked_at: null },
          data: { revoked_at: new Date() },
        });
        return tx.api_token.create({
          data: {
            account_id: data.accountId,
            token_hash: data.tokenHash,
            token_prefix: data.tokenPrefix,
            created_by_user_id: data.createdByUserId,
          },
        });
      });
      return this.toEntity(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }
}
