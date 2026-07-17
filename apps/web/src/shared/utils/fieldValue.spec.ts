import { describe, expect, it } from "vitest";
import { coerceFieldValue } from "./fieldValue";

describe("coerceFieldValue", () => {
  it("returns strings as-is", () => {
    expect(coerceFieldValue("hello")).toBe("hello");
    expect(coerceFieldValue("")).toBe("");
  });

  it("returns an empty string for null and undefined", () => {
    expect(coerceFieldValue(null)).toBe("");
    expect(coerceFieldValue(undefined)).toBe("");
  });

  it("JSON-serializes non-string scalars and structures", () => {
    expect(coerceFieldValue(42)).toBe("42");
    expect(coerceFieldValue(true)).toBe("true");
    expect(coerceFieldValue(["a", "b"])).toBe('["a","b"]');
    expect(coerceFieldValue({ key: "value" })).toBe('{"key":"value"}');
  });
});
