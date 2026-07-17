import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IPasswordResetTokenRepository } from "@modules/auth/domain/repository/password-reset-token-repository.interface";
import { IEmailVerificationPinRepository } from "@modules/auth/domain/repository/email-verification-pin-repository.interface";
import { PrismaPasswordResetTokenRepository } from "@modules/auth/infrastructure/repository/prisma-password-reset-token-repository";
import { PrismaEmailVerificationPinRepository } from "@modules/auth/infrastructure/repository/prisma-email-verification-pin-repository";

/**
 * DI wiring for the auth domain (sign-in/up, password reset, email-pin
 * verification). The auth middleware / auth-cookies helper stay in the HTTP
 * chassis (core), not here — they are cross-cutting.
 */
export function registerAuthModule(container: DependencyContainer): void {
  container.registerSingleton<IPasswordResetTokenRepository>(
    DI_TOKENS.PasswordResetTokenRepository,
    PrismaPasswordResetTokenRepository,
  );
  container.registerSingleton<IEmailVerificationPinRepository>(
    DI_TOKENS.EmailVerificationPinRepository,
    PrismaEmailVerificationPinRepository,
  );
}
