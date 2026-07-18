import { randomUUID } from "node:crypto";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";
import { type DeviceWebhooks } from "@modules/devices/domain/entity/device.entity";
import { IWebhookSender } from "@modules/webhooks/domain/provider/webhook-sender.interface";
import {
  WebhookEvent,
  WebhookPayload,
  WebhookType,
} from "@modules/webhooks/domain/entity/webhook-event";

// Which per-event URL each webhook type is delivered to (PLANO §7.4). Both
// device.disconnected and device.logged_out share the "disconnect" hook.
const EVENT_TO_HOOK: Record<WebhookType, keyof DeviceWebhooks> = {
  "device.connected": "onConnect",
  "device.disconnected": "onDisconnect",
  "device.logged_out": "onDisconnect",
  "message.status": "onMessageStatus",
  "message.sent": "onSend",
};

/**
 * Turns a semantic WebhookPayload into a signed delivery. Resolves the delivery
 * URL from the device's per-event webhook column (EVENT_TO_HOOK) and signs with
 * the device's single `webhookSecret`. A device with no URL configured for that
 * event (or no secret) is a silent no-op — webhooks are opt-in. Stamps eventId
 * + timestamp, then hands off to the sender (which signs, delivers, retries,
 * gives up). The webhookSecret never leaves this path and is never logged.
 *
 * `onReceive` has no event feeding it in this version (inbound messages are not
 * processed — PLANO §4); the column is configurable but dormant.
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
    // Event-driven (session / message), so there is no requesting account —
    // resolve the device by id through the internal lookup.
    const device = await this.devicesRepository.findByIdInternal(
      payload.deviceId,
    );
    if (!device?.webhookSecret) return;

    const url = device.webhooks[EVENT_TO_HOOK[payload.type]];
    // No endpoint configured for this event type — nothing to deliver.
    if (!url) return;

    const event: WebhookEvent = {
      ...payload,
      eventId: `evt_${randomUUID()}`,
      timestamp: new Date().toISOString(),
    };
    await this.sender.send({
      url,
      secret: device.webhookSecret,
      event,
    });
  }
}
