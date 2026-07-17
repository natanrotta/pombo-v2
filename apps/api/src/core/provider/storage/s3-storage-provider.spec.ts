import "reflect-metadata";

const { mockSend, mockGetSignedUrl } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn((input: any) => ({
    __type: "PutObjectCommand",
    ...input,
  })),
  DeleteObjectCommand: vi.fn((input: any) => ({
    __type: "DeleteObjectCommand",
    ...input,
  })),
  GetObjectCommand: vi.fn((input: any) => ({
    __type: "GetObjectCommand",
    ...input,
  })),
  HeadBucketCommand: vi.fn((input: any) => ({
    __type: "HeadBucketCommand",
    ...input,
  })),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock("@core/http/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../config", () => ({
  env: {
    AWS_S3_BUCKET: "test-bucket",
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "test-key",
    AWS_SECRET_ACCESS_KEY: "test-secret",
  },
}));

import { S3StorageProvider } from "./s3-storage-provider";
import { InternalError } from "@shared/error";
import { env } from "../../config";
import { logger } from "@core/http/logger";

const mutableEnv = env as unknown as {
  AWS_S3_BUCKET: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
};

describe("S3StorageProvider", () => {
  let sut: S3StorageProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mutableEnv.AWS_S3_BUCKET = "test-bucket";
    mutableEnv.AWS_ACCESS_KEY_ID = "test-key";
    mutableEnv.AWS_SECRET_ACCESS_KEY = "test-secret";
    sut = new S3StorageProvider();
  });

  describe("upload", () => {
    it("should send PutObjectCommand and return URL + key", async () => {
      mockSend.mockResolvedValue({});

      const result = await sut.upload(
        Buffer.from("data"),
        "uploads/file.jpg",
        "image/jpeg",
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "uploads/file.jpg",
          ContentType: "image/jpeg",
        }),
      );
      expect(result).toEqual({
        url: "https://test-bucket.s3.amazonaws.com/uploads/file.jpg",
        key: "uploads/file.jpg",
      });
    });

    it("should throw InternalError on S3 failure", async () => {
      mockSend.mockRejectedValue(new Error("S3 error"));

      await expect(
        sut.upload(Buffer.from("data"), "key", "image/png"),
      ).rejects.toThrow(InternalError);
    });
  });

  describe("delete", () => {
    it("should send DeleteObjectCommand", async () => {
      mockSend.mockResolvedValue({});

      await sut.delete("uploads/file.jpg");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "uploads/file.jpg",
        }),
      );
    });

    it("should throw InternalError on S3 failure", async () => {
      mockSend.mockRejectedValue(new Error("S3 error"));

      await expect(sut.delete("key")).rejects.toThrow(InternalError);
    });
  });

  describe("getSignedUrl", () => {
    it("should call the presigner and return signed URL", async () => {
      mockGetSignedUrl.mockResolvedValue("https://signed-url.com/file");

      const url = await sut.getSignedUrl("uploads/file.jpg");

      expect(url).toBe("https://signed-url.com/file");
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "uploads/file.jpg",
        }),
        { expiresIn: 3600 },
      );
    });

    it("should accept custom expiry", async () => {
      mockGetSignedUrl.mockResolvedValue("https://signed-url.com/file");

      await sut.getSignedUrl("key", 600);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        {
          expiresIn: 600,
        },
      );
    });
  });

  describe("getPresignedPutUrl", () => {
    it("signs a PutObjectCommand with the requested mime type", async () => {
      mockGetSignedUrl.mockResolvedValue("https://signed-url.com/put");

      const url = await sut.getPresignedPutUrl(
        "imports/acc-1/job-1.csv",
        "text/csv",
        900,
      );

      expect(url).toBe("https://signed-url.com/put");
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          __type: "PutObjectCommand",
          Bucket: "test-bucket",
          Key: "imports/acc-1/job-1.csv",
          ContentType: "text/csv",
        }),
        { expiresIn: 900 },
      );
    });
  });

  describe("checkHealth", () => {
    it("returns configured+reachable when HeadBucket succeeds", async () => {
      mockSend.mockResolvedValue({});

      const result = await sut.checkHealth();

      expect(result).toEqual({ configured: true, reachable: true });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: "HeadBucketCommand",
          Bucket: "test-bucket",
        }),
        expect.objectContaining({ abortSignal: expect.anything() }),
      );
    });

    it("returns configured+unreachable (never throws) when HeadBucket fails", async () => {
      mockSend.mockRejectedValue(new Error("timeout"));

      const result = await sut.checkHealth();

      expect(result).toEqual({ configured: true, reachable: false });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("returns not configured (no probe) when the bucket is unset", async () => {
      mutableEnv.AWS_S3_BUCKET = "";
      const result = await new S3StorageProvider().checkHealth();

      expect(result).toEqual({ configured: false, reachable: false });
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("getDownloadStream", () => {
    it("returns the S3 response body as a readable stream", async () => {
      const fakeStream = { on: vi.fn(), pipe: vi.fn() };
      mockSend.mockResolvedValue({ Body: fakeStream });

      const result = await sut.getDownloadStream("imports/acc-1/job-1.csv");

      expect(result).toBe(fakeStream);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "imports/acc-1/job-1.csv",
        }),
      );
    });

    it("throws InternalError when the body is missing", async () => {
      mockSend.mockResolvedValue({ Body: undefined });

      await expect(sut.getDownloadStream("k")).rejects.toThrow(InternalError);
    });

    it("throws InternalError on S3 failure", async () => {
      mockSend.mockRejectedValue(new Error("S3 error"));

      await expect(sut.getDownloadStream("k")).rejects.toThrow(InternalError);
    });
  });
});
