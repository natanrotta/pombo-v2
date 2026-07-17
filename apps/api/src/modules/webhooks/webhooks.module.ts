import type { DependencyContainer } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IWebhookSender } from "@modules/webhooks/domain/provider/webhook-sender.interface";
import { IDisconnectDebouncer } from "@modules/webhooks/domain/provider/disconnect-debouncer.interface";
import { HttpWebhookSender } from "@modules/webhooks/infrastructure/provider/http-webhook-sender";
import { HttpDisconnectDebouncer } from "@modules/webhooks/infrastructure/provider/http-disconnect-debouncer";

/**
 * DI wiring for the webhooks domain. Registers the HMAC webhook sender + the
 * disconnect debouncer (both singletons). The dispatch use case is
 * `@injectable()` and resolved on demand. `webhooks` subscribes to the domain
 * bus in the composition root; nothing imports `webhooks` back.
 */
export function registerWebhooksModule(container: DependencyContainer): void {
  container.registerSingleton<IWebhookSender>(
    DI_TOKENS.WebhookSender,
    HttpWebhookSender,
  );
  container.registerSingleton<IDisconnectDebouncer>(
    DI_TOKENS.DisconnectDebouncer,
    HttpDisconnectDebouncer,
  );
}
