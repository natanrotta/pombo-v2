import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";

export interface HandleSessionConnectedInput {
  deviceId: string;
  identifier: string;
}

/**
 * Reacts to `session.connected` (the socket paired or reconnected). The device
 * identifier (its WhatsApp number) appears here for the first time — it comes
 * from the WhatsApp side, so this is where the DB learns it. The repo also
 * stamps lastConnectedAt.
 */
@injectable()
export class HandleSessionConnectedUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
  ) {}

  async execute(input: HandleSessionConnectedInput): Promise<void> {
    await this.devicesRepository.updateStatus(
      input.deviceId,
      "CONNECTED",
      input.identifier,
    );
  }
}
