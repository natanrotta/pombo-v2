import { DisconnectReason } from "@whiskeysockets/baileys";
import {
  classifyDisconnect,
  computeReconnectDelay,
  describeDisconnect,
} from "./reconnect-policy";

describe("classifyDisconnect", () => {
  it("stops and re-pairs on loggedOut (401)", () => {
    const decision = classifyDisconnect(DisconnectReason.loggedOut);
    expect(decision.action).toBe("logged-out");
    expect(decision.reason).toBe("loggedOut (401)");
  });

  it("stops (no reconnect) on a banned/incompatible number", () => {
    expect(classifyDisconnect(DisconnectReason.forbidden).action).toBe("stop");
    expect(
      classifyDisconnect(DisconnectReason.multideviceMismatch).action,
    ).toBe("stop");
  });

  it("reconnects immediately on restartRequired (515) — the post-pairing restart", () => {
    expect(classifyDisconnect(DisconnectReason.restartRequired).action).toBe(
      "reconnect-immediate",
    );
  });

  it("reconnects with backoff on transient drops", () => {
    for (const code of [
      DisconnectReason.connectionClosed,
      DisconnectReason.connectionLost, // 408 (== timedOut)
      DisconnectReason.connectionReplaced,
      DisconnectReason.badSession,
      DisconnectReason.unavailableService,
    ]) {
      expect(classifyDisconnect(code).action).toBe("reconnect-backoff");
    }
  });

  it("reconnects with backoff on an unknown / missing status code", () => {
    expect(classifyDisconnect(undefined).action).toBe("reconnect-backoff");
    expect(classifyDisconnect(undefined).reason).toBe("unknown");
    expect(classifyDisconnect(9999).action).toBe("reconnect-backoff");
    // an unknown *numeric* code still carries the number for diagnosis
    expect(classifyDisconnect(9999).reason).toBe("unknown (9999)");
  });
});

describe("describeDisconnect", () => {
  it("labels a known code as 'name (code)'", () => {
    expect(describeDisconnect(DisconnectReason.connectionLost)).toBe(
      "connectionLost (408)",
    );
  });

  it("labels a missing code as 'unknown'", () => {
    expect(describeDisconnect(undefined)).toBe("unknown");
  });
});

describe("computeReconnectDelay", () => {
  const baseMs = 3000;
  const maxMs = 300000;

  it("applies equal jitter: [d/2, d] for the given attempt", () => {
    // attempt 0 → d = base = 3000 → [1500, 3000]
    expect(
      computeReconnectDelay({ attempt: 0, baseMs, maxMs, random: 0 }),
    ).toBe(1500);
    expect(
      computeReconnectDelay({ attempt: 0, baseMs, maxMs, random: 1 }),
    ).toBe(3000);
    expect(
      computeReconnectDelay({ attempt: 0, baseMs, maxMs, random: 0.5 }),
    ).toBe(2250);
  });

  it("grows exponentially with the attempt", () => {
    // attempt 3 → d = 3000 * 8 = 24000 → random 0 → 12000
    expect(
      computeReconnectDelay({ attempt: 3, baseMs, maxMs, random: 0 }),
    ).toBe(12000);
  });

  it("never exceeds the cap", () => {
    // huge attempt → capped at maxMs → random 1 → exactly maxMs
    const delay = computeReconnectDelay({
      attempt: 50,
      baseMs,
      maxMs,
      random: 1,
    });
    expect(delay).toBe(maxMs);
    expect(delay).toBeLessThanOrEqual(maxMs);
  });

  it("stays at or below the cap for every jitter value at a huge attempt", () => {
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      const delay = computeReconnectDelay({
        attempt: 50,
        baseMs,
        maxMs,
        random,
      });
      expect(delay).toBeGreaterThanOrEqual(maxMs / 2);
      expect(delay).toBeLessThanOrEqual(maxMs);
    }
  });
});
