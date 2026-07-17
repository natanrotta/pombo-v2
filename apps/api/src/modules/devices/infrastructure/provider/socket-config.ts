import { Browsers } from "@whiskeysockets/baileys";
import type { SocketConfig } from "@whiskeysockets/baileys";

// Baileys ships a verbose pino logger by default (floods stdout with JSON and
// buries the QR). Silence it — the events we care about (qr/connected/
// disconnected/logged_out) already flow through our own bus + logger.
const noop = (): void => {};
const silentLogger: SocketConfig["logger"] = {
  level: "silent",
  child: () => silentLogger,
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

// The socket options that MUST be set BEFORE the first QR:
// - syncFullHistory: false — refuse the phone's history dump (hundreds of MB +
//   minutes of CPU for data we discard).
// - markOnlineOnConnect: false — marking online makes WhatsApp stop sending push
//   notifications to the number owner's phone. Never steal those.
export const baseSocketConfig = {
  syncFullHistory: false,
  markOnlineOnConnect: false,
  browser: Browsers.ubuntu("pombo"),
  generateHighQualityLinkPreview: false,
  logger: silentLogger,
} satisfies Partial<SocketConfig>;
