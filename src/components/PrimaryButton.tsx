import { useTranslation } from "react-i18next";
import BackArrow from "../icons/BackArrow";
import i18n from "../i18n";

export interface ButtonProps {
  style: string;
  text: string;
  arrow: string;
  onClick?: () => void;
}

function PrimaryButton({ style, text, arrow, onClick }: ButtonProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex-center p-3 gap-3 w-full rounded-xl font-bold text-lg ${
        style == "stroke"
          ? "text-blueprimary border-2 border-blueprimary "
          : "bg-gradient-to-r from-[#2293c7] from-5% to-45% to-blueprimary text-white"
      }`}
      onClick={onClick}
    >
      {arrow !== "none" && (
        <BackArrow
          className={`text-white 
         ${arrow === "left" && i18n.language === "ar" ? "rotate-180" : ""}
         ${arrow === "right" && i18n.language === "en" ? "" : "rotate-180"}
       `}
        />
      )}

      <h1>{t(text)}</h1>
    </div>
  );
}
export default PrimaryButton;
