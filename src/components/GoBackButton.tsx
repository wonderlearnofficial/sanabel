import React from "react";
import { useTranslation } from "react-i18next";
import BackArrow from "../icons/BackArrow";
import i18n from "i18next";
import { AudioManager } from "../utils/AudioManager";

interface GoBackButtonProps {
  onClick?: () => void; // Optional prop to control navigation
}

const GoBackButton: React.FC<GoBackButtonProps> = ({ onClick }) => {
  const currentLanguage = i18n.language;
  const { t } = useTranslation();

  const handleGoBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    AudioManager.play("tap");
    if (onClick) {
      onClick(); // Use provided callback if available
    } else {
      window.history.back(); // Fallback to default history back
    }
  };

  return (
    <button
      type="button"
      aria-label={t("رجوع")}
      onClick={handleGoBack}
      className="flex-center min-h-[44px] min-w-[44px] p-2 border-2 border-[#EAECF0] rounded-xl self-end cursor-pointer select-none touch-manipulation active:scale-95 transition-transform bg-white outline-none"
    >
      <BackArrow
        size={25}
        className={`pointer-events-none select-none text-[#B3B3B3] ${
          currentLanguage === "en" ? "rotate-180" : ""
        }`}
      />
    </button>
  );
};

export default GoBackButton;
