import { injectable } from "tsyringe";
import { OutboxMessage } from "@modules/messaging/domain/entity/outbox-message.entity";
import {
  IOutboxRepository,
  CreateOutboxData,
} from "@modules/messaging/domain/repository/outbox-repository.interface";
import { type MessageStatus } from "@modules/messaging/domain/value-object/message-status";
import { prisma } from "@core/database/prisma/prisma-client";
import { mapPrismaError } from "@core/database/prisma/prisma-error-mapper";
import { Prisma } from "@generated/prisma/client";
import { outbox_message as PrismaOutbox } from "@generated/prisma/client";
import { ConflictError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

@injectable()
export class PrismaOutboxRepository implements IOutboxRepository {
  private toEntity(row: PrismaOutbox): OutboxMessage {
    return new OutboxMessage({
      id: row.id,
      deviceId: row.device_id,
      idempotencyKey: row.idempotency_key,
      toJid: row.to_jid,
      text: row.text,
      waMessageId: row.wa_message_id,
      status: row.status as MessageStatus,
      failureReason: row.failure_reason,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }

  async findById(id: string): Promise<OutboxMessage | null> {
    try {
      const row = await prisma.outbox_message.findUnique({ where: { id } });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByIdempotencyKey(
    deviceId: string,
    idempotencyKey: string,
  ): Promise<OutboxMessage | null> {
    try {
      const row = await prisma.outbox_message.findUnique({
        where: {
          device_id_idempotency_key: {
            device_id: deviceId,
            idempotency_key: idempotencyKey,
          },
        },
      });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async findByWaMessageId(waMessageId: string): Promise<OutboxMessage | null> {
    try {
      const row = await prisma.outbox_message.findUnique({
        where: { wa_message_id: waMessageId },
      });
      return row ? this.toEntity(row) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async create(data: CreateOutboxData): Promise<OutboxMessage> {
    try {
      const row = await prisma.outbox_message.create({
        data: {
          device_id: data.deviceId,
          idempotency_key: data.idempotencyKey,
          to_jid: data.toJid,
          text: data.text,
          expires_at: data.expiresAt,
        },
      });
      return this.toEntity(row);
    } catch (error) {
      // The DB unique (device_id, idempotency_key) is the real idempotency guard.
      if (this.isPrismaCode(error, "P2002")) {
        throw new ConflictError(
          "This Idempotency-Key was already used with a different payload",
          undefined,
          ErrorCodes.IDEMPOTENCY_KEY_CONFLICT,
        );
      }
      throw mapPrismaError(error);
    }
  }

  async setWaMessageId(id: string, waMessageId: string): Promise<void> {
    try {
      await prisma.outbox_message.update({
        where: { id },
        data: { wa_message_id: waMessageId },
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async updateStatus(
    id: string,
    status: MessageStatus,
    failureReason?: string | null,
  ): Promise<OutboxMessage> {
    try {
      const row = await prisma.outbox_message.update({
        where: { id },
        data: {
          status,
          ...(failureReason === undefined
            ? {}
            : { failure_reason: failureReason }),
        },
      });
      return this.toEntity(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async applyMonotonicStatus(
    waMessageId: string,
    status: MessageStatus,
    allowedFrom: MessageStatus[],
  ): Promise<OutboxMessage | null> {
    try {
      // The monotonic guard lives in the WHERE (status IN allowedFrom), so the
      // write is atomic: a stale concurrent ack updates zero rows. RETURNING
      // gives the updated row in one round-trip — no second lookup a prune could
      // race and drop the webhook.
      const rows = await prisma.outbox_message.updateManyAndReturn({
        where: { wa_message_id: waMessageId, status: { in: allowedFrom } },
        data: { status },
      });
      return rows[0] ? this.toEntity(rows[0]) : null;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async pruneExpired(now: Date): Promise<number> {
    try {
      const result = await prisma.outbox_message.deleteMany({
        where: { expires_at: { lt: now } },
      });
      return result.count;
    } catch (error) {
      throw mapPrismaError(error);
    }
  }
}
