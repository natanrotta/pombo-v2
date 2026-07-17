import { describe, expect, it } from "vitest";
import { isPasswordStrong } from "./passwordValidation";

describe("isPasswordStrong", () => {
  it("accepts a password that meets all 5 rules", () => {
    expect(isPasswordStrong("Aa1!aaaa")).toBe(true);
    expect(isPasswordStrong("StrongPass1@")).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(isPasswordStrong("Aa1!aaa")).toBe(false);
  });

  it("rejects passwords without an uppercase letter", () => {
    expect(isPasswordStrong("aa1!aaaa")).toBe(false);
  });

  it("rejects passwords without a lowercase letter", () => {
    expect(isPasswordStrong("AA1!AAAA")).toBe(false);
  });

  it("rejects passwords without a digit", () => {
    expect(isPasswordStrong("Aa!aaaaa")).toBe(false);
  });

  it("rejects passwords without a special character", () => {
    expect(isPasswordStrong("Aa1aaaaa")).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(isPasswordStrong("")).toBe(false);
  });
});
