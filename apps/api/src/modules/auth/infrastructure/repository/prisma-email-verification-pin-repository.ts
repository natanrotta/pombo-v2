import { injectable } from "tsyringe";
import {
  IEmailVerificationPinRepository,
  CreateEmailVerificationPinData,
  EmailVerificationPin,
} from "@modules/auth/domain/repository/email-verification-pin-repository.interface";
import { prisma } from "@core/database/prisma/prisma-client";
import { mapPrismaError } from "@core/database/prisma/prisma-error-mapper";
import { email_verification_pin as PrismaEmailVerificationPin } from "@generated/prisma/client";

@injectable()
export class PrismaEmailVerificationPinRepository implements IEmailVerificationPinRepository {
  private toEntity(data: PrismaEmailVerificationPin): EmailVerificationPin {
    return {
      id: data.id,
      userId: data.user_id,
      pinHash: data.pin_hash,
      expiresAt: data.expires_at,
      attempts: data.attempts,
      usedAt: data.used_at,
      createdAt: data.created_at,
    };
  }

  async create(
    data: CreateEmailVerificationPinData,
  ): Promise<EmailVerificationPin> {
    try {
      const created = await prisma.email_verification_pin.create({
        data: {
          user_id: data.userId,
          pin_hash: data.pinHash,
          expires_at: data.expiresAt,
        },
      });
      return this.toEntity(created);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<EmailVerificationPin | null> {
    try {
      // "Active" = unused AND not yet expired. Filtering expiry at the DB
      // level keeps the repository contract honest (an expired row is not
      // active) and means the send-cooldown / verify callers never reason
      // about stale rows. The application-layer expiry check downstream is
      // kept as defence-in-depth.
      const found = await prisma.email_verification_pin.findFirst({
        where: {
          user_id: userId,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: "desc" },
      });
      return found ? this.toEntity(found) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async incrementAttempts(id: string): Promise<number> {
    try {
      const updated = await prisma.email_verification_pin.update({
        where: { id },
        data: { attempts: { increment: 1 } },
      });
      return updated.attempts;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async markAsUsed(id: string): Promise<void> {
    try {
      // Conditional on `used_at: null` so it acts as the race arbitrator: if
      // two concurrent verifies hit the same PIN, only the first flips it.
      // Idempotent — a second call updates zero rows without throwing.
      await prisma.email_verification_pin.updateMany({
        where: { id, used_at: null },
        data: { used_at: new Date() },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async deleteUnusedForUser(userId: string): Promise<void> {
    try {
      await prisma.email_verification_pin.deleteMany({
        where: { user_id: userId, used_at: null },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }
}
