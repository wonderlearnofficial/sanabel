import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./languages/ar";
import en from "./languages/en";

// Get the saved language or use 'ar' as default
const savedLanguage = localStorage.getItem("language") || "ar";

// Set direction based on language
const dir = savedLanguage === "ar" ? "rtl" : "ltr";

// Save both to localStorage
localStorage.setItem("language", savedLanguage);
localStorage.setItem("dir", dir);

// Apply the direction to the document
document.documentElement.setAttribute("dir", dir);

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

export default i18n;
