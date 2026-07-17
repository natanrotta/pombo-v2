/**
 * Port for the disconnect debounce. The application listener depends on this
 * interface; the timer-based impl lives in infrastructure. `schedule` arms a
 * per-device window; `cancel` (a reconnect/logout) clears it → a socket flap
 * emits zero disconnect webhooks.
 */
export interface IDisconnectDebouncer {
  schedule(deviceId: string, reason: string): void;
  cancel(deviceId: string): void;
  /** Wired once by the composition root: dispatched when a drop persists past
   *  the debounce window. */
  setOnFlush(onFlush: (deviceId: string, reason: string) => void): void;
}
