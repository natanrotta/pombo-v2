/**
 * The port no Baileys type may cross. The real adapter
 * (`BaileysWhatsAppGateway`) lives in `infrastructure/provider/`; a
 * `DisabledWhatsAppGateway` is bound when `WHATSAPP_ENABLED=false`, and a
 * `FakeWhatsAppGateway` (in `test/`) backs the specs. This is what makes 100%
 * of the use cases testable with no real socket.
 */
export interface SendResult {
  waMessageId: string;
}

/** Kept as an alias so existing `sendText` call sites don't churn. */
export type SendTextResult = SendResult;

// ── Rich send payloads (URL or base64 strings for media) ────────────────────

export interface SendImagePayload {
  /** Image URL or base64 (optionally a data URL). */
  image: string;
  caption?: string;
}

export interface SendAudioPayload {
  /** Audio URL or base64 — sent as a voice message. */
  audio: string;
}

export interface SendVideoPayload {
  video: string;
  caption?: string;
}

export interface SendDocumentPayload {
  document: string;
  fileName?: string;
  caption?: string;
}

export interface IWhatsAppGateway {
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  logout(deviceId: string): Promise<void>;
  isConnected(deviceId: string): boolean;
  /** The current pairing QR string for a device, or null when none is pending
   *  (not connecting, already connected, or logged out). Synchronous by
   *  contract — read from the in-process session cache. */
  getCurrentQr(deviceId: string): string | null;
  resolveJid(deviceId: string, phone: string): Promise<string | null>;
  sendText(deviceId: string, jid: string, text: string): Promise<SendResult>;
  sendImage(
    deviceId: string,
    jid: string,
    payload: SendImagePayload,
  ): Promise<SendResult>;
  sendAudio(
    deviceId: string,
    jid: string,
    payload: SendAudioPayload,
  ): Promise<SendResult>;
  sendVideo(
    deviceId: string,
    jid: string,
    payload: SendVideoPayload,
  ): Promise<SendResult>;
  sendDocument(
    deviceId: string,
    jid: string,
    payload: SendDocumentPayload,
  ): Promise<SendResult>;
  /** True when the gateway is live (WHATSAPP_ENABLED). The disabled impl
   *  returns false so use cases can short-circuit with WA_GATEWAY_DISABLED. */
  isEnabled(): boolean;
}
