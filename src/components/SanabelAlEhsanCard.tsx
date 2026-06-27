import React from "react";


import { SanabelAlEhsanData } from "../data/SanabelAlEhsanData";

import { useTranslation } from "react-i18next";
import i18n from "i18next";

interface ProgressHomeBarProps {
  title: string;
  points: number;
  img: string;
  borderColor: string; // Accept the borderColor prop
}

const SanabelAlEhsanCard: React.FC<ProgressHomeBarProps> = ({
  title,
  points,
  img,
  borderColor,
}) => {
  const { t } = useTranslation();
  const currentLanguage = i18n.language;
  return (
    <div
      className={`flex flex-col items-center w-full relative p-2 rounded-xl shadow-bottom gap-3 dark:bg-[#121212]  `}
      style={{ borderTop: `3px solid ${borderColor}` }}
    >
      <div
        className={`${currentLanguage === "ar" ? "self-end" : "self-start"}`}
      >
        {/* <PointsIndicator /> */}
      </div>

      <img src={img} alt={title} className="self-end w-3/5 h-auto" />
      <h1 className="flex font-bold text-black w-full justify-end dark:text-[#d4d4d4]">
        {t(title)}
      </h1>
    </div>
  );
};

export default SanabelAlEhsanCard;
