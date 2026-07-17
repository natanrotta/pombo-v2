import { injectable, inject } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IUserRepository } from "@modules/user/domain/repository/user-repository.interface";
import { IStorageProvider } from "@shared/provider/storage-provider.interface";
import { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { MeResponseDTO } from "../../dto/auth.dto";
import { NotFoundError, BadRequestError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { safeS3Delete } from "@shared/util/safe-s3-delete";
import { AuthProfileBuilder } from "@modules/auth/application/service/auth/auth-profile.builder";

@injectable()
export class UpdateAvatarUseCase {
  constructor(
    @inject(DI_TOKENS.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(DI_TOKENS.StorageProvider)
    private readonly storageProvider: IStorageProvider,
    @inject(DI_TOKENS.LoggerProvider)
    private readonly logger: ILoggerProvider,
    @inject(DI_TOKENS.AuthProfileBuilder)
    private readonly profileBuilder: AuthProfileBuilder,
  ) {}

  async execute(
    userId: string,
    file: Express.Multer.File,
  ): Promise<MeResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError(
        "User not found",
        undefined,
        ErrorCodes.USER_NOT_FOUND,
      );
    }

    if (!file) {
      throw new BadRequestError(
        "File is required",
        undefined,
        ErrorCodes.FILE_REQUIRED,
      );
    }

    const ext = file.originalname.split(".").pop() || "jpg";
    const key = `avatars/${userId}.${ext}`;

    if (user.avatarUrl) {
      await safeS3Delete(user.avatarUrl, this.storageProvider, this.logger, {
        userId,
      });
    }

    const { url } = await this.storageProvider.upload(
      file.buffer,
      key,
      file.mimetype,
    );
    const updatedUser = await this.userRepository.updateAvatarUrl(userId, url);

    return this.profileBuilder.buildProfile(updatedUser);
  }
}
