import { injectable } from "tsyringe";
import {
  IPasswordResetTokenRepository,
  CreatePasswordResetTokenData,
  PasswordResetToken,
} from "@modules/auth/domain/repository/password-reset-token-repository.interface";
import { prisma } from "@core/database/prisma/prisma-client";
import { password_reset_token as PrismaPasswordResetToken } from "@generated/prisma/client";

@injectable()
export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private toEntity(data: PrismaPasswordResetToken): PasswordResetToken {
    return {
      id: data.id,
      userId: data.user_id,
      tokenHash: data.token_hash,
      expiresAt: data.expires_at,
      usedAt: data.used_at,
      createdAt: data.created_at,
    };
  }

  async create(
    data: CreatePasswordResetTokenData,
  ): Promise<PasswordResetToken> {
    const created = await prisma.password_reset_token.create({
      data: {
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      },
    });
    return this.toEntity(created);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const found = await prisma.password_reset_token.findUnique({
      where: { token_hash: tokenHash },
    });
    return found ? this.toEntity(found) : null;
  }

  async markAsUsed(id: string): Promise<void> {
    await prisma.password_reset_token.update({
      where: { id },
      data: { used_at: new Date() },
    });
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await prisma.password_reset_token.updateMany({
      where: { user_id: userId, used_at: null },
      data: { used_at: new Date() },
    });
  }

  async deleteUnusedForUser(userId: string): Promise<void> {
    await prisma.password_reset_token.deleteMany({
      where: { user_id: userId, used_at: null },
    });
  }
}
