import React from "react";
import i18n from "i18next";
import { useState } from "react";
import { TbWorld } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
const LanguageSwitcher: React.FC = () => {
  const [changeLanguageMenu, setChangeLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("");

  useEffect(() => {
    // Set the initial language label based on localStorage value
    const savedLanguage = localStorage.getItem("language") || "ar";
    setCurrentLanguage(savedLanguage === "ar" ? "العربية" : "English");
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);

    // Save selected language to localStorage
    localStorage.setItem("language", lang);

    // Save the dir attribute in localStorage and set it dynamically
    const dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("dir", dir);
    document.documentElement.setAttribute("dir", dir);

    // Set the displayed language name
    setCurrentLanguage(lang === "ar" ? "العربية" : "English");

    // Toggle the language menu visibility
    setChangeLanguageMenu(!changeLanguageMenu);
  };

  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 p-3 px-5 border-2 rounded-3xl ">
      <div
        className="gap-2 flex-center"
        onClick={() => setChangeLanguageMenu(!changeLanguageMenu)}
      >
        <TbWorld className="text-2xl text-blueprimary" />
        <h1 className="text-blueprimary">
          {currentLanguage !== ""
            ? `${currentLanguage}`
            : `${t("تغيير اللغة")}`}
        </h1>
      </div>

      <div className="absolute w-full top-14 ">
        {changeLanguageMenu && (
          <div className="flex flex-col gap-2">
            <div
              onClick={() => changeLanguage("ar")}
              className="p-1 text-center text-white bg-blueprimary rounded-2xl"
            >
              العربية
            </div>
            <div
              onClick={() => changeLanguage("en")}
              className="p-1 text-center text-white bg-blueprimary rounded-2xl"
            >
              English
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
