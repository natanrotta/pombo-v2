import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resolveLazyLanguageBase, type LazyLanguageBase } from "./lazyLanguageBase";

import commonPtBR from "./locales/pt-BR/common.json";
import authPtBR from "./locales/pt-BR/auth.json";
import settingsPtBR from "./locales/pt-BR/settings.json";
import dashboardPtBR from "./locales/pt-BR/dashboard.json";

const NAMESPACES = ["common", "auth", "settings", "dashboard"] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // pt-BR (the fallback language) is bundled so init stays synchronous;
    // en/es arrive later via `ensureLanguageResources` below.
    partialBundledLanguages: true,
    resources: {
      "pt-BR": {
        common: commonPtBR,
        auth: authPtBR,
        settings: settingsPtBR,
        dashboard: dashboardPtBR,
      },
    },
    fallbackLng: "pt-BR",
    supportedLngs: ["en", "pt-BR", "es"],
    ns: NAMESPACES as unknown as string[],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "@boilerplate-web:language",
      caches: ["localStorage"],
    },
  });

/**
 * Lazy language bundles: only pt-BR ships in the entry chunk; en/es load as
 * one aggregated chunk each, on demand. Cuts ~2/3 of the locale payload (66
 * JSONs → 22) from first paint for every user.
 *
 * Init above completes synchronously with pt-BR available, so while an
 * en/es bundle streams in, every `t()` lookup falls back per-key to pt-BR —
 * users see translated text (never raw keys), then the page re-renders in
 * their language when `changeLanguage` re-emits below.
 */
const LAZY_BUNDLES: Record<
  LazyLanguageBase,
  () => Promise<{ default: Record<string, object> }>
> = {
  en: () => import("./locales/en"),
  es: () => import("./locales/es"),
};
const loadedLanguages = new Set<string>();

async function ensureLanguageResources(language: string | undefined): Promise<void> {
  const base = resolveLazyLanguageBase(language);
  if (!base || loadedLanguages.has(base)) return;
  loadedLanguages.add(base); // set first so concurrent calls dedupe
  try {
    const bundle = (await LAZY_BUNDLES[base]()).default;
    for (const [namespace, resources] of Object.entries(bundle)) {
      i18n.addResourceBundle(base, namespace, resources, true, false);
    }
    // Re-emit languageChanged so already-bound components re-render with
    // the fresh bundle (the loadedLanguages guard above prevents recursion).
    if (i18n.language.startsWith(base)) {
      await i18n.changeLanguage(i18n.language);
    }
  } catch {
    loadedLanguages.delete(base); // allow a retry on the next trigger
  }
}

// Use `i18n.language` (the DETECTED/preferred language), NOT
// `i18n.resolvedLanguage` — the latter walks the fallback chain and returns
// "pt-BR" (the only bundled language) for en/es users, so `??` would never
// fire and their bundle would never load (they'd be stuck on Portuguese).
// The initial `languageChanged` already fired synchronously inside init(),
// before the listener below was attached, so this explicit call is required.
void ensureLanguageResources(i18n.language);
i18n.on("languageChanged", (language) => {
  void ensureLanguageResources(language);
});

export default i18n;
