import { randomUUID } from "node:crypto";
import { Device } from "@modules/devices/domain/entity/device.entity";
import {
  IDevicesRepository,
  CreateDeviceData,
} from "@modules/devices/domain/repository/devices-repository.interface";
import { type DeviceStatus } from "@modules/devices/domain/value-object/device-status";
import { ConflictError, NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * In-memory `IDevicesRepository` for specs — mocks at the repository boundary
 * (R25), never at Prisma. Enforces the same invariants the DB does: names are
 * unique per account, tenant-scoped reads/writes hide other accounts' devices,
 * and updateStatus/delete raise not-found.
 */
export class InMemoryDevicesRepository implements IDevicesRepository {
  private readonly devices = new Map<string, Device>();

  async findById(accountId: string, id: string): Promise<Device | null> {
    const device = this.devices.get(id);
    return device && device.accountId === accountId ? device : null;
  }

  async findByName(accountId: string, name: string): Promise<Device | null> {
    for (const device of this.devices.values()) {
      if (device.accountId === accountId && device.name === name) return device;
    }
    return null;
  }

  async list(accountId: string): Promise<Device[]> {
    return [...this.devices.values()]
      .filter((device) => device.accountId === accountId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findByIdInternal(id: string): Promise<Device | null> {
    return this.devices.get(id) ?? null;
  }

  async listAll(): Promise<Device[]> {
    return [...this.devices.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  async create(data: CreateDeviceData): Promise<Device> {
    if (await this.findByName(data.accountId, data.name)) {
      throw new ConflictError(
        "A device with this name already exists",
        undefined,
        ErrorCodes.DEVICE_NAME_TAKEN,
      );
    }
    const now = new Date();
    const device = new Device({
      id: randomUUID(),
      accountId: data.accountId,
      name: data.name,
      identifier: null,
      status: "DISCONNECTED",
      webhookUrl: data.webhookUrl,
      webhookSecret: data.webhookSecret,
      lastConnectedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    this.devices.set(device.id, device);
    return device;
  }

  async updateStatus(
    id: string,
    status: DeviceStatus,
    identifier?: string | null,
  ): Promise<Device> {
    const existing = this.devices.get(id);
    if (!existing) {
      throw new NotFoundError(
        "Device not found",
        undefined,
        ErrorCodes.DEVICE_NOT_FOUND,
      );
    }
    const updated = new Device({
      id: existing.id,
      accountId: existing.accountId,
      name: existing.name,
      identifier: identifier === undefined ? existing.identifier : identifier,
      status,
      webhookUrl: existing.webhookUrl,
      webhookSecret: existing.webhookSecret,
      lastConnectedAt:
        status === "CONNECTED" ? new Date() : existing.lastConnectedAt,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    this.devices.set(id, updated);
    return updated;
  }

  async delete(accountId: string, id: string): Promise<void> {
    const existing = this.devices.get(id);
    if (!existing || existing.accountId !== accountId) {
      throw new NotFoundError(
        "Device not found",
        undefined,
        ErrorCodes.DEVICE_NOT_FOUND,
      );
    }
    this.devices.delete(id);
  }
}
