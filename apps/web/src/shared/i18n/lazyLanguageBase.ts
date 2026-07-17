/** Language tags whose translation bundles are loaded on demand (pt-BR, the
 *  fallback, ships in the entry chunk and is never lazy). */
export const LAZY_LANGUAGE_BASES = ["en", "es"] as const;

export type LazyLanguageBase = (typeof LAZY_LANGUAGE_BASES)[number];

/**
 * Map a raw language tag to the lazy bundle it needs, or `null` when nothing
 * has to load (pt-BR is bundled; unknown tags fall back to pt-BR per-key).
 * `"en-US"` → `"en"`.
 *
 * Side-effect-free and i18next-free on purpose: the whole lazy-locale feature
 * hinges on resolving the DETECTED language here, so it gets isolated
 * regression coverage without booting the i18n singleton.
 */
export function resolveLazyLanguageBase(language: string | undefined): LazyLanguageBase | null {
  if (!language) return null;
  const base = (LAZY_LANGUAGE_BASES as readonly string[]).includes(language)
    ? language
    : language.split("-")[0];
  return base === "en" || base === "es" ? base : null;
}
