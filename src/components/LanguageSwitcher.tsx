import React from "react";
import { useState } from "react";
import { TbWorld } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { localStore } from "../utils/safeStorage";
const LanguageSwitcher: React.FC = () => {
  const [changeLanguageMenu, setChangeLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("");

  useEffect(() => {
    // Set the initial language label based on localStorage value
    const savedLanguage = localStore.getItem("language") || "ar";
    setCurrentLanguage(savedLanguage === "ar" ? "العربية" : "English");
  }, []);

  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: "ar" | "en") => {
    void i18n.changeLanguage(lang);

    // Set the displayed language name
    setCurrentLanguage(lang === "ar" ? "العربية" : "English");

    // Toggle the language menu visibility
    setChangeLanguageMenu(!changeLanguageMenu);
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 p-3 px-5 border-2 rounded-3xl ">
      <button
        type="button"
        className="min-h-11 gap-2 flex-center"
        onClick={() => setChangeLanguageMenu(!changeLanguageMenu)}
      >
        <TbWorld className="text-2xl text-blueprimary" />
        <h1 className="text-blueprimary">
          {currentLanguage !== ""
            ? `${currentLanguage}`
            : `${t("تغيير اللغة")}`}
        </h1>
      </button>

      <div className="absolute w-full top-14 ">
        {changeLanguageMenu && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => changeLanguage("ar")}
              className="min-h-11 p-1 text-center text-white bg-blueprimary rounded-2xl"
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => changeLanguage("en")}
              className="min-h-11 p-1 text-center text-white bg-blueprimary rounded-2xl"
            >
              English
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
