import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pt from "./locales/pt";
import en from "./locales/en";
import es from "./locales/es";

export type Lang = "pt" | "en" | "es";
export const SUPPORTED: Lang[] = ["pt", "en", "es"];
const STORAGE_KEY = "csn_lang";

function initialLang(): Lang {
  if (typeof window === "undefined") return "pt";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && SUPPORTED.includes(saved)) return saved;
  return "pt"; // default; geo detection runs after mount
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    lng: initialLang(),
    fallbackLng: "pt",
    interpolation: { escapeValue: false },
    returnObjects: true,
  });
}

export function changeLang(lang: Lang, persist = true) {
  if (!SUPPORTED.includes(lang)) return;
  i18n.changeLanguage(lang);
  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  }
}

export function hasUserChosen(): boolean {
  if (typeof window === "undefined") return true;
  return !!window.localStorage.getItem(STORAGE_KEY);
}

export default i18n;
