import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { AesGcmEncryptionService } from "./aes-gcm-encryption.service";

const key = randomBytes(32);
const sut = new AesGcmEncryptionService({ key });

describe("AesGcmEncryptionService", () => {
  it("round-trip: encrypt then decrypt recovers the plaintext", () => {
    const plaintext = "birdid.access-token.example";
    const ciphertext = sut.encrypt(plaintext);
    expect(ciphertext).not.toContain(plaintext);
    expect(sut.decrypt(ciphertext)).toBe(plaintext);
  });

  it("encrypting the same plaintext twice produces different ciphertexts (random IV)", () => {
    const plaintext = "same-input";
    const a = sut.encrypt(plaintext);
    const b = sut.encrypt(plaintext);
    expect(a).not.toBe(b);
    expect(sut.decrypt(a)).toBe(plaintext);
    expect(sut.decrypt(b)).toBe(plaintext);
  });

  it("decrypting a tampered ciphertext throws (auth tag mismatch)", () => {
    const ciphertext = sut.encrypt("payload");
    const tampered = Buffer.from(ciphertext, "base64");
    // Flip the last byte of ciphertext (after iv+tag).
    const last = tampered.length - 1;
    tampered[last] = (tampered[last]! ^ 0x01) & 0xff;
    expect(() => sut.decrypt(tampered.toString("base64"))).toThrow();
  });

  it("rejects keys with the wrong length at construction time", () => {
    expect(() => new AesGcmEncryptionService({ key: randomBytes(16) })).toThrow(
      /must be 32 bytes/i,
    );
  });

  it("rejects malformed payloads (too short to contain iv+tag)", () => {
    expect(() =>
      sut.decrypt(Buffer.from([1, 2, 3]).toString("base64")),
    ).toThrow();
  });
});
