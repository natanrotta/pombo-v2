import { type MessageStatus } from "../value-object/message-status";

export interface OutboxMessageProps {
  id: string;
  deviceId: string;
  idempotencyKey: string;
  toJid: string;
  /** Needed for getMessage (a resend asks Baileys for the original text). */
  text: string;
  waMessageId: string | null;
  status: MessageStatus;
  failureReason: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class OutboxMessage {
  private readonly props: OutboxMessageProps;

  constructor(props: OutboxMessageProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get deviceId(): string {
    return this.props.deviceId;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get toJid(): string {
    return this.props.toJid;
  }

  get text(): string {
    return this.props.text;
  }

  get waMessageId(): string | null {
    return this.props.waMessageId;
  }

  get status(): MessageStatus {
    return this.props.status;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Public status projection. The outbox stores `text`/`toJid` for protocol
   * reasons — those are never leaked; the consumer only ever sees the status.
   */
  public toJSON() {
    return {
      messageId: this.id,
      status: this.status,
      failureReason: this.failureReason,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
