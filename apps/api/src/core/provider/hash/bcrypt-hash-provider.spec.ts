import "reflect-metadata";
import { BcryptHashProvider } from "./bcrypt-hash-provider";

describe("BcryptHashProvider", () => {
  const sut = new BcryptHashProvider();

  it("should hash a plain string into a different value", async () => {
    const hashed = await sut.hash("my-password");

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe("my-password");
    expect(hashed.length).toBeGreaterThan(0);
  });

  it("should return true when comparing matching plain and hash", async () => {
    const plain = "secret123";
    const hashed = await sut.hash(plain);

    const result = await sut.compare(plain, hashed);

    expect(result).toBe(true);
  });

  it("should return false when comparing non-matching plain and hash", async () => {
    const hashed = await sut.hash("correct-password");

    const result = await sut.compare("wrong-password", hashed);

    expect(result).toBe(false);
  });

  it("should produce different hashes for the same input (salted)", async () => {
    const hash1 = await sut.hash("same-password");
    const hash2 = await sut.hash("same-password");

    expect(hash1).not.toBe(hash2);
  });
});
