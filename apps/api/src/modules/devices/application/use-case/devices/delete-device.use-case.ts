import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IWhatsAppGateway } from "@modules/devices/domain/provider/whatsapp-gateway.interface";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * Logout + delete. The gateway.logout wipes the pairing (a safe no-op when the
 * gateway is disabled). The DB delete cascades to authState/outbox rows.
 */
@injectable()
export class DeleteDeviceUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
    @inject(DI_TOKENS.WhatsAppGateway)
    private readonly gateway: IWhatsAppGateway,
  ) {}

  async execute(accountId: string, id: string): Promise<void> {
    const device = await this.devicesRepository.findById(accountId, id);
    if (!device) {
      throw new NotFoundError(
        "Device not found",
        undefined,
        ErrorCodes.DEVICE_NOT_FOUND,
      );
    }

    await this.gateway.logout(device.id);
    await this.devicesRepository.delete(accountId, device.id);
  }
}
