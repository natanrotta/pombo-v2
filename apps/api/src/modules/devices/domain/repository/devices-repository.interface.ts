import { Device, type DeviceWebhooks } from "../entity/device.entity";
import { type DeviceStatus } from "../value-object/device-status";

export interface CreateDeviceData {
  accountId: string;
  name: string;
  webhookSecret: string;
}

/** Partial per-event webhook update: only the provided keys are written
 *  (`null` clears a URL, an absent key leaves it unchanged). */
export type UpdateDeviceWebhooksData = Partial<DeviceWebhooks>;

/**
 * The port the application depends on.
 *
 * Request-driven reads/writes are scoped to the caller's `accountId` (BASELINE
 * R1): a device that belongs to another account resolves to `null`, so the use
 * case raises `DEVICE_NOT_FOUND` (never a 403 — R3). Idempotency on the device
 * name is enforced per-account by the DB `@@unique([account_id, name])`.
 *
 * The two `*Internal` / `updateStatus` methods are **system-triggered** (Baileys
 * session events + the `/health` probe), keyed by the device primary key with
 * NO tenant filter — their trigger is a socket the gateway already owns, not a
 * user request, so there is no requesting account to scope against.
 *
 * WARNING: a `Device` returned by a system-triggered method carries its real
 * `accountId`, but that value was NOT validated against a requesting account.
 * Never forward `device.accountId` from these paths into a tenant-scoped method
 * as a stand-in for a caller-supplied `accountId` — that would launder an
 * unvalidated tenant into a scoped query (confused deputy). Scoped queries must
 * always take the account from `req.auth.accountId`.
 */
export interface IDevicesRepository {
  // ── Tenant-scoped (request-driven, R1) ──────────────────────────────────
  findById(accountId: string, id: string): Promise<Device | null>;
  findByName(accountId: string, name: string): Promise<Device | null>;
  list(accountId: string): Promise<Device[]>;
  create(data: CreateDeviceData): Promise<Device>;
  updateWebhooks(
    accountId: string,
    id: string,
    webhooks: UpdateDeviceWebhooksData,
  ): Promise<Device>;
  delete(accountId: string, id: string): Promise<void>;

  // ── System-triggered (no tenant scope; keyed by device PK) ───────────────
  /** Lookup by primary key for internal event handlers (e.g. webhook dispatch
   *  reacting to a session event), which only carry the device id — there is no
   *  requesting account to scope against. Never reachable from a user request. */
  findByIdInternal(id: string): Promise<Device | null>;
  /** All devices across every account — for the unauthenticated `/health`
   *  aggregate only. Never expose behind a user request. */
  listAll(): Promise<Device[]>;
  updateStatus(
    id: string,
    status: DeviceStatus,
    identifier?: string | null,
  ): Promise<Device>;
}
