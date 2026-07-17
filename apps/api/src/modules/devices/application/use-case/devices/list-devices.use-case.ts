import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { Device } from "@modules/devices/domain/entity/device.entity";

type DeviceResponse = ReturnType<Device["toJSON"]>;

/** Lists every registered device (public projection — no webhookSecret). */
@injectable()
export class ListDevicesUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
  ) {}

  async execute(): Promise<DeviceResponse[]> {
    const devices = await this.devicesRepository.list();
    return devices.map((device) => device.toJSON());
  }
}
