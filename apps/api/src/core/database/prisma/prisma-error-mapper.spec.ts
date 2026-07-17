import {
  ConflictError,
  NotFoundError,
  InternalError,
  ValidationError,
} from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const { MockKnownError, MockValidationError } = vi.hoisted(() => {
  class MockKnownError extends Error {
    code: string;
    meta?: Record<string, unknown>;
    constructor(message: string, code: string, meta?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.meta = meta;
    }
  }
  class MockValidationError extends Error {}
  return { MockKnownError, MockValidationError };
});

vi.mock("@generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: MockKnownError,
    PrismaClientValidationError: MockValidationError,
  },
}));

import { mapPrismaError } from "./prisma-error-mapper";

describe("mapPrismaError", () => {
  it("should map P2002 to ConflictError with target fields", () => {
    const result = mapPrismaError(
      new MockKnownError("uc", "P2002", { target: ["email"] }),
    );
    expect(result).toBeInstanceOf(ConflictError);
    expect(result.details).toEqual({ fields: ["email"] });
  });

  it("should map P2025 to NotFoundError", () => {
    expect(mapPrismaError(new MockKnownError("nf", "P2025"))).toBeInstanceOf(
      NotFoundError,
    );
  });

  it("should map P2003 to ConflictError", () => {
    const result = mapPrismaError(new MockKnownError("fk", "P2003"));
    expect(result).toBeInstanceOf(ConflictError);
    expect(result.message).toBe("Foreign key constraint violation");
  });

  it("should map P2014 to ConflictError", () => {
    expect(mapPrismaError(new MockKnownError("rel", "P2014")).message).toBe(
      "Relation violation",
    );
  });

  it("should map unknown Prisma code to InternalError", () => {
    const result = mapPrismaError(new MockKnownError("x", "P9999"));
    expect(result).toBeInstanceOf(InternalError);
    expect(result.details).toEqual({ code: "P9999" });
  });

  it("should map PrismaClientValidationError to InternalError", () => {
    expect(mapPrismaError(new MockValidationError("bad"))).toBeInstanceOf(
      InternalError,
    );
  });

  it("should map unknown error to InternalError", () => {
    expect(mapPrismaError(new Error("oops"))).toBeInstanceOf(InternalError);
  });

  it("should handle non-Error values", () => {
    expect(mapPrismaError("string")).toBeInstanceOf(InternalError);
  });

  it("should pass through AppError subclasses unchanged (no re-wrapping)", () => {
    // Domain / application code wraps work in `try { } catch (e) { throw
    // mapPrismaError(e); }`. When the inner code throws a domain error
    // (e.g. PhoneReplacementService → ValidationError(INVALID_PHONE)),
    // re-wrapping as InternalError would hide it as a generic 500 and
    // strip the user-facing code. The mapper must let our own AppErrors
    // through unchanged.
    const original = new ValidationError(
      "Invalid phone number",
      undefined,
      ErrorCodes.INVALID_PHONE,
    );
    const mapped = mapPrismaError(original);
    expect(mapped).toBe(original);
    expect(mapped.code).toBe(ErrorCodes.INVALID_PHONE);
    expect(mapped.statusCode).toBe(422);
  });
});
