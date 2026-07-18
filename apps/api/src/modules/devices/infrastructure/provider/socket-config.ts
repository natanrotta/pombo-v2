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
//
// The connection-tuning options below are set explicitly (not left to Baileys'
// defaults) because they are the front line of connection stability:
// - keepAliveIntervalMs: ping the server on this cadence so an idle WebSocket
//   isn't reaped by a NAT/proxy idle timeout before we notice.
// - connectTimeoutMs: bound the initial handshake so a stuck connect fails fast
//   into our backoff instead of hanging in CONNECTING forever.
// - defaultQueryTimeoutMs: bound every request so a silent half-open socket
//   surfaces as an error (which drives reconnection) rather than a hung promise.
// - retryRequestDelayMs: small delay before Baileys retries a failed request —
//   smooths transient blips without hammering.
export const baseSocketConfig = {
  syncFullHistory: false,
  markOnlineOnConnect: false,
  browser: Browsers.ubuntu("pombo"),
  generateHighQualityLinkPreview: false,
  logger: silentLogger,
  keepAliveIntervalMs: 25_000,
  connectTimeoutMs: 60_000,
  defaultQueryTimeoutMs: 60_000,
  retryRequestDelayMs: 2_000,
} satisfies Partial<SocketConfig>;
