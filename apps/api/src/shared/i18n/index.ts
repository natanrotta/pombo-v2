import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";

const i18n = i18next.createInstance();

i18n.use(Backend).init({
  fallbackLng: "pt-BR",
  supportedLngs: ["en", "pt-BR", "es"],
  ns: ["errors", "validation"],
  defaultNS: "errors",
  preload: ["en", "pt-BR", "es"],
  backend: {
    loadPath: path.join(__dirname, "locales/{{lng}}/{{ns}}.json"),
  },
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
