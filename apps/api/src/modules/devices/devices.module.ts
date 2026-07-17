import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IAuthStateRepository } from "@modules/devices/domain/repository/auth-state-repository.interface";
import { PrismaDevicesRepository } from "@modules/devices/infrastructure/repository/prisma-devices.repository";
import { CachedDevicesRepository } from "@modules/devices/infrastructure/repository/cached-devices.repository";
import { PrismaAuthStateRepository } from "@modules/devices/infrastructure/repository/prisma-auth-state.repository";

/**
 * DI wiring for the devices domain (WhatsApp gateway). The `DevicesRepository`
 * token resolves to a read-aside cache decorator (`CachedDevicesRepository`)
 * wrapping the Prisma repo — the cache is invisible to every consumer (R8) and
 * fail-open (Redis down → Prisma). The Prisma repo is registered under its own
 * class token so the decorator can inject it. The WhatsApp gateway (disabled vs
 * Baileys) is bound in the composition root, gated by `WHATSAPP_ENABLED`.
 */
export function registerDevicesModule(container: DependencyContainer): void {
  container.registerSingleton(PrismaDevicesRepository);
  container.registerSingleton<IDevicesRepository>(
    DI_TOKENS.DevicesRepository,
    CachedDevicesRepository,
  );
  container.registerSingleton<IAuthStateRepository>(
    DI_TOKENS.AuthStateRepository,
    PrismaAuthStateRepository,
  );
}
