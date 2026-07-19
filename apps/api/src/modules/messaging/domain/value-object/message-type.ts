/**
 * The content kind of an outbox message. Mirrors the Prisma
 * `outbox_message_type` enum. `text` uses the row's `text` column; every other
 * kind stores its validated body in `payload` (JSON) and is dispatched to the
 * matching gateway method by `dispatchOutboxSend`.
 */
export type MessageType = "text" | "image" | "audio" | "video" | "document";

/** Every non-text kind — the ones carried by `SendRichMessageUseCase`. */
export const RICH_MESSAGE_TYPES = [
  "image",
  "audio",
  "video",
  "document",
] as const;

export type RichMessageType = (typeof RICH_MESSAGE_TYPES)[number];
