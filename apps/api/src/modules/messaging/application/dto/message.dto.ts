import { z } from "zod";
import { type RichMessageType } from "@modules/messaging/domain/value-object/message-type";

export const SendMessageDTOSchema = z.object({
  phone: z.string().trim().min(5),
  text: z.string().trim().min(1),
});

export const SendMessageParamSchema = z.object({
  id: z.string().uuid("Invalid device ID format"),
});

export const MessageIdParamSchema = z.object({
  id: z.string().uuid("Invalid message ID format"),
});

export type SendMessageDTO = z.infer<typeof SendMessageDTOSchema>;
export type SendMessageParam = z.infer<typeof SendMessageParamSchema>;
export type MessageIdParam = z.infer<typeof MessageIdParamSchema>;

// ── Rich send DTOs (image / audio / video / document) ────────────────────────
// Media fields are strings — a URL or base64 (the gateway resolves either), so
// they are validated as non-empty, not as URLs. Shared payload shapes below are
// reused by the public API DTOs (only the phone rule differs there).

const phone = z.string().trim().min(5);
const nonEmpty = z.string().trim().min(1);

export const imageBody = { image: nonEmpty, caption: nonEmpty.optional() };
export const audioBody = { audio: nonEmpty };
export const videoBody = { video: nonEmpty, caption: nonEmpty.optional() };
export const documentBody = {
  document: nonEmpty,
  fileName: nonEmpty.optional(),
  caption: nonEmpty.optional(),
};

export const SendImageDTOSchema = z.object({ phone, ...imageBody });
export const SendAudioDTOSchema = z.object({ phone, ...audioBody });
export const SendVideoDTOSchema = z.object({ phone, ...videoBody });
export const SendDocumentDTOSchema = z.object({ phone, ...documentBody });

/** Input carried into the send use case. `accountId` (tenant scope) + device id
 *  + idempotency key are added by the controller from `req.auth`, the route and
 *  the header. */
export interface SendTextInput {
  accountId: string;
  deviceId: string;
  phone: string;
  text: string;
  idempotencyKey: string;
}

/** Input carried into `SendRichMessageUseCase`. `payload` is the validated body
 *  minus `phone` — the per-type shape (`SendImagePayload`, …) is enforced by the
 *  route's Zod schema and re-applied by `dispatchOutboxSend`; the use case stores
 *  it opaquely and never inspects it, so it is typed `unknown` here. */
export interface SendRichInput {
  accountId: string;
  deviceId: string;
  phone: string;
  idempotencyKey: string;
  type: RichMessageType;
  payload: unknown;
}
