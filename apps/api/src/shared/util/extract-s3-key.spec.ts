import { extractS3Key } from "./extract-s3-key";

describe("extractS3Key", () => {
  it("should extract key from standard S3 URL", () => {
    const url = "https://my-bucket.s3.amazonaws.com/uploads/photo.jpg";
    expect(extractS3Key(url)).toBe("uploads/photo.jpg");
  });

  it("should extract key from regional S3 URL", () => {
    const url = "https://my-bucket.s3.us-east-1.amazonaws.com/files/doc.pdf";
    expect(extractS3Key(url)).toBe("files/doc.pdf");
  });

  it("should extract key with nested path", () => {
    const url = "https://bucket.s3.amazonaws.com/a/b/c/file.png";
    expect(extractS3Key(url)).toBe("a/b/c/file.png");
  });

  it("should return null for empty pathname (root only)", () => {
    const url = "https://bucket.s3.amazonaws.com/";
    expect(extractS3Key(url)).toBeNull();
  });

  it("should return null for invalid URL", () => {
    expect(extractS3Key("not-a-url")).toBeNull();
  });

  it("should handle keys with special characters", () => {
    const url = "https://bucket.s3.amazonaws.com/path/file%20name%20(1).jpg";
    expect(extractS3Key(url)).toBe("path/file%20name%20(1).jpg");
  });

  it("should handle simple key without nested path", () => {
    const url = "https://bucket.s3.amazonaws.com/avatar.png";
    expect(extractS3Key(url)).toBe("avatar.png");
  });
});
