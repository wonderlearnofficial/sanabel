import React from "react";
import { useTranslation } from "react-i18next";
import BackArrow from "../icons/BackArrow";
import i18n from "../i18n";
import { AudioManager } from "../utils/AudioManager";

export interface ButtonProps {
  text: string;
  arrow: string;
  onClick?: () => void;
  disabled?: boolean;
}

function ProfileButton({ text, arrow, onClick, disabled }: ButtonProps) {
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
      className="flex items-center justify-between w-full p-4 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer select-none touch-manipulation active:scale-[0.99] transition-transform outline-none border-0"
      onClick={handleClick}
    >
      <span className="text-base font-semibold text-gray-800 pointer-events-none select-none">
        {t(text)}
      </span>

      {arrow !== "none" && (
        <BackArrow
          className={`pointer-events-none select-none text-gray-400 ${
            arrow === "left" && i18n.language === "ar" ? "rotate-180" : ""
          } ${arrow === "right" && i18n.language === "en" ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );
}
export default ProfileButton;
