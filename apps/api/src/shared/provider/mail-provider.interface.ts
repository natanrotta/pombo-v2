/**
 * Inline attachment for an outgoing email. Both Resend and Nodemailer-style
 * providers accept the same shape — `filename` is the name displayed to the
 * recipient, `content` is the raw binary buffer. PDFs are the only current
 * use case (clinical documents); this can be extended with `contentType`
 * later if the provider needs an explicit MIME type.
 */
export interface MailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional inline attachments. Backward-compatible — existing senders
   *  (password reset, invites, …) pass nothing and behave identically. */
  attachments?: MailAttachment[];
}

export interface IMailProvider {
  send(input: SendMailInput): Promise<void>;
}
