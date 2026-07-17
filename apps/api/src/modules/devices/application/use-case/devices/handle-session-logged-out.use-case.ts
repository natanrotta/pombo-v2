import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IAuthStateRepository } from "@modules/devices/domain/repository/auth-state-repository.interface";

export interface HandleSessionLoggedOutInput {
  deviceId: string;
}

/**
 * Reacts to `session.logged_out` — terminal. The pairing is gone and never
 * self-heals: mark the device LOGGED_OUT and wipe the authState so a re-connect
 * starts a fresh QR.
 *
 * Status FIRST, then clear — the two writes are not transactional. If clear()
 * fails, the device correctly shows LOGGED_OUT (truthful) with stale keys that
 * are harmless (no auto-reconnect on LOGGED_OUT) and self-heal on the next
 * manual /connect. The reverse order would risk the worse state: authState
 * wiped but status still CONNECTED (/health lies).
 */
@injectable()
export class HandleSessionLoggedOutUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
    @inject(DI_TOKENS.AuthStateRepository)
    private readonly authStateRepository: IAuthStateRepository,
  ) {}

  async execute(input: HandleSessionLoggedOutInput): Promise<void> {
    await this.devicesRepository.updateStatus(input.deviceId, "LOGGED_OUT");
    await this.authStateRepository.clear(input.deviceId);
  }
}
