import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IDisconnectDebouncer } from "@modules/webhooks/domain/provider/disconnect-debouncer.interface";
import { AppConfig } from "@shared/provider/app-config.interface";

/**
 * A socket flap must NOT deliver `disconnected` + `connected` back to back. On a
 * drop we arm a per-device timer; if `connected` (or `logged_out`) arrives
 * within DISCONNECT_DEBOUNCE_MS the caller cancels it → zero disconnect webhook.
 * Only a drop that PERSISTS past the window flushes exactly one
 * `device.disconnected`. Re-arming a device restarts its window.
 */
@injectable()
export class HttpDisconnectDebouncer implements IDisconnectDebouncer {
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private onFlush: (deviceId: string, reason: string) => void = () => {};

  constructor(
    @inject(DI_TOKENS.AppConfig)
    private readonly config: AppConfig,
  ) {}

  setOnFlush(onFlush: (deviceId: string, reason: string) => void): void {
    this.onFlush = onFlush;
  }

  private clear(deviceId: string): void {
    const timer = this.timers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(deviceId);
    }
  }

  schedule(deviceId: string, reason: string): void {
    // Re-arm: a fresh drop restarts the debounce window and carries the LATEST
    // reason — the whole window is one logical disconnect.
    this.clear(deviceId);
    const timer = setTimeout(() => {
      this.timers.delete(deviceId);
      this.onFlush(deviceId, reason);
    }, this.config.DISCONNECT_DEBOUNCE_MS);
    timer.unref(); // never keep the process alive just to emit a disconnect
    this.timers.set(deviceId, timer);
  }

  cancel(deviceId: string): void {
    this.clear(deviceId);
  }
}
