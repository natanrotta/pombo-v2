import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { User } from "@modules/user/domain/entity/user.entity";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

type UserResponse = ReturnType<User["toJSON"]>;

/** Fetches a single user by id. Throws NotFound when it does not exist. */
@injectable()
export class GetUserUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError(
        "User not found",
        undefined,
        ErrorCodes.USER_NOT_FOUND,
      );
    }

    return user.toJSON();
  }
}
