import { useTranslation } from "react-i18next";
import BackArrow from "../icons/BackArrow";
import i18n from "../i18n";

export interface ButtonProps {
  text: string;
  arrow: string;
  onClick?: () => void;
}

function PrimaryButton({ text, arrow, onClick }: ButtonProps) {
  const { t } = useTranslation();

  return (
    <div className={``} onClick={onClick}>
      {arrow !== "none" && (
        <BackArrow
          className={`text-white 
         ${arrow === "left" && i18n.language === "ar" ? "rotate-180" : ""}
         ${arrow === "right" && i18n.language === "en" ? "rotate-180" : ""}
       `}
        />
      )}

      <h1>{t(text)}</h1>
    </div>
  );
}
export default PrimaryButton;
