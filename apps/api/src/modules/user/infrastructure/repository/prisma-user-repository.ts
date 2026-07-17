import { injectable } from "tsyringe";
import { User } from "@modules/user/domain/entity/user.entity";
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  SignUpTransactionData,
  SignUpTransactionResult,
  SetTokenData,
} from "@modules/user/domain/repository/user-repository.interface";
import { prisma } from "@core/database/prisma/prisma-client";
import { mapPrismaError } from "@core/database/prisma/prisma-error-mapper";
import { executeSignUpTransaction } from "./user-signup.transaction";
import { user as PrismaUser } from "@generated/prisma/client";
import type { UserStatusType } from "@shared/type/enums";

@injectable()
export class PrismaUserRepository implements IUserRepository {
  private toEntity(data: PrismaUser): User {
    return new User({
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      googleId: data.google_id,
      status: data.status as UserStatusType,
      emailVerified: data.email_verified,
      avatarUrl: data.avatar_url,
      language: data.language,
      tokenVersion: data.token_version,
      tokenExpiresAt: data.token_expires_at,
      refreshTokenHash: data.refresh_token_hash,
      refreshTokenExpiresAt: data.refresh_token_expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    });
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? this.toEntity(user) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    try {
      const users = await prisma.user.findMany({ where: { id: { in: ids } } });
      return users.map((u) => this.toEntity(u));
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? this.toEntity(user) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { google_id: googleId },
      });
      return user ? this.toEntity(user) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByRefreshTokenHash(hash: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { refresh_token_hash: hash },
      });
      return user ? this.toEntity(user) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { created_at: "desc" },
      });
      return users.map((u) => this.toEntity(u));
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password ?? null,
          status: data.status as "ACTIVE" | "PENDING" | undefined,
        },
      });
      return this.toEntity(user);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.password !== undefined && { password: data.password }),
          ...(data.status !== undefined && {
            status: data.status as "ACTIVE" | "PENDING",
          }),
          ...(data.language !== undefined && { language: data.language }),
        },
      });
      return this.toEntity(user);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({ where: { id } });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          refresh_token_hash: null,
          refresh_token_expires_at: null,
          token_version: { increment: 1 },
        },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async incrementTokenVersion(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { token_version: { increment: 1 } },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async markEmailVerified(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { email_verified: true },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async setRefreshTokenHash(
    id: string,
    hash: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { refresh_token_hash: hash, refresh_token_expires_at: expiresAt },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async clearRefreshToken(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { refresh_token_hash: null, refresh_token_expires_at: null },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async signUpTransaction(
    data: SignUpTransactionData,
  ): Promise<SignUpTransactionResult> {
    return executeSignUpTransaction(data);
  }

  async setTokenData(id: string, data: SetTokenData): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          token_expires_at: data.tokenExpiresAt,
          refresh_token_hash: data.refreshTokenHash,
          refresh_token_expires_at: data.refreshTokenExpiresAt,
        },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async updateAvatarUrl(id: string, avatarUrl: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { avatar_url: avatarUrl },
      });
      return this.toEntity(user);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async linkGoogleId(
    id: string,
    googleId: string,
    avatarUrl?: string,
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          google_id: googleId,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        },
      });
      return this.toEntity(user);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }
}
