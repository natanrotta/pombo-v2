import "reflect-metadata";

vi.mock("../../config", () => ({
  env: {
    JWT_SECRET: "test-secret-key-for-vitest",
    JWT_EXPIRES_IN: "15m",
    REFRESH_TOKEN_EXPIRES_IN: "7d",
  },
}));

import jwt from "jsonwebtoken";
import { JsonWebTokenJwtProvider } from "./jsonwebtoken-jwt-provider";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("JsonWebTokenJwtProvider", () => {
  const sut = new JsonWebTokenJwtProvider();
  const payload = {
    userId: "user-1",
    tokenVersion: 0,
  };

  it("should sign and return a JWT string", () => {
    const token = sut.sign(payload);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should verify a valid token and return the correct payload", () => {
    const token = sut.sign(payload);
    const decoded = sut.verify(token);

    expect(decoded).toEqual(payload);
  });

  it("should throw AUTH_TOKEN_INVALID for tampered token", () => {
    const token = sut.sign(payload);
    const tampered = token + "x";

    expect(() => sut.verify(tampered)).toThrow(UnauthorizedError);
    try {
      sut.verify(tampered);
    } catch (error) {
      expect((error as UnauthorizedError).code).toBe(
        ErrorCodes.AUTH_TOKEN_INVALID,
      );
    }
  });

  it("should throw AUTH_TOKEN_INVALID for garbage string", () => {
    expect(() => sut.verify("not.a.token")).toThrow(UnauthorizedError);
  });

  it("should reject tokens signed with a non-HS256 algorithm", () => {
    const forged = jwt.sign(payload, "test-secret-key-for-vitest", {
      algorithm: "HS384",
    });

    expect(() => sut.verify(forged)).toThrow(UnauthorizedError);
    try {
      sut.verify(forged);
    } catch (error) {
      expect((error as UnauthorizedError).code).toBe(
        ErrorCodes.AUTH_TOKEN_INVALID,
      );
    }
  });

  it("should generate a UUID refresh token", () => {
    const refresh = sut.generateRefreshToken();

    expect(typeof refresh).toBe("string");
    expect(refresh).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("should generate unique refresh tokens", () => {
    const t1 = sut.generateRefreshToken();
    const t2 = sut.generateRefreshToken();

    expect(t1).not.toBe(t2);
  });

  describe("hashRefreshToken", () => {
    it("should return a 64-char hex SHA-256 digest", () => {
      const hash = sut.hashRefreshToken("any-raw-token");

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should be deterministic — same input yields same hash", () => {
      const raw = sut.generateRefreshToken();

      expect(sut.hashRefreshToken(raw)).toBe(sut.hashRefreshToken(raw));
    });

    it("should differ from the raw input (hash != plaintext)", () => {
      const raw = sut.generateRefreshToken();

      expect(sut.hashRefreshToken(raw)).not.toBe(raw);
    });

    it("should produce different hashes for different inputs", () => {
      expect(sut.hashRefreshToken("token-a")).not.toBe(
        sut.hashRefreshToken("token-b"),
      );
    });
  });

  it("should generate a complete token pair", () => {
    const result = sut.generateTokenPair(payload);

    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.tokenExpiresAt).toBeInstanceOf(Date);
    expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
  });

  it("should have tokenExpiresAt in the future", () => {
    const result = sut.generateTokenPair(payload);

    expect(result.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(result.refreshTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should have refreshTokenExpiresAt further in the future than tokenExpiresAt", () => {
    const result = sut.generateTokenPair(payload);

    expect(result.refreshTokenExpiresAt.getTime()).toBeGreaterThan(
      result.tokenExpiresAt.getTime(),
    );
  });
});
