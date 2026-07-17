import { injectable } from "tsyringe";
import { ILoggerProvider } from "@shared/provider";
import { logger } from "@core/http/logger";
import { errorReporter } from "@core/service/error-reporter";

@injectable()
export class PinoLoggerProvider implements ILoggerProvider {
  info(context: Record<string, unknown>, message: string): void {
    logger.info(context, message);
    errorReporter.leaveBreadcrumb(message, { level: "info", ...context });
  }

  warn(context: Record<string, unknown>, message: string): void {
    logger.warn(context, message);
    errorReporter.leaveBreadcrumb(message, { level: "warning", ...context });
  }

  error(context: Record<string, unknown>, message: string): void {
    logger.error(context, message);
    errorReporter.leaveBreadcrumb(message, { level: "error", ...context });
  }

  debug(context: Record<string, unknown>, message: string): void {
    logger.debug(context, message);
    errorReporter.leaveBreadcrumb(message, { level: "debug", ...context });
  }
}
