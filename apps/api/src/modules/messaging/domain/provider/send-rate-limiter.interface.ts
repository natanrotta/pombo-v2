/**
 * Per-device outbound-send throttle (anti-ban). Sending too fast trips
 * WhatsApp's anti-spam and gets the number banned — a banned number is a
 * disconnected device. The live send path and the reconnect drain both consume
 * from the SAME per-device budget, so a burst can't slip through by splitting
 * across the two paths.
 */
export interface ISendRateLimiter {
  /**
   * Consume one send token for the device. Returns `true` if a token was
   * available (caller may send now) or `false` if the budget is exhausted
   * (caller should queue the message and let the drain send it later).
   */
  tryConsume(deviceId: string): boolean;
  /** Milliseconds until the next token is available (0 if one is available now).
   *  Used by the drain to pace itself instead of busy-waiting. */
  msUntilNextToken(deviceId: string): number;
}
