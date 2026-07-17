import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { DispatchWebhookUseCase } from "@modules/webhooks/application/use-case/webhooks/dispatch-webhook.use-case";
import type { IDisconnectDebouncer } from "@modules/webhooks/domain/provider/disconnect-debouncer.interface";

/**
 * Wires bus events → webhook dispatch. This is the ONLY place `webhooks`
 * touches the bus; `devices`/`messaging` never import `webhooks`. The disconnect
 * debouncer sits on the disconnected path: connected/logged_out cancel a pending
 * disconnect so a flap delivers zero disconnect webhooks. The debouncer's
 * onFlush dispatches device.disconnected when the drop persists past the window.
 *
 * Called from the composition root only when `WHATSAPP_ENABLED=true`.
 */
export function registerWebhookListeners(): void {
  const bus = container.resolve<IDomainEventBus>(DI_TOKENS.DomainEventBus);
  const logger = container.resolve<ILoggerProvider>(DI_TOKENS.LoggerProvider);
  const debouncer = container.resolve<IDisconnectDebouncer>(
    DI_TOKENS.DisconnectDebouncer,
  );

  const dispatch = (
    payload: Parameters<DispatchWebhookUseCase["execute"]>[0],
  ): Promise<void> =>
    container.resolve(DispatchWebhookUseCase).execute(payload);

  // The debouncer fires onFlush from a bare setTimeout — OUTSIDE the bus's
  // handler isolation — so guard it here: a dispatch failure must be logged, not
  // a silent unhandled rejection that drops a real device.disconnected.
  debouncer.setOnFlush((deviceId, reason) => {
    void dispatch({
      type: "device.disconnected",
      deviceId,
      data: { reason },
    }).catch((error: unknown) =>
      logger.error(
        {
          deviceId,
          message: error instanceof Error ? error.message : String(error),
        },
        "disconnect webhook dispatch failed",
      ),
    );
  });

  bus.subscribe("session.connected", async (event) => {
    debouncer.cancel(event.deviceId);
    await dispatch({
      type: "device.connected",
      deviceId: event.deviceId,
      data: { identifier: event.identifier },
    });
  });

  bus.subscribe("session.disconnected", async (event) => {
    // Don't emit yet — wait out the debounce window. If it doesn't come back,
    // onFlush dispatches device.disconnected.
    debouncer.schedule(event.deviceId, event.reason);
  });

  bus.subscribe("session.logged_out", async (event) => {
    debouncer.cancel(event.deviceId);
    await dispatch({
      type: "device.logged_out",
      deviceId: event.deviceId,
      data: {},
    });
  });

  bus.subscribe("message.status", async (event) => {
    await dispatch({
      type: "message.status",
      deviceId: event.deviceId,
      data: { messageId: event.messageId, status: event.status },
    });
  });

  bus.subscribe("message.sent", async (event) => {
    await dispatch({
      type: "message.sent",
      deviceId: event.deviceId,
      data: { messageId: event.messageId, phone: event.phone },
    });
  });
}
