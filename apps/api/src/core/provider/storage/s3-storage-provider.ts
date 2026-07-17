import { Readable } from "node:stream";
import { injectable } from "tsyringe";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  IStorageProvider,
  UploadResult,
  ExternalDependencyHealth,
} from "@shared/provider";
import { AppError, InternalError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { logger } from "@core/http/logger";
import { env } from "../../config";

/** Upper bound on the health probe so a slow/hung S3 never stalls the status
 *  panel. The panel degrades to "inacessível"; it never waits. */
const HEALTH_PROBE_TIMEOUT_MS = 3000;

@injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET || "";
    this.client = new S3Client({
      region: env.AWS_REGION || "us-east-1",
      ...(env.AWS_ACCESS_KEY_ID &&
        env.AWS_SECRET_ACCESS_KEY && {
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          },
        }),
    });
  }

  async checkHealth(): Promise<ExternalDependencyHealth> {
    if (!this.bucket || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      return { configured: false, reachable: false };
    }
    try {
      // HeadBucket is the cheapest liveness call — it transfers no object data
      // and confirms both connectivity and that the credentials can see the
      // bucket. Bounded by an AbortSignal so the panel never hangs.
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }), {
        abortSignal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
      });
      return { configured: true, reachable: true };
    } catch (error) {
      logger.warn(
        {
          service: "s3",
          bucket: this.bucket,
          error: error instanceof Error ? error.message : String(error),
        },
        "S3 health probe failed",
      );
      return { configured: true, reachable: false };
    }
  }

  async upload(
    file: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
        }),
      );

      const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
      return { url, key };
    } catch (error) {
      throw new InternalError(
        "Failed to upload file",
        error,
        ErrorCodes.FILE_UPLOAD_FAILED,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      throw new InternalError("Failed to delete file", error);
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const stream = response.Body;
      if (!stream) {
        throw new InternalError(
          "Empty response body from S3",
          undefined,
          ErrorCodes.FILE_DOWNLOAD_FAILED,
        );
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of stream as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalError(
        "Failed to download file",
        error,
        ErrorCodes.FILE_DOWNLOAD_FAILED,
      );
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedPutUrl(
    key: string,
    mimeType: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getDownloadStream(key: string): Promise<Readable> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const body = response.Body;
      if (!body) {
        throw new InternalError(
          "Empty response body from S3",
          undefined,
          ErrorCodes.FILE_DOWNLOAD_FAILED,
        );
      }
      return body as Readable;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalError(
        "Failed to open download stream",
        error,
        ErrorCodes.FILE_DOWNLOAD_FAILED,
      );
    }
  }
}
