import { httpClient } from "@/core/http/httpClient";
import type { MessagingRepository } from "@/modules/messaging/domain/repositories/MessagingRepository";
import type {
  SendTextInput,
  SendMessageResult,
  MessageStatusResult,
} from "@/modules/messaging/domain/entities/Message";

/** A unique idempotency key per send. `crypto.randomUUID` only exists in a
 *  secure context (HTTPS/localhost), so fall back to a non-crypto unique string
 *  on plain-HTTP dev origins — uniqueness (not entropy) is all the header needs. */
function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pmb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// The httpClient response interceptor unwraps `{ ok, data }` → each call
// resolves to the inner `data` directly.
export class HttpMessagingRepository implements MessagingRepository {
  sendText(
    deviceId: string,
    input: SendTextInput,
  ): Promise<SendMessageResult> {
    // Every send needs a unique Idempotency-Key (required by the endpoint). The
    // sandbox is throwaway, so a fresh key per click is exactly right.
    return httpClient.post<SendTextInput, SendMessageResult>(
      `/devices/${deviceId}/messages`,
      input,
      { headers: { "Idempotency-Key": newIdempotencyKey() } },
    );
  }

  getStatus(messageId: string): Promise<MessageStatusResult> {
    return httpClient.get<never, MessageStatusResult>(
      `/messages/${messageId}`,
    );
  }
}
