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

  const handleClick = () => {
    if (disabled) return;
    AudioManager.play("pop");
    if (onClick) onClick();
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    AudioManager.play("tick");
  };

  return (
    <div
      className={`flex-center min-h-[52px] p-3 gap-3 w-full rounded-xl font-bold text-lg text-center cursor-pointer ${
        disabled ? "opacity-50 pointer-events-none" : ""
      } ${
        style == "stroke"
          ? "text-blueprimary border-2 border-blueprimary "
          : "bg-gradient-to-r from-[#2293c7] from-5% to-45% to-blueprimary text-white"
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
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
