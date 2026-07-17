import { describe, expect, it } from "vitest";
import { getInitials, stripHtml } from "./string";

describe("getInitials", () => {
  it("returns up to two uppercase initials from the first two words", () => {
    expect(getInitials("Maria Silva")).toBe("MS");
    expect(getInitials("João Pedro Souza")).toBe("JP");
  });

  it("uppercases lowercase input", () => {
    expect(getInitials("maria silva")).toBe("MS");
  });

  it("handles a single-word name by returning a single initial", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("ignores extra whitespace", () => {
    expect(getInitials("  Ana   Paula  ")).toBe("AP");
  });

  it("returns an empty string for empty input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });
});

describe("stripHtml", () => {
  it("removes all HTML tags and trims whitespace", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
    expect(stripHtml("<div><span>nested</span></div>")).toBe("nested");
  });

  it("leaves text without tags unchanged (after trim)", () => {
    expect(stripHtml("plain text")).toBe("plain text");
    expect(stripHtml("  spaced  ")).toBe("spaced");
  });

  it("strips self-closing and void tags", () => {
    expect(stripHtml("a<br>b<hr/>c")).toBe("abc");
  });
});
