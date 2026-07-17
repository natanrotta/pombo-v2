import { IStorageProvider } from "@shared/provider/storage-provider.interface";
import { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { extractS3Key } from "./extract-s3-key";

export async function safeS3Delete(
  url: string,
  storageProvider: IStorageProvider,
  logger: ILoggerProvider,
  context: Record<string, unknown> = {},
): Promise<void> {
  try {
    const key = extractS3Key(url);
    if (key) {
      await storageProvider.delete(key);
    }
  } catch (error) {
    logger.error(
      {
        service: "s3",
        error: error instanceof Error ? error.message : error,
        fileUrl: url,
        ...context,
      },
      "Failed to delete file from S3",
    );
  }
}

/**
 * Same idempotent semantics as `safeS3Delete`, but accepts the raw object
 * key. Use when you already hold the key (e.g. just-uploaded chunk audio
 * being cleaned up by the worker) so we can skip the URL→key extraction.
 */
export async function safeS3DeleteByKey(
  key: string,
  storageProvider: IStorageProvider,
  logger: ILoggerProvider,
  context: Record<string, unknown> = {},
): Promise<void> {
  if (!key) return;
  try {
    await storageProvider.delete(key);
  } catch (error) {
    logger.error(
      {
        service: "s3",
        error: error instanceof Error ? error.message : error,
        fileKey: key,
        ...context,
      },
      "Failed to delete file from S3",
    );
  }
}
