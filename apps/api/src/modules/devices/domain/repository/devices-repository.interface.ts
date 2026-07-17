import { Device } from "../entity/device.entity";
import { type DeviceStatus } from "../value-object/device-status";

export interface CreateDeviceData {
  name: string;
  webhookUrl: string | null;
  webhookSecret: string;
}

/**
 * The port the application depends on. No pagination, no ownerId, no deletedAt
 * — pombo is a single-operator admin surface (spec Decisions log; R1 N/A).
 * Idempotency on `name` is enforced by the DB `@unique`.
 */
export interface IDevicesRepository {
  findById(id: string): Promise<Device | null>;
  findByName(name: string): Promise<Device | null>;
  list(): Promise<Device[]>;
  create(data: CreateDeviceData): Promise<Device>;
  updateStatus(
    id: string,
    status: DeviceStatus,
    identifier?: string | null,
  ): Promise<Device>;
  delete(id: string): Promise<void>;
}
