import { injectable } from "tsyringe";
import { Device } from "@modules/devices/domain/entity/device.entity";
import {
  IDevicesRepository,
  CreateDeviceData,
} from "@modules/devices/domain/repository/devices-repository.interface";
import { type DeviceStatus } from "@modules/devices/domain/value-object/device-status";
import { prisma } from "@core/database/prisma/prisma-client";
import { mapPrismaError } from "@core/database/prisma/prisma-error-mapper";
import { Prisma } from "@generated/prisma/client";
import { device as PrismaDevice } from "@generated/prisma/client";
import { ConflictError, NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

@injectable()
export class PrismaDevicesRepository implements IDevicesRepository {
  private toEntity(data: PrismaDevice): Device {
    return new Device({
      id: data.id,
      name: data.name,
      identifier: data.identifier,
      status: data.status as DeviceStatus,
      webhookUrl: data.webhook_url,
      webhookSecret: data.webhook_secret,
      lastConnectedAt: data.last_connected_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }

  async findById(id: string): Promise<Device | null> {
    try {
      const row = await prisma.device.findUnique({ where: { id } });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByName(name: string): Promise<Device | null> {
    try {
      const row = await prisma.device.findUnique({ where: { name } });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async list(): Promise<Device[]> {
    try {
      const rows = await prisma.device.findMany({
        orderBy: { created_at: "asc" },
      });
      return rows.map((row) => this.toEntity(row));
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async create(data: CreateDeviceData): Promise<Device> {
    try {
      const row = await prisma.device.create({
        data: {
          name: data.name,
          webhook_url: data.webhookUrl,
          webhook_secret: data.webhookSecret,
        },
      });
      return this.toEntity(row);
    } catch (error) {
      // The DB @unique on name is the real idempotency guard, not the code.
      if (this.isPrismaCode(error, "P2002")) {
        throw new ConflictError(
          "A device with this name already exists",
          undefined,
          ErrorCodes.DEVICE_NAME_TAKEN,
        );
      }
      throw mapPrismaError(error);
    }
  }

  async updateStatus(
    id: string,
    status: DeviceStatus,
    identifier?: string | null,
  ): Promise<Device> {
    try {
      const row = await prisma.device.update({
        where: { id },
        data: {
          status,
          ...(identifier === undefined ? {} : { identifier }),
          // Stamp the last successful connection when the socket comes up.
          ...(status === "CONNECTED" ? { last_connected_at: new Date() } : {}),
        },
      });
      return this.toEntity(row);
    } catch (error) {
      // P2025 = record deleted between the caller's findById and this write.
      if (this.isPrismaCode(error, "P2025")) {
        throw new NotFoundError(
          "Device not found",
          undefined,
          ErrorCodes.DEVICE_NOT_FOUND,
        );
      }
      throw mapPrismaError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.device.delete({ where: { id } });
    } catch (error) {
      if (this.isPrismaCode(error, "P2025")) {
        throw new NotFoundError(
          "Device not found",
          undefined,
          ErrorCodes.DEVICE_NOT_FOUND,
        );
      }
      throw mapPrismaError(error);
    }
  }
}
