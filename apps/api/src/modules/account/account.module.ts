import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IApiTokenRepository } from "@modules/account/domain/repository/api-token-repository.interface";
import { PrismaApiTokenRepository } from "@modules/account/infrastructure/repository/prisma-api-token.repository";

/**
 * DI wiring for the account domain (tenancy + public-API credential).
 * Registers the api-token repository; the use cases are `@injectable()` and
 * resolved on demand.
 */
export function registerAccountModule(container: DependencyContainer): void {
  container.registerSingleton<IApiTokenRepository>(
    DI_TOKENS.ApiTokenRepository,
    PrismaApiTokenRepository,
  );
}
