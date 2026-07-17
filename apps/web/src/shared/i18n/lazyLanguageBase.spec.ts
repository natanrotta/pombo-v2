import { describe, expect, it } from "vitest";
import { resolveLazyLanguageBase } from "./lazyLanguageBase";

describe("resolveLazyLanguageBase", () => {
  it("resolves an exact lazy language to its bundle", () => {
    expect(resolveLazyLanguageBase("en")).toBe("en");
    expect(resolveLazyLanguageBase("es")).toBe("es");
  });

  it("normalizes a regional tag to its base bundle (the detected-language path)", () => {
    // This is the regression guard: a real browser reports "en-US"/"es-419",
    // which must still resolve to the "en"/"es" lazy bundle. Feeding i18next's
    // resolvedLanguage (which returns "pt-BR" for these users) here would break
    // lazy loading entirely — they'd be stuck on the bundled fallback.
    expect(resolveLazyLanguageBase("en-US")).toBe("en");
    expect(resolveLazyLanguageBase("es-419")).toBe("es");
  });

  it("returns null for the bundled fallback (pt-BR) — nothing to lazy-load", () => {
    expect(resolveLazyLanguageBase("pt-BR")).toBeNull();
    expect(resolveLazyLanguageBase("pt")).toBeNull();
  });

  it("returns null for unknown languages (they fall back to pt-BR per-key)", () => {
    expect(resolveLazyLanguageBase("fr")).toBeNull();
    expect(resolveLazyLanguageBase("de-DE")).toBeNull();
    expect(resolveLazyLanguageBase("")).toBeNull();
    expect(resolveLazyLanguageBase(undefined)).toBeNull();
  });
});
