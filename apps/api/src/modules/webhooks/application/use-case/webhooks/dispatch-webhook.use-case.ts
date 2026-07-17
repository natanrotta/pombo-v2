import { randomUUID } from "node:crypto";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { IWebhookSender } from "@modules/webhooks/domain/provider/webhook-sender.interface";
import {
  WebhookEvent,
  WebhookPayload,
} from "@modules/webhooks/domain/entity/webhook-event";

/**
 * Turns a semantic WebhookPayload into a signed delivery. Resolves the device's
 * webhookUrl + webhookSecret via the devices port. A device with no webhookUrl
 * (or no secret) is a silent no-op — webhooks are opt-in. Stamps eventId +
 * timestamp, then hands off to the sender (which signs, delivers, retries,
 * gives up). The webhookSecret never leaves this path and is never logged.
 */
@injectable()
export class DispatchWebhookUseCase {
  constructor(
    @inject(DI_TOKENS.DevicesRepository)
    private readonly devicesRepository: IDevicesRepository,
    @inject(DI_TOKENS.WebhookSender)
    private readonly sender: IWebhookSender,
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    const device = await this.devicesRepository.findById(payload.deviceId);
    // No endpoint (or no secret to sign with) — nothing to deliver.
    if (!device?.webhookUrl || !device.webhookSecret) return;

    const event: WebhookEvent = {
      ...payload,
      eventId: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
    };
    await this.sender.send({
      url: device.webhookUrl,
      secret: device.webhookSecret,
      event,
    });
  }
}
