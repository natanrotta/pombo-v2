import { WebhookEvent } from "@modules/webhooks/domain/entity/webhook-event";

export interface WebhookDelivery {
  url: string;
  /** The per-device webhookSecret (never the JWT secret). */
  secret: string;
  event: WebhookEvent;
}

/**
 * Signs + delivers a webhook, retrying transient failures and giving up
 * (at-least-once, no delivery table). NEVER throws to the caller: a failed
 * delivery is the consumer's problem to detect via GET /devices, not the
 * publisher's to crash on. Best-effort by contract.
 */
export interface IWebhookSender {
  send(delivery: WebhookDelivery): Promise<void>;
}
