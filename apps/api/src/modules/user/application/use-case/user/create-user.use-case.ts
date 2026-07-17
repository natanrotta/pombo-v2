import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { IHashProvider } from "@shared/provider";
import { User } from "@modules/user/domain/entity/user.entity";
import { CreateUserDTO } from "@modules/user/application/dto/user.dto";
import { ConflictError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

type UserResponse = ReturnType<User["toJSON"]>;

/** Creates a user. The plaintext password is hashed before it is persisted. */
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(DI_TOKENS.HashProvider)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(data: CreateUserDTO): Promise<UserResponse> {
    const existing = await this.userRepository.findByEmail(data.email);

    if (existing) {
      throw new ConflictError(
        "Email already in use",
        undefined,
        ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS,
      );
    }

    const password = await this.hashProvider.hash(data.password);

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password,
      status: data.status,
    });

    return user.toJSON();
  }
}
