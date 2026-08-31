import React from "react";
import PrimaryButton from "../../../../components/PrimaryButton";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const handleGradeSelect = (grade: string) => {
    setGradeYear(grade);
  };

  return (
    <div className="registration-page">
      <div className="flex flex-col w-full gap-3">
        <div className="flex self-end justify-start w-full">
          <GoBackButton onClick={onBack} />
        </div>

        <ProgressBar filledBars={4} />

        <div className="flex flex-col gap-2 self-end">
          <h1 className="text-black font-bold text-2xl text-end" dir="ltr">
            {t("اختر مرحلتك الدراسية 🎓")}
          </h1>

          <p className="text-[#B3B3B3] text-sm text-end">
            {t("أكمل حسابك واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {["primary", "preparatory ", "secondary"].map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => handleGradeSelect(grade)}
            className={`w-full border-2 rounded-xl p-3 text-[#121212] text-end cursor-pointer select-none touch-manipulation transition-all border-0 outline-none ${
              gradeYear === grade ? "bg-blue-100 border-blue-500 font-bold" : "bg-white border-gray-200"
            }`}
          >
            {t(grade)}
          </button>
        ))}
      </div>

      <div className="w-full">
        <PrimaryButton style="fill" text={t("متابعة")} arrow="left" onClick={onContinue} />
      </div>
    </div>
  );
};

export default Step4;
