import { describe, expect, it } from "vitest";
import { appendTranscriptHtml } from "./transcriptHtml";

describe("appendTranscriptHtml", () => {
  it("returns wrapped HTML when existing is null, undefined or empty", () => {
    expect(appendTranscriptHtml(null, "Hello")).toBe("<p>Hello</p>");
    expect(appendTranscriptHtml(undefined, "Hello")).toBe("<p>Hello</p>");
    expect(appendTranscriptHtml("", "Hi")).toBe("<p>Hi</p>");
    expect(appendTranscriptHtml("   ", "Hi")).toBe("<p>Hi</p>");
  });

  it("appends a wrapped chunk when existing already contains HTML tags", () => {
    expect(appendTranscriptHtml("<p>Old</p>", "New chunk")).toBe("<p>Old</p><p>New chunk</p>");
  });

  it("falls back to space-concatenation when existing is legacy plain text", () => {
    expect(appendTranscriptHtml("Old plain text", "New chunk")).toBe("Old plain text New chunk");
  });

  it("escapes HTML-significant characters in the appended chunk", () => {
    expect(appendTranscriptHtml("<p>Old</p>", "a & b < c")).toBe(
      "<p>Old</p><p>a &amp; b &lt; c</p>"
    );
  });

  it("splits the new text on double newlines into separate paragraphs", () => {
    expect(appendTranscriptHtml(null, "First.\n\nSecond.")).toBe("<p>First.</p><p>Second.</p>");
  });
});
