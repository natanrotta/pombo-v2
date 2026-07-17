import { type DeviceStatus } from "../value-object/device-status";

export interface DeviceProps {
  id: string;
  name: string;
  /** null until pairing — WhatsApp is the source of truth for it. */
  identifier: string | null;
  status: DeviceStatus;
  webhookUrl: string | null;
  /** Generated at registration, returned exactly once; never re-exposed. */
  webhookSecret: string | null;
  lastConnectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Device {
  private readonly props: DeviceProps;

  constructor(props: DeviceProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get identifier(): string | null {
    return this.props.identifier;
  }

  get status(): DeviceStatus {
    return this.props.status;
  }

  get webhookUrl(): string | null {
    return this.props.webhookUrl;
  }

  get webhookSecret(): string | null {
    return this.props.webhookSecret;
  }

  get lastConnectedAt(): Date | null {
    return this.props.lastConnectedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Public wire projection returned by GET endpoints. NEVER leaks
   * `webhookSecret` (shown exactly once, at registration).
   */
  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      identifier: this.identifier,
      status: this.status,
      webhookUrl: this.webhookUrl,
      lastConnectedAt: this.lastConnectedAt
        ? this.lastConnectedAt.toISOString()
        : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
