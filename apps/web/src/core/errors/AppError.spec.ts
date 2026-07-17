import { describe, expect, it } from "vitest";
import { AppError } from "./AppError";

describe("AppError", () => {
  it("captures message, code, statusCode and details on construction", () => {
    const err = new AppError("Boom", "BOOM_ERROR", 422, { field: ["bad"] });

    expect(err.message).toBe("Boom");
    expect(err.code).toBe("BOOM_ERROR");
    expect(err.statusCode).toBe(422);
    expect(err.details).toEqual({ field: ["bad"] });
    expect(err.name).toBe("AppError");
  });

  it("defaults to UNKNOWN_ERROR / 500 when only the message is provided", () => {
    const err = new AppError("Boom");

    expect(err.code).toBe("UNKNOWN_ERROR");
    expect(err.statusCode).toBe(500);
    expect(err.details).toBeUndefined();
  });

  it("is an instanceof Error so error boundaries catch it", () => {
    const err = new AppError("Boom");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("stack trace is captured", () => {
    const err = new AppError("Boom");
    expect(err.stack).toBeTruthy();
    expect(err.stack).toContain("AppError");
  });
});
