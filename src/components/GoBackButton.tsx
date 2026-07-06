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

  const handleGoBack = () => {
    AudioManager.play("pop");
    if (onClick) {
      onClick(); // Use provided callback if available
    } else {
      window.history.back(); // Fallback to default history back
    }
  };

  return (
    <div
      onClick={handleGoBack}
      onMouseEnter={() => AudioManager.play("tick")}
      className="flex-center p-2 border-2 border-[#EAECF0] rounded-xl self-end cursor-pointer"
    >
      <BackArrow
        size={25}
        className={`text-[#B3B3B3] ${currentLanguage === "en" && "rotate-180"}`}
      />
    </div>
  );
};

export default GoBackButton;
