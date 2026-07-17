import { describe, expect, it } from "vitest";
import { formatPrice, formatMonetary, unformatMonetary } from "./monetary";

describe("unformatMonetary", () => {
  it("strips every non-digit character", () => {
    expect(unformatMonetary("R$ 1.234,56")).toBe("123456");
    expect(unformatMonetary("100")).toBe("100");
  });

  it("returns an empty string when no digits are present", () => {
    expect(unformatMonetary("R$ ,.")).toBe("");
  });
});

describe("formatMonetary", () => {
  it("renders cents-as-string into a locale-formatted decimal", () => {
    // 12345 cents = 123.45 → "123,45" pt-BR or "123.45" en
    const result = formatMonetary("12345");
    expect(result).toMatch(/^123[.,]45$/);
  });

  it("returns an empty string when no digits are provided", () => {
    expect(formatMonetary("")).toBe("");
    expect(formatMonetary("R$,.")).toBe("");
  });

  it("round-trips a previously-formatted value (digits-only path)", () => {
    // 12.345,67 → strip non-digits → "1234567" → /100 = 12345.67
    // → formatted back to a locale-aware decimal.
    expect(formatMonetary("12.345,67")).toMatch(/^12[.,]345[.,]67$/);
  });
});

describe("formatPrice", () => {
  it("formats USD prices with the dollar sign in en-US", () => {
    const result = formatPrice(39_00, "USD", "en-US");
    expect(result).toMatch(/^\$39$/);
  });

  it("formats USD prices in pt-BR with the localised symbol", () => {
    // pt-BR renders USD as "US$" (some Node versions use NBSP between symbol and number).
    const result = formatPrice(39_000, "USD", "pt-BR");
    expect(result).toMatch(/^US\$\s?390$/);
  });

  it("falls back to BRL when callers explicitly opt in", () => {
    const result = formatPrice(2_028_00, "BRL", "pt-BR");
    expect(result).toMatch(/^R\$\s?2\.028$/);
  });
});
