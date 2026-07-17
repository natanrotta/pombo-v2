import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import type { IDomainEventBus } from "@shared/provider/domain-event-bus.interface";
import {
  HandleSessionConnectedUseCase,
  HandleSessionDisconnectedUseCase,
  HandleSessionLoggedOutUseCase,
} from "@modules/devices/application/use-case/devices";

/**
 * Wires the domain bus session events → the device-lifecycle use cases: this is
 * where `devices` reacts to its OWN Baileys adapter's events to keep the DB
 * status truthful. `webhooks` subscribes to the same bus independently —
 * `devices` never imports `webhooks`. `session.qr` is not handled here (it is a
 * live QR for pairing — the composition root prints it to the terminal).
 *
 * Called from the composition root only when `WHATSAPP_ENABLED=true`.
 */
export function registerSessionListeners(): void {
  const bus = container.resolve<IDomainEventBus>(DI_TOKENS.DomainEventBus);

  bus.subscribe("session.connected", async (event) => {
    await container
      .resolve(HandleSessionConnectedUseCase)
      .execute({ deviceId: event.deviceId, identifier: event.identifier });
  });

  bus.subscribe("session.disconnected", async (event) => {
    await container
      .resolve(HandleSessionDisconnectedUseCase)
      .execute({ deviceId: event.deviceId });
  });

  bus.subscribe("session.logged_out", async (event) => {
    await container
      .resolve(HandleSessionLoggedOutUseCase)
      .execute({ deviceId: event.deviceId });
  });
}
