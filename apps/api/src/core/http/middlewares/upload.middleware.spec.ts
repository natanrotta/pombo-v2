import { BadRequestError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

// We can't easily test the multer middleware as a whole, but we can extract
// and test the file filter logic by intercepting multer calls.

const { mockMulter } = vi.hoisted(() => {
  const single = vi.fn().mockReturnValue(vi.fn());
  const array = vi.fn().mockReturnValue(vi.fn());
  const mockMulter = vi.fn().mockReturnValue({ single, array });
  (mockMulter as any).memoryStorage = vi.fn().mockReturnValue({});
  return { mockMulter };
});

vi.mock("multer", () => ({ default: mockMulter }));

describe("upload.middleware", () => {
  type FileFilterFn = (
    req: object,
    file: Express.Multer.File,
    cb: (err: Error | null, accepted?: boolean) => void,
  ) => void;
  let multerCalls: Array<{
    fileFilter: FileFilterFn;
    limits: { fileSize: number };
  }>;

  beforeAll(async () => {
    await import("./upload.middleware.js");
    multerCalls = mockMulter.mock.calls.map((call: any[]) => call[0]);
  });

  function callFilter(
    filter: FileFilterFn,
    mimetype: string,
    originalname = "upload.bin",
  ): Promise<{ error: Error | null; accepted: boolean }> {
    return new Promise((resolve) => {
      const req = {};
      const file = { mimetype, originalname } as Express.Multer.File;
      filter(req, file, (err: Error | null, accepted?: boolean) => {
        resolve({ error: err, accepted: accepted ?? false });
      });
    });
  }

  describe("imageFilter (uploadImage)", () => {
    it("should accept image/png", async () => {
      const { error, accepted } = await callFilter(
        multerCalls[0]!.fileFilter,
        "image/png",
      );
      expect(error).toBeNull();
      expect(accepted).toBe(true);
    });

    it("should accept image/webp", async () => {
      const { error, accepted } = await callFilter(
        multerCalls[0]!.fileFilter,
        "image/webp",
      );
      expect(error).toBeNull();
      expect(accepted).toBe(true);
    });

    it("should reject audio/mpeg", async () => {
      const { error } = await callFilter(
        multerCalls[0]!.fileFilter,
        "audio/mpeg",
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(
        ErrorCodes.FILE_INVALID_TYPE,
      );
    });

    it("should have 5MB file size limit", () => {
      expect(multerCalls[0]!.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });
});
