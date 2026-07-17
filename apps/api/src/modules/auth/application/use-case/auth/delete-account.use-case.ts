import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * Soft-deletes the authenticated user's own account (sets `user.deleted_at`,
 * bumps `token_version`, and clears the refresh token so every live session
 * is revoked).
 */
@injectable()
export class DeleteAccountUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        "User not found",
        undefined,
        ErrorCodes.USER_NOT_FOUND,
      );
    }

    await this.userRepository.softDelete(userId);
  }
}
