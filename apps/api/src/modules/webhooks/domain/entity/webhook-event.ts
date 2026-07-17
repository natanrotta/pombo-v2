import { type DomainMessageStatus } from "@shared/provider/domain-event-bus.interface";

export type WebhookType =
  | "device.connected"
  | "device.disconnected"
  | "device.logged_out"
  | "message.status";

/**
 * The semantic payload, discriminated by type. `dispatch-webhook` turns a
 * WebhookPayload into a full WebhookEvent by stamping eventId + timestamp.
 */
export type WebhookPayload =
  | {
      type: "device.connected";
      deviceId: string;
      data: { identifier: string };
    }
  | {
      type: "device.disconnected";
      deviceId: string;
      data: { reason: string };
    }
  | {
      type: "device.logged_out";
      deviceId: string;
      data: Record<string, never>;
    }
  | {
      type: "message.status";
      deviceId: string;
      data: { messageId: string; status: DomainMessageStatus };
    };

/**
 * The envelope delivered to the consumer's webhookUrl. `eventId` enables the
 * consumer to deduplicate (at-least-once); `timestamp` is ISO 8601.
 */
export type WebhookEvent = WebhookPayload & {
  eventId: string;
  timestamp: string;
};
