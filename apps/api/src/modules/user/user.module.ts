import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { PrismaUserRepository } from "@modules/user/infrastructure/repository/prisma-user-repository";

/**
 * DI wiring for the user domain — the identity core. Registers the user
 * repository; the CRUD use-cases are `@injectable()` and resolved on demand.
 */
export function registerUserModule(container: DependencyContainer): void {
  container.registerSingleton<IUserRepository>(
    DI_TOKENS.UserRepository,
    PrismaUserRepository,
  );
}
