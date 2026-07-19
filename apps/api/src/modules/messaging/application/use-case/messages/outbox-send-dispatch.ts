import {
  IWhatsAppGateway,
  SendResult,
  SendImagePayload,
  SendAudioPayload,
  SendVideoPayload,
  SendDocumentPayload,
} from "@modules/devices/domain/provider/whatsapp-gateway.interface";
import { OutboxMessage } from "@modules/messaging/domain/entity/outbox-message.entity";
import { InternalError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * The single place that maps an outbox row's `type` (+ `payload`) to the right
 * gateway send method. Consumed by BOTH the live send path
 * (`SendRichMessageUseCase`) and the reconnect/rate-limit drain
 * (`DrainOutboxUseCase.sendOne`), so a queued image is always replayed as an
 * image — never re-sent as text. The payload was validated at the DTO boundary
 * and stored verbatim, so the cast here is safe.
 */
export function dispatchOutboxSend(
  gateway: IWhatsAppGateway,
  deviceId: string,
  message: OutboxMessage,
): Promise<SendResult> {
  const { toJid, payload } = message;
  switch (message.type) {
    case "text":
      // A `text` row always carries `text` (DB CHECK constraint + the text send
      // path). If it's null the row is corrupt — surface it loudly instead of
      // silently delivering an empty message.
      if (message.text == null) {
        throw new InternalError(
          "Corrupt outbox row: text message without text",
          undefined,
          ErrorCodes.INTERNAL_ERROR,
        );
      }
      return gateway.sendText(deviceId, toJid, message.text);
    case "image":
      return gateway.sendImage(deviceId, toJid, payload as SendImagePayload);
    case "audio":
      return gateway.sendAudio(deviceId, toJid, payload as SendAudioPayload);
    case "video":
      return gateway.sendVideo(deviceId, toJid, payload as SendVideoPayload);
    case "document":
      return gateway.sendDocument(
        deviceId,
        toJid,
        payload as SendDocumentPayload,
      );
  }
}
