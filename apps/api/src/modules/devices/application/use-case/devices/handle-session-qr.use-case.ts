import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";

export interface HandleSessionQrInput {
  deviceId: string;
}

/**
 * Reacts to `session.qr` — a fresh pairing QR was emitted, so the device is
 * waiting to be scanned. Marks it QR_PENDING so `GET /devices/:id/qr` returns
 * the QR and the frontend can render it. System-triggered (bus event, keyed by
 * deviceId), so it uses the internal unscoped `updateStatus`. Idempotent: the
 * QR rotates every ~30s and this fires again with no ill effect.
 */
@injectable()
export class HandleSessionQrUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
  ) {}

  async execute(input: HandleSessionQrInput): Promise<void> {
    await this.devicesRepository.updateStatus(input.deviceId, "QR_PENDING");
  }
}
