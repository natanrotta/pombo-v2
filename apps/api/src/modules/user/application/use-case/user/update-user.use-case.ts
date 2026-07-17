import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { IHashProvider } from "@shared/provider";
import { User } from "@modules/user/domain/entity/user.entity";
import { UpdateUserDTO } from "@modules/user/application/dto/user.dto";
import { ConflictError, NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

type UserResponse = ReturnType<User["toJSON"]>;

/** Updates a user's scalar fields. A new password is hashed before persisting. */
@injectable()
export class UpdateUserUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(DI_TOKENS.HashProvider)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(id: string, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError(
        "User not found",
        undefined,
        ErrorCodes.USER_NOT_FOUND,
      );
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError(
          "Email already in use",
          undefined,
          ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS,
        );
      }
    }

    const password = data.password
      ? await this.hashProvider.hash(data.password)
      : undefined;

    const updated = await this.userRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.status !== undefined && { status: data.status }),
      ...(password !== undefined && { password }),
    });

    return updated.toJSON();
  }
}
