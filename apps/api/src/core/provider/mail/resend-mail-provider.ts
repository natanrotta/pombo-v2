import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { Resend } from "resend";
import {
  ILoggerProvider,
  IMailProvider,
  SendMailInput,
} from "@shared/provider";
import { env } from "@core/config";
import {
  InternalError,
  ServiceUnavailableError,
  ErrorCodes,
} from "@shared/error";

@injectable()
export class ResendMailProvider implements IMailProvider {
  private readonly client: Resend;

  constructor(
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
  ) {
    if (!env.RESEND_API_KEY) {
      throw new InternalError(
        "ResendMailProvider requires RESEND_API_KEY to be set",
        undefined,
        ErrorCodes.INTERNAL_ERROR,
      );
    }
    this.client = new Resend(env.RESEND_API_KEY);
  }

  async send(input: SendMailInput): Promise<void> {
    const shouldRedirect =
      env.NODE_ENV !== "production" && Boolean(env.MAIL_DEV_REDIRECT_TO);
    const to = shouldRedirect ? env.MAIL_DEV_REDIRECT_TO! : input.to;
    const subject = shouldRedirect
      ? `[DEV → ${input.to}] ${input.subject}`
      : input.subject;

    if (shouldRedirect) {
      this.logger.warn(
        { redirectedTo: to },
        "[ResendMailProvider] Dev redirect active — rerouting outgoing email",
      );
    }

    const { data, error } = await this.client.emails.send({
      from: env.MAIL_FROM,
      to,
      subject,
      html: input.html,
      text: input.text,
      ...(input.attachments && input.attachments.length > 0
        ? {
            attachments: input.attachments.map((att) => ({
              filename: att.filename,
              content: att.content,
            })),
          }
        : {}),
    });

    if (error) {
      // Recipient address and subject are PII-adjacent — log only opaque data.
      this.logger.error(
        { error: error.message },
        "[ResendMailProvider] Failed to send email",
      );
      throw new ServiceUnavailableError(
        `Failed to send email: ${error.message}`,
        undefined,
        ErrorCodes.MAIL_SEND_FAILED,
      );
    }

    this.logger.info(
      { messageId: data?.id },
      "[ResendMailProvider] Email sent",
    );
  }
}
