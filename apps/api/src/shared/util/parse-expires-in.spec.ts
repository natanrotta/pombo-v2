import { parseExpiresIn } from "./parse-expires-in";

describe("parseExpiresIn", () => {
  it('should parse seconds — "30s" → 30000', () => {
    expect(parseExpiresIn("30s")).toBe(30_000);
  });

  it('should parse minutes — "5m" → 300000', () => {
    expect(parseExpiresIn("5m")).toBe(300_000);
  });

  it('should parse hours — "2h" → 7200000', () => {
    expect(parseExpiresIn("2h")).toBe(3_600_000 * 2);
  });

  it('should parse days — "7d" → 604800000', () => {
    expect(parseExpiresIn("7d")).toBe(604_800_000);
  });

  it('should parse weeks — "1w" → 604800000', () => {
    expect(parseExpiresIn("1w")).toBe(604_800_000);
  });

  it('should handle large numbers — "999d"', () => {
    expect(parseExpiresIn("999d")).toBe(999 * 86_400_000);
  });

  it("should return default (7 days) for invalid format", () => {
    const sevenDays = 7 * 86_400_000;

    expect(parseExpiresIn("abc")).toBe(sevenDays);
    expect(parseExpiresIn("10x")).toBe(sevenDays);
    expect(parseExpiresIn("")).toBe(sevenDays);
    expect(parseExpiresIn("m5")).toBe(sevenDays);
    expect(parseExpiresIn("5")).toBe(sevenDays);
  });

  it('should parse "1s" as 1000ms', () => {
    expect(parseExpiresIn("1s")).toBe(1_000);
  });
});
