import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./languages/ar";
import en from "./languages/en";
import { localStore } from "./utils/safeStorage";

// Get the saved language or use 'ar' as default
const requestedLanguage = localStore.getItem("language");
const savedLanguage = requestedLanguage === "en" ? "en" : "ar";

const applyLanguageDirection = (language: string) => {
  const normalizedLanguage = language.startsWith("en") ? "en" : "ar";
  const direction = normalizedLanguage === "ar" ? "rtl" : "ltr";
  localStore.setItem("language", normalizedLanguage);
  localStore.setItem("dir", direction);
  document.documentElement.setAttribute("lang", normalizedLanguage);
  document.documentElement.setAttribute("dir", direction);
};

applyLanguageDirection(savedLanguage);

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    ar,
    en,
  },
  lng: savedLanguage,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

// Keep direction and persisted language synchronized no matter which screen
// initiates the language change. Components using useTranslation rerender from
// the same event, so switching Arabic/English never requires a reload.
i18n.on("languageChanged", applyLanguageDirection);

export default i18n;
