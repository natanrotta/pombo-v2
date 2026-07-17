import { createHmac } from "node:crypto";

/**
 * HMAC-SHA256 over `${timestamp}.${rawBody}` → the `sha256=<hex>` value for the
 * X-Signature header. Two security properties:
 *  - Signs the X-Timestamp as part of the payload (anti-replay): the consumer
 *    rejects anything outside a window, and the timestamp can't be tampered
 *    without breaking the signature.
 *  - Signs the EXACT raw body bytes sent, never a reserialized JSON whose key
 *    order would change and break verification.
 * `secret` is the per-device webhookSecret.
 */
export const signWebhook = (
  rawBody: string,
  timestamp: number,
  secret: string,
): string => {
  const mac = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `sha256=${mac}`;
};
