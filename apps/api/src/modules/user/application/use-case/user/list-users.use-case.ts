import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { User } from "@modules/user/domain/entity/user.entity";

type UserResponse = ReturnType<User["toJSON"]>;

/** Lists every (non-deleted) user. Wire-format projection, no sensitive fields. */
@injectable()
export class ListUsersUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => user.toJSON());
  }
}
