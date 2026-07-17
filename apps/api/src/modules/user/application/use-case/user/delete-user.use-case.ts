import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/** Soft-deletes a user (sets `deleted_at`). Throws NotFound when absent. */
@injectable()
export class DeleteUserUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError(
        "User not found",
        undefined,
        ErrorCodes.USER_NOT_FOUND,
      );
    }

    await this.userRepository.softDelete(id);
  }
}
