import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("escapes the ampersand first so it is not double-encoded", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("escapes double quotes (attribute breakout)", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("neutralizes a script tag", () => {
    expect(escapeHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert('x')&lt;/script&gt;",
    );
  });

  it("escapes all four meta-characters in a single pass", () => {
    expect(escapeHtml(`<a href="?a=1&b=2">`)).toBe(
      "&lt;a href=&quot;?a=1&amp;b=2&quot;&gt;",
    );
  });

  it("leaves single quotes and other characters untouched", () => {
    expect(escapeHtml("O'Brien — café 100%")).toBe("O'Brien — café 100%");
  });

  it("returns an empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("orders replacements so a literal entity gets its ampersand escaped", () => {
    // `&amp;` already-escaped input is re-escaped to `&amp;amp;` — documents
    // that escapeHtml is NOT idempotent (callers must escape raw text once).
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });
});
