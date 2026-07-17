import { describe, expect, it } from "vitest";
import { maskPhoneBr, formatPhoneDisplay, unformatPhone } from "./phone";

describe("unformatPhone", () => {
  it("strips every non-digit character", () => {
    expect(unformatPhone("(11) 98765-4321")).toBe("11987654321");
    expect(unformatPhone("+55 11 98765-4321")).toBe("5511987654321");
  });
});

describe("maskPhoneBr", () => {
  it("formats an 11-digit Brazilian mobile as (XX) XXXXX-XXXX", () => {
    expect(maskPhoneBr("11987654321")).toBe("(11) 98765-4321");
  });

  it("formats a 10-digit Brazilian landline as (XX) XXXX-XXXX", () => {
    expect(maskPhoneBr("1133334444")).toBe("(11) 3333-4444");
  });

  it("prefixes with +55 when the country code is part of the input", () => {
    expect(maskPhoneBr("5511987654321")).toBe("+55 (11) 98765-4321");
  });

  it("returns raw digits when length exceeds Brazilian-mobile range", () => {
    expect(maskPhoneBr("123456789012345")).toBe("123456789012345");
  });

  it("applies a progressive mask while the user is typing", () => {
    expect(maskPhoneBr("1")).toBe("1");
    expect(maskPhoneBr("11")).toBe("11");
    expect(maskPhoneBr("119")).toBe("(11) 9");
    expect(maskPhoneBr("11987")).toBe("(11) 987");
    expect(maskPhoneBr("1198765")).toBe("(11) 9876-5");
  });
});

describe("formatPhoneDisplay", () => {
  it("only reformats fully-typed numbers", () => {
    expect(formatPhoneDisplay("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhoneDisplay("1133334444")).toBe("(11) 3333-4444");
    expect(formatPhoneDisplay("119")).toBe("119");
  });

  it("returns an empty string for empty input", () => {
    expect(formatPhoneDisplay("")).toBe("");
  });
});
