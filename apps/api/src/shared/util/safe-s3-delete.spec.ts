import { safeS3Delete } from "./safe-s3-delete";

describe("safeS3Delete", () => {
  const mockStorage = {
    checkHealth: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    getSignedUrl: vi.fn(),
    getBuffer: vi.fn(),
    getPresignedPutUrl: vi.fn(),
    getDownloadStream: vi.fn(),
  };
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract key and call storageProvider.delete", async () => {
    mockStorage.delete.mockResolvedValue(undefined);

    await safeS3Delete(
      "https://bucket.s3.amazonaws.com/uploads/file.jpg",
      mockStorage,
      mockLogger,
    );

    expect(mockStorage.delete).toHaveBeenCalledWith("uploads/file.jpg");
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should not call delete for invalid URL", async () => {
    await safeS3Delete("not-a-url", mockStorage, mockLogger);

    expect(mockStorage.delete).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should log error and not throw when delete fails", async () => {
    mockStorage.delete.mockRejectedValue(new Error("S3 error"));

    await safeS3Delete(
      "https://bucket.s3.amazonaws.com/file.jpg",
      mockStorage,
      mockLogger,
      {
        entityId: "123",
      },
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        fileUrl: "https://bucket.s3.amazonaws.com/file.jpg",
        entityId: "123",
      }),
      "Failed to delete file from S3",
    );
  });

  it("should pass extra context to logger", async () => {
    mockStorage.delete.mockRejectedValue(new Error("fail"));

    await safeS3Delete(
      "https://bucket.s3.amazonaws.com/x.jpg",
      mockStorage,
      mockLogger,
      {
        agentId: "a1",
        knowledgeId: "k1",
      },
    );

    const loggedContext = mockLogger.error.mock.calls[0]![0];
    expect(loggedContext.agentId).toBe("a1");
    expect(loggedContext.knowledgeId).toBe("k1");
  });
});
