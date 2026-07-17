import { describe, expect, it } from "vitest";
import { formatDocument, formatDocumentDisplay, unformatDocument } from "./document";

describe("unformatDocument", () => {
  it("strips every non-digit character", () => {
    expect(unformatDocument("123.456.789-09")).toBe("12345678909");
    expect(unformatDocument("12.345.678/0001-99")).toBe("12345678000199");
    expect(unformatDocument(" 123-abc-456 ")).toBe("123456");
  });

  it("returns an empty string when no digits are present", () => {
    expect(unformatDocument("abc.def-ghi")).toBe("");
  });
});

describe("formatDocument", () => {
  it("formats an 11-digit string as CPF", () => {
    expect(formatDocument("12345678909")).toBe("123.456.789-09");
  });

  it("formats a 14-digit string as CNPJ", () => {
    expect(formatDocument("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("returns the raw digits when input exceeds CNPJ length", () => {
    expect(formatDocument("123456789001990")).toBe("123456789001990");
  });

  it("strips existing formatting before reapplying the mask", () => {
    expect(formatDocument("123.456.789-09")).toBe("123.456.789-09");
    expect(formatDocument("12.345.678/0001-99")).toBe("12.345.678/0001-99");
  });

  it("applies a progressive CPF mask while the user is typing", () => {
    expect(formatDocument("123")).toBe("123");
    expect(formatDocument("1234")).toBe("123.4");
    expect(formatDocument("1234567")).toBe("123.456.7");
    expect(formatDocument("123456789")).toBe("123.456.789");
  });
});

describe("formatDocumentDisplay", () => {
  it("formats only fully-typed CPF or CNPJ values, leaving partial input untouched", () => {
    expect(formatDocumentDisplay("12345678909")).toBe("123.456.789-09");
    expect(formatDocumentDisplay("12345678000199")).toBe("12.345.678/0001-99");
    expect(formatDocumentDisplay("12345")).toBe("12345");
  });

  it("returns an empty string for empty input", () => {
    expect(formatDocumentDisplay("")).toBe("");
  });
});
