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

const server = http.createServer(app);

server.listen(env.API_PORT, () => {
  logger.info(
    { port: env.API_PORT, environment: env.NODE_ENV },
    "Server started",
  );
});

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
