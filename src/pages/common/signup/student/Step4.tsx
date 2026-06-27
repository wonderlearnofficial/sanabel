import { useState } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import PrimaryButton from "../../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../../components/GenericInput";
import BackArrow from "../../../../icons/BackArrow";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";

import dummyImage from "../../assets/boarding/vector-tree-logo-template-1911680730.jpg";
import ProgressBar from "../ProgressBar";

interface Step4Props {
  onContinue: () => void;
  onBack: () => void;
  gradeYear: string;
  setGradeYear: (gradeYear: string) => void;
}
const Step4: React.FC<Step4Props> = ({
  onContinue,
  onBack,
  gradeYear,
  setGradeYear,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  const handleGradeSelect = (grade: string) => {
    setGradeYear(grade);
  };
  return (
    <div className="flex flex-col h-full w-full items-center justify-between p-5 gap-10 pb-10">
      <div className="flex flex-col w-full gap-3">
      <div className="flex self-end justify-start w-full">
          <GoBackButton onClick={onBack} />
        </div>

        <ProgressBar filledBars={4} />

        <div className="flex flex-col gap-2 self-end">
          <h1 className="text-black font-bold text-2xl text-end " dir="ltr">
            {t("اختار مرحلتك الدراسية 🎓")}
          </h1>

          <p className="text-[#B3B3B3] text-sm text-end">
            {t("اكمل حسابك واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {/* {["الابتدائي", "الإعدادي", "الثانوي"].map((grade) => ( */}
        {["primary", "preparatory ", "secondary"].map((grade) => (
          <div
            key={grade}
            onClick={() => handleGradeSelect(grade)}
            className={`w-full border-2 rounded-xl p-3 text-[#121212] text-end cursor-pointer ${
              gradeYear === grade ? "bg-blue-100 border-blue-500" : ""
            }`}
          >
            {t(grade)}
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col gap-7">
        <div onClick={onContinue}>
          <PrimaryButton style="fill" text={t("متابعة")} arrow="left" />
        </div>
      </div>
    </div>
  );
};

export default Step4;
