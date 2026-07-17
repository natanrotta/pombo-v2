import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";

export interface HandleSessionDisconnectedInput {
  deviceId: string;
}

/**
 * Reacts to `session.disconnected` — informative ("dropped, I'll be back").
 * Marks the device DISCONNECTED. The socket layer reconnects on its own with
 * backoff.
 */
@injectable()
export class HandleSessionDisconnectedUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
  ) {}

  async execute(input: HandleSessionDisconnectedInput): Promise<void> {
    await this.devicesRepository.updateStatus(input.deviceId, "DISCONNECTED");
  }
}
