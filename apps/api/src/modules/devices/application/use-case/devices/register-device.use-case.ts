import { randomBytes } from "node:crypto";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { ConflictError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import {
  RegisterDeviceDTO,
  RegisterDeviceResponseDTO,
} from "@modules/devices/application/dto/device.dto";

/**
 * Creates the registration record. Does NOT open a socket (register and
 * connect are separate operations). The webhookSecret is generated here and
 * returned exactly once; it is never exposed again.
 */
@injectable()
export class RegisterDeviceUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
  ) {}

  async execute(
    accountId: string,
    data: RegisterDeviceDTO,
  ): Promise<RegisterDeviceResponseDTO> {
    const existing = await this.devicesRepository.findByName(
      accountId,
      data.name,
    );
    if (existing) {
      throw new ConflictError(
        "A device with this name already exists",
        undefined,
        ErrorCodes.DEVICE_NAME_TAKEN,
      );
    }

    const webhookSecret = randomBytes(32).toString("hex");
    const device = await this.devicesRepository.create({
      accountId,
      name: data.name,
      webhookSecret,
    });

    return { id: device.id, webhookSecret };
  }
}
