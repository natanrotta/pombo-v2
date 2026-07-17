import { injectable } from "tsyringe";
import { Device } from "@modules/devices/domain/entity/device.entity";
import {
  IDevicesRepository,
  CreateDeviceData,
  UpdateDeviceWebhooksData,
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
      accountId: data.account_id,
      name: data.name,
      identifier: data.identifier,
      status: data.status as DeviceStatus,
      webhookSecret: data.webhook_secret,
      webhooks: {
        onConnect: data.webhook_on_connect_url,
        onDisconnect: data.webhook_on_disconnect_url,
        onReceive: data.webhook_on_receive_url,
        onMessageStatus: data.webhook_on_message_status_url,
        onSend: data.webhook_on_send_url,
      },
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

  async findById(accountId: string, id: string): Promise<Device | null> {
    try {
      // Scoped by account (R1): a cross-account id resolves to null → the use
      // case raises DEVICE_NOT_FOUND (never 403 — R3).
      const row = await prisma.device.findFirst({
        where: { id, account_id: accountId },
      });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByName(accountId: string, name: string): Promise<Device | null> {
    try {
      const row = await prisma.device.findFirst({
        where: { name, account_id: accountId },
      });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async list(accountId: string): Promise<Device[]> {
    try {
      const rows = await prisma.device.findMany({
        where: { account_id: accountId },
        orderBy: { created_at: "asc" },
      });
      return rows.map((row) => this.toEntity(row));
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByIdInternal(id: string): Promise<Device | null> {
    try {
      // Internal event handlers (webhook dispatch) only carry the device id —
      // no requesting account to scope against. Never reachable from a request.
      const row = await prisma.device.findUnique({ where: { id } });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async listAll(): Promise<Device[]> {
    try {
      // System probe (/health) — intentionally spans every account (no tenant
      // scope). Never reachable from a user request.
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
          account_id: data.accountId,
          name: data.name,
          webhook_secret: data.webhookSecret,
        },
      });
      return this.toEntity(row);
    } catch (error) {
      // The DB @@unique(account_id, name) is the real idempotency guard.
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

  async updateWebhooks(
    accountId: string,
    id: string,
    webhooks: UpdateDeviceWebhooksData,
  ): Promise<Device> {
    try {
      // Scoped write (R1) in a SINGLE atomic statement: updateManyAndReturn
      // filters by account_id and returns the updated row in one round-trip —
      // no updateMany→findFirst TOCTOU (a concurrent delete can't surface a
      // false 404). Only the keys the caller supplied are written (undefined =
      // leave unchanged; null clears).
      const rows = await prisma.device.updateManyAndReturn({
        where: { id, account_id: accountId },
        data: {
          ...(webhooks.onConnect !== undefined && {
            webhook_on_connect_url: webhooks.onConnect,
          }),
          ...(webhooks.onDisconnect !== undefined && {
            webhook_on_disconnect_url: webhooks.onDisconnect,
          }),
          ...(webhooks.onReceive !== undefined && {
            webhook_on_receive_url: webhooks.onReceive,
          }),
          ...(webhooks.onMessageStatus !== undefined && {
            webhook_on_message_status_url: webhooks.onMessageStatus,
          }),
          ...(webhooks.onSend !== undefined && {
            webhook_on_send_url: webhooks.onSend,
          }),
        },
      });
      const [row] = rows;
      if (!row) {
        throw new NotFoundError(
          "Device not found",
          undefined,
          ErrorCodes.DEVICE_NOT_FOUND,
        );
      }
      return this.toEntity(row);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw mapPrismaError(error);
    }
  }

  async updateStatus(
    id: string,
    status: DeviceStatus,
    identifier?: string | null,
  ): Promise<Device> {
    try {
      // System-triggered (session events / post-ownership connect), keyed by
      // the device PK. Ownership is validated by the caller before this runs.
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

  async delete(accountId: string, id: string): Promise<void> {
    try {
      // Scoped delete (R1): deleteMany with the account filter, then assert a
      // row was actually removed — a cross-account id deletes nothing → 404.
      const result = await prisma.device.deleteMany({
        where: { id, account_id: accountId },
      });
      if (result.count === 0) {
        throw new NotFoundError(
          "Device not found",
          undefined,
          ErrorCodes.DEVICE_NOT_FOUND,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw mapPrismaError(error);
    }
  }
}
