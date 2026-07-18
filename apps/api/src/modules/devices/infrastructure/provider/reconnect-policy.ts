import { DisconnectReason } from "@whiskeysockets/baileys";

/**
 * The reconnection decision, derived PURELY from the WhatsApp close status code
 * (a Baileys `DisconnectReason`). Extracted from `session-manager.ts` so the
 * policy — the make-or-break of "does a device come back on its own?" — is
 * unit-testable without a live socket.
 *
 *  - `reconnect-immediate`: recoverable and expected right now (the 515 that
 *    WhatsApp sends right after pairing). Reopen with ~0 delay.
 *  - `reconnect-backoff`: recoverable transient drop (network blip, server
 *    close, replaced session, bad session). Reopen with jittered backoff.
 *  - `logged-out`: the pairing is gone (user unlinked / WhatsApp forced). Never
 *    reconnect — re-pair via QR.
 *  - `stop`: fatal for this number (banned / protocol mismatch). Reconnecting
 *    just hammers a dead number; stop and surface it.
 */
export type ReconnectAction =
  "reconnect-immediate" | "reconnect-backoff" | "logged-out" | "stop";

export interface DisconnectDecision {
  action: ReconnectAction;
  /** Human-readable, e.g. `"connectionLost (408)"`. Carried on the
   *  `session.disconnected` event and the structured log so the top causes of
   *  disconnection become answerable from data. */
  reason: string;
}

// 408 is shared by `connectionLost` and `timedOut`; we surface the former name.
const reasonName = (code: number | undefined): string => {
  switch (code) {
    case DisconnectReason.connectionClosed:
      return "connectionClosed";
    case DisconnectReason.connectionLost:
      return "connectionLost";
    case DisconnectReason.connectionReplaced:
      return "connectionReplaced";
    case DisconnectReason.loggedOut:
      return "loggedOut";
    case DisconnectReason.badSession:
      return "badSession";
    case DisconnectReason.restartRequired:
      return "restartRequired";
    case DisconnectReason.multideviceMismatch:
      return "multideviceMismatch";
    case DisconnectReason.forbidden:
      return "forbidden";
    case DisconnectReason.unavailableService:
      return "unavailableService";
    default:
      return "unknown";
  }
};

export const describeDisconnect = (code: number | undefined): string =>
  code == null ? reasonName(code) : `${reasonName(code)} (${code})`;

/**
 * Map a close status code to an action. Switches on `DisconnectReason` members,
 * never magic numbers. Everything not explicitly terminal is recoverable —
 * only `loggedOut` (re-pair) and `forbidden`/`multideviceMismatch` (dead
 * number) stop the socket.
 */
export const classifyDisconnect = (
  code: number | undefined,
): DisconnectDecision => {
  const reason = describeDisconnect(code);
  switch (code) {
    case DisconnectReason.loggedOut:
      return { action: "logged-out", reason };
    case DisconnectReason.forbidden:
    case DisconnectReason.multideviceMismatch:
      return { action: "stop", reason };
    case DisconnectReason.restartRequired:
      return { action: "reconnect-immediate", reason };
    default:
      // connectionClosed, connectionLost/timedOut, connectionReplaced,
      // badSession, unavailableService, and any unknown code.
      return { action: "reconnect-backoff", reason };
  }
};

export interface ReconnectDelayInput {
  /** 0 for the first retry after a stable connection; grows per consecutive
   *  failed attempt (the caller resets it to 0 on a successful open). */
  attempt: number;
  baseMs: number;
  maxMs: number;
  /** `[0, 1)` — inject `Math.random()` in production; a fixed value in tests. */
  random: number;
}

/**
 * Exponential backoff with EQUAL jitter: `d/2 + rand·d/2`, where
 * `d = min(base·2^attempt, max)`. Equal jitter keeps the delay in `[d/2, d]` —
 * it never collapses toward 0 (as full jitter can) and never marches in
 * lockstep across devices (as no jitter does → thundering herd on mass
 * reconnect). The exponent is clamped so `2**attempt` can't overflow.
 */
export const computeReconnectDelay = (input: ReconnectDelayInput): number => {
  const exponent = Math.min(Math.max(input.attempt, 0), 30);
  const capped = Math.min(input.baseMs * 2 ** exponent, input.maxMs);
  const half = capped / 2;
  return Math.round(half + input.random * half);
};
