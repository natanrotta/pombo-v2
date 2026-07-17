import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import {
  ILoggerProvider,
  IMailProvider,
  SendMailInput,
} from "@shared/provider";
import { InternalError, ErrorCodes } from "@shared/error";
import { env } from "@core/config";

/**
 * Logs outgoing emails via the logger instead of delivering them.
 * Keeps the feature functional end-to-end in local/dev environments without
 * requiring SMTP credentials. Swap this registration for a real provider
 * (Resend, SES, Nodemailer...) in production.
 *
 * Fails loudly when NODE_ENV === "production" so an accidental prod deploy
 * does not silently drop password-reset emails.
 */
@injectable()
export class ConsoleMailProvider implements IMailProvider {
  constructor(
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
  ) {}

  async send(input: SendMailInput): Promise<void> {
    if (env.NODE_ENV === "production") {
      throw new InternalError(
        "ConsoleMailProvider must not be used in production. Register a real IMailProvider in the DI container.",
        undefined,
        ErrorCodes.INTERNAL_ERROR,
      );
    }

    this.logger.info(
      {
        to: input.to,
        subject: input.subject,
        text: input.text,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          sizeBytes: a.content.length,
        })),
      },
      "[ConsoleMailProvider] Outgoing email (not actually delivered)",
    );
  }
}
