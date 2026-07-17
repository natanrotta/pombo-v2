import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pt, type Dictionary } from "@/locales/pt";
import { en } from "@/locales/en";
import { es } from "@/locales/es";

export type Locale = "pt" | "en" | "es";

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en, es };

const STORAGE_KEY = "boilerplate.locale";

const detectInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "pt" || saved === "en" || saved === "es") return saved;
  const nav = window.navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  return "en";
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: <T = string>(key: string) => T;
  dict: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const dict = DICTIONARIES[locale];
    const t = <T = string,>(key: string): T => {
      const parts = key.split(".");
      let cursor: unknown = dict;
      for (const p of parts) {
        if (cursor && typeof cursor === "object" && p in (cursor as object)) {
          cursor = (cursor as Record<string, unknown>)[p];
        } else {
          if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
          return key as unknown as T;
        }
      }
      return cursor as T;
    };
    return { locale, setLocale: setLocaleState, t, dict };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
};
