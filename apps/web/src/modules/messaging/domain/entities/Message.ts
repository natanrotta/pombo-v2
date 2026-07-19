/** The message kinds the Sandbox can send. Mirrors the backend
 *  `outbox_message_type` enum. */
export type MessageType = "text" | "image" | "audio" | "video" | "document";

export interface SendTextInput {
  phone: string;
  text: string;
}

export interface SendImageInput {
  phone: string;
  image: string;
  caption?: string;
}

export interface SendAudioInput {
  phone: string;
  audio: string;
}

export interface SendVideoInput {
  phone: string;
  video: string;
  caption?: string;
}

export interface SendDocumentInput {
  phone: string;
  document: string;
  fileName?: string;
  caption?: string;
}

/** The delivery lifecycle of a message, mirroring the backend
 *  `message_status` enum. Rises monotonically; FAILED is terminal. */
export type MessageStatus =
  | "PENDING"
  | "SERVER_ACK"
  | "DELIVERY_ACK"
  | "READ"
  | "FAILED";

/** Mirrors the backend send 202 body. `202` means accepted + socket alive, NOT
 *  delivered. */
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
