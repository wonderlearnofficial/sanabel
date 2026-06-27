import { useState } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import PrimaryButton from "../../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../../components/GenericInput";
import BackArrow from "../../../../icons/BackArrow";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";

import ProgressBar from "../ProgressBar";

interface Step5Props {
  onContinue: () => void;
  onBack: () => void;
  parentCode: string;
  setParentCode: (code: string) => void;
}

const Step5: React.FC<Step5Props> = ({
  onContinue,
  onBack,
  parentCode,
  setParentCode,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParentCode(e.target.value);
  };
  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10">
      <div className="flex flex-col w-full gap-3">
      <div className="flex self-end justify-start w-full">
          <GoBackButton onClick={onBack} />
        </div>

        <ProgressBar filledBars={5} />

        <div className="flex flex-col self-end gap-2">
          <h1 className="text-2xl font-bold text-black text-end " dir="ltr">
            {t("ادخل رمز لولي امرك")}
          </h1>

          <p className="text-[#B3B3B3] text-sm text-end">
            {t("اكمل حسابك واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center w-full gap-3">
        <GenericInput
          type="text"
          placeholder={t("اصنع رمز لوالديك حتي يمكنهم تحرير تقدمك")}
          title={t("رمز الوالدين")}
          onChange={handleInputChange}
          value={parentCode}
        />
      </div>
      <div className="w-full ">
        <div onClick={onContinue}>
          <PrimaryButton style="fill" text={t("متابعة")} arrow="left" />
        </div>
      </div>
    </div>
  );
};

export default Step5;
