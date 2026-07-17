import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { Device } from "@modules/devices/domain/entity/device.entity";
import { UpdateDeviceWebhooksDTO } from "@modules/devices/application/dto/device.dto";

type DeviceResponse = ReturnType<Device["toJSON"]>;

/**
 * Configures a device's per-event webhook URLs. Partial update: only the keys
 * present in the payload are written (`null` clears a URL, an absent key leaves
 * it unchanged). The `webhookSecret` is never touched or re-exposed. Scoped by
 * account (R1) — the repository raises DEVICE_NOT_FOUND for a cross-account id.
 */
@injectable()
export class UpdateDeviceWebhooksUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
  ) {}

  async execute(
    accountId: string,
    id: string,
    webhooks: UpdateDeviceWebhooksDTO,
  ): Promise<DeviceResponse> {
    const device = await this.devicesRepository.updateWebhooks(
      accountId,
      id,
      webhooks,
    );
    return device.toJSON();
  }
}
