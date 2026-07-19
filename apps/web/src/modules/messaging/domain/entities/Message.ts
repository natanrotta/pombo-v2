/** The message kinds the Sandbox can send. Mirrors the backend
 *  `outbox_message_type` enum. */
export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "pix"
  | "list";

/** PIX key kinds accepted by the PIX-button send. Mirrors the backend
 *  `PIX_KEY_TYPES` in apps/api/.../whatsapp-gateway.interface.ts — keep in sync
 *  (BE/FE isolation means there is no shared source; a new key type edits both). */
export type PixKeyType = "CPF" | "CNPJ" | "PHONE" | "EMAIL" | "EVP";
export const PIX_KEY_TYPES: readonly PixKeyType[] = [
  "CPF",
  "CNPJ",
  "PHONE",
  "EMAIL",
  "EVP",
];

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

export interface SendPixInput {
  phone: string;
  pixKey: string;
  type: PixKeyType;
}

export interface OptionListOption {
  title: string;
  description?: string;
  id: string;
}

export interface SendListInput {
  phone: string;
  message: string;
  optionList: {
    title: string;
    buttonLabel: string;
    options: OptionListOption[];
  };
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
