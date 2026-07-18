/** Only text sends exist in this version (spec §4). Kept as a union so the
 *  sandbox type selector has a real contract to grow into. */
export type MessageType = "text";

export interface SendTextInput {
  phone: string;
  text: string;
}

/** Mirrors the backend `POST /devices/:id/messages` 202 body. `202` means
 *  accepted + socket alive, NOT delivered. */
export interface SendMessageResult {
  messageId: string;
  status: string;
}
