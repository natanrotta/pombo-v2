import {
  IWebhookSender,
  WebhookDelivery,
} from "@modules/webhooks/domain/provider/webhook-sender.interface";

/** Records deliveries instead of hitting the network — for specs. */
export class FakeWebhookSender implements IWebhookSender {
  public sent: WebhookDelivery[] = [];

  async send(delivery: WebhookDelivery): Promise<void> {
    this.sent.push(delivery);
  }
}
