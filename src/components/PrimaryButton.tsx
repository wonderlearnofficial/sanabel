import React from "react";
import { useTranslation } from "react-i18next";
import BackArrow from "../icons/BackArrow";
import i18n from "../i18n";
import { AudioManager } from "../utils/AudioManager";

export interface ButtonProps {
  style: string;
  text: string;
  arrow: string;
  onClick?: () => void;
  disabled?: boolean;
}

function PrimaryButton({ style, text, arrow, onClick, disabled }: ButtonProps) {
  const { t } = useTranslation();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    AudioManager.play("tap");
    if (onClick) onClick();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex-center min-h-[52px] p-3 gap-3 w-full rounded-xl font-bold text-lg text-center cursor-pointer select-none touch-manipulation active:scale-[0.98] transition-transform outline-none border-0 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      } ${
        style == "stroke"
          ? "text-blueprimary border-2 border-blueprimary bg-transparent"
          : "bg-gradient-to-r from-[#2293c7] from-5% to-45% to-blueprimary text-white shadow-md"
      }`}
      onClick={handleClick}
    >
      {arrow !== "none" && (
        <BackArrow
          className={`pointer-events-none select-none ${
            style === "stroke" ? "text-blueprimary" : "text-white"
          } ${arrow === "left" && i18n.language === "ar" ? "rotate-180" : ""} ${
            arrow === "right" && i18n.language === "en" ? "" : "rotate-180"
          }`}
        />
      )}

      <span className="pointer-events-none select-none">{t(text)}</span>
    </button>
  );
}
export default PrimaryButton;
