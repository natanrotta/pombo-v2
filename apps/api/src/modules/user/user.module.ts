import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { PrismaUserRepository } from "@modules/user/infrastructure/repository/prisma-user-repository";
import { CachedUserRepository } from "@modules/user/infrastructure/repository/cached-user-repository";

/**
 * DI wiring for the user domain — the identity core. The `UserRepository` token
 * resolves to a read-aside cache decorator (`CachedUserRepository`) wrapping the
 * Prisma repo — it caches `findById` (the authMiddleware hot path) and evicts on
 * every mutating write, so a revocation is reflected on the next request.
 * Invisible to consumers (R8), fail-open (Redis down → Prisma). The Prisma repo
 * is registered under its own class token so the decorator can inject it.
 */
export function registerUserModule(container: DependencyContainer): void {
  container.registerSingleton(PrismaUserRepository);
  container.registerSingleton<IUserRepository>(
    DI_TOKENS.UserRepository,
    CachedUserRepository,
  );
}
