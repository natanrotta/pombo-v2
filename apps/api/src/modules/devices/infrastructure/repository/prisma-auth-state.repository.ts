import { injectable } from "tsyringe";
import { IAuthStateRepository } from "@modules/devices/domain/repository/auth-state-repository.interface";
import { prisma } from "@core/database/prisma/prisma-client";
import { mapPrismaError } from "@core/database/prisma/prisma-error-mapper";

@injectable()
export class PrismaAuthStateRepository implements IAuthStateRepository {
  async clear(deviceId: string): Promise<void> {
    try {
      await prisma.auth_key.deleteMany({ where: { device_id: deviceId } });
    } catch (error) {
      throw mapPrismaError(error);
    }
  }
}
