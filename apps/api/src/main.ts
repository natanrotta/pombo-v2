import "reflect-metadata";
import "@core/container";
import { initErrorReporter } from "@core/service/error-reporter";

initErrorReporter();

import http from "http";
import { app } from "@core/http";
import { logger } from "@core/http/logger";
import { env } from "@core/config";
import { container } from "@core/container";
import { DI_TOKENS } from "@core/container/tokens";
import type { ICacheProvider } from "@shared/provider/cache-provider.interface";
import type { IEventBus } from "@shared/provider/event-bus.interface";
import type { IFlowProducer } from "@shared/provider/flow-producer.interface";
import type { IQueueProvider } from "@shared/provider/queue-provider.interface";
import { shutdownRateLimitStore } from "@core/http/middlewares/rate-limit-store";
import { startWhatsAppGateway } from "@core/service/whatsapp/gateway-boot";

const server = http.createServer(app);

// WhatsApp gateway boot (pombo). Only runs when WHATSAPP_ENABLED=true: acquires
// the single-replica advisory lock, wires the bus listeners, rehydrates
// CONNECTED devices from authState, and starts the outbox-prune interval.
// Returns a shutdown that closes sockets WITHOUT logging out + releases the
// lock. When disabled (default), NONE of this runs and Baileys is never
// imported — the API still boots and every HTTP endpoint responds.
let stopWhatsAppGateway: (() => Promise<void>) | null = null;

const start = async (): Promise<void> => {
  if (env.WHATSAPP_ENABLED) {
    stopWhatsAppGateway = await startWhatsAppGateway();
  }

  server.listen(env.API_PORT, () => {
    logger.info(
      {
        port: env.API_PORT,
        environment: env.NODE_ENV,
        whatsappEnabled: env.WHATSAPP_ENABLED,
      },
      "Server started",
    );
  });
};

void start();

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down gracefully");
  const queueProvider = container.resolve<IQueueProvider>(
    DI_TOKENS.QueueProvider,
  );
  const eventBus = container.resolve<IEventBus>(DI_TOKENS.EventBus);
  const flowProducer = container.resolve<IFlowProducer>(DI_TOKENS.FlowProducer);
  const cacheProvider = container.resolve<ICacheProvider>(
    DI_TOKENS.CacheProvider,
  );
  // Close WhatsApp sockets (close(), NEVER logout()) + release the advisory
  // lock before the rest of the teardown. No-op when the gateway is disabled.
  if (stopWhatsAppGateway) {
    await stopWhatsAppGateway().catch((error: unknown) =>
      logger.error(
        { message: error instanceof Error ? error.message : String(error) },
        "WhatsApp gateway shutdown failed",
      ),
    );
  }
  await Promise.all([
    queueProvider.shutdown(),
    eventBus.shutdown(),
    flowProducer.shutdown(),
  ]);
  await Promise.all([cacheProvider.disconnect(), shutdownRateLimitStore()]);
  server.close(() => {
    logger.info({ signal }, "Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { server };
