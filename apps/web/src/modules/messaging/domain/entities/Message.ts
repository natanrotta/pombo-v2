/** Only text sends exist in this version (spec §4). Kept as a union so the
 *  sandbox type selector has a real contract to grow into. */
export type MessageType = "text";

export interface SendTextInput {
  phone: string;
  text: string;
}

/** The delivery lifecycle of a message, mirroring the backend
 *  `message_status` enum. Rises monotonically; FAILED is terminal. */
export type MessageStatus =
  | "PENDING"
  | "SERVER_ACK"
  | "DELIVERY_ACK"
  | "READ"
  | "FAILED";

/** Mirrors the backend `POST /devices/:id/messages` 202 body. `202` means
 *  accepted + socket alive, NOT delivered. */
export interface SendMessageResult {
  messageId: string;
  status: MessageStatus;
}

/** Mirrors `GET /messages/:id` (the authoritative, pollable status). */
export interface MessageStatusResult {
  messageId: string;
  status: MessageStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
