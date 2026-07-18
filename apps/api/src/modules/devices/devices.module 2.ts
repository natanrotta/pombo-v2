import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IAuthStateRepository } from "@modules/devices/domain/repository/auth-state-repository.interface";
import { PrismaDevicesRepository } from "@modules/devices/infrastructure/repository/prisma-devices.repository";
import { PrismaAuthStateRepository } from "@modules/devices/infrastructure/repository/prisma-auth-state.repository";

/**
 * DI wiring for the devices domain (WhatsApp gateway). Registers the device +
 * auth-state repositories; the use cases are `@injectable()` and resolved on
 * demand. The WhatsApp gateway itself (disabled vs Baileys) is bound in the
 * container composition root, gated by `WHATSAPP_ENABLED`.
 */
export function registerDevicesModule(container: DependencyContainer): void {
  container.registerSingleton<IDevicesRepository>(
    DI_TOKENS.DevicesRepository,
    PrismaDevicesRepository,
  );
  container.registerSingleton<IAuthStateRepository>(
    DI_TOKENS.AuthStateRepository,
    PrismaAuthStateRepository,
  );
}
