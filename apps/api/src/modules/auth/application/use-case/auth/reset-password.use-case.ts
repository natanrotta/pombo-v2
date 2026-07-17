import { createHash } from "crypto";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { IPasswordResetTokenRepository } from "@modules/auth/domain/repository/password-reset-token-repository.interface";
import { IHashProvider } from "@shared/provider";
import { ResetPasswordDTO } from "../../dto/auth.dto";
import { BadRequestError, UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * Consumes a password-reset token to set a new password.
 *
 * Security notes:
 * - Token is hashed (SHA-256) before lookup, matching the at-rest hash.
 * - Rejects tokens that are missing, already used, or expired.
 * - Marks the token as used atomically before invalidating other tokens,
 *   so it cannot be replayed.
 * - Increments the user's tokenVersion, which invalidates every existing
 *   JWT / refresh token — an attacker who had stolen a session loses it.
 */
@injectable()
export class ResetPasswordUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(DI_TOKENS.PasswordResetTokenRepository)
    private readonly tokenRepository: IPasswordResetTokenRepository,
    @inject(DI_TOKENS.HashProvider)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(data: ResetPasswordDTO): Promise<void> {
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const record = await this.tokenRepository.findByTokenHash(tokenHash);

    if (!record) {
      throw new BadRequestError(
        "Invalid password reset token",
        undefined,
        ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_INVALID,
      );
    }

    if (record.usedAt) {
      throw new BadRequestError(
        "Password reset token already used",
        undefined,
        ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_USED,
      );
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError(
        "Password reset token expired",
        undefined,
        ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_EXPIRED,
      );
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new UnauthorizedError(
        "User not found for this token",
        undefined,
        ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_INVALID,
      );
    }

    const newPasswordHash = await this.hashProvider.hash(data.password);

    await this.userRepository.update(user.id, { password: newPasswordHash });
    await this.tokenRepository.markAsUsed(record.id);
    await this.tokenRepository.invalidateAllForUser(user.id);
    await this.userRepository.incrementTokenVersion(user.id);
    await this.userRepository.clearRefreshToken(user.id);
  }
}
