import type { Readable } from "node:stream";
import type { ExternalDependencyHealth } from "./health.interface";

export interface UploadResult {
  url: string;
  key: string;
}

export interface IStorageProvider {
  /**
   * Best-effort liveness probe for the admin status panel. Never throws and is
   * time-bounded: returns `{ configured: false }` when no bucket/credentials
   * are set, else performs a cheap `HeadBucket` and reports `reachable`.
   */
  checkHealth(): Promise<ExternalDependencyHealth>;
  upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getBuffer(key: string): Promise<Buffer>;
  /**
   * Presigned PUT URL the browser uploads directly to. Lets the API stay out
   * of the byte path for large files (CSV imports, future bulk attachments).
   */
  getPresignedPutUrl(
    key: string,
    mimeType: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  /**
   * Streams the object body without buffering it in memory. The import
   * orchestrator and batch worker iterate large CSVs row-by-row through this.
   */
  getDownloadStream(key: string): Promise<Readable>;
}
