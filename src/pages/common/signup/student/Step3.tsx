import { useState } from "react";
import PrimaryButton from "../../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../../components/GenericInput";
import BackArrow from "../../../../icons/BackArrow";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";

import cakeImage from "../../../../assets/signup/birthday.png";
import ProgressBar from "../ProgressBar";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import i18n from "../../../../i18n";

const Toaster = () => (
  <ToastContainer
    position="top-center"
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

interface Step3Props {
  onContinue: () => void;
  onBack: () => void;
  birthdate: { day: string; month: string; year: string };
  setBirthdate: (birthdate: {
    day: string;
    month: string;
    year: string;
  }) => void;
}

const Step3: React.FC<Step3Props> = ({
  onContinue,
  onBack,
  birthdate,
  setBirthdate,
}) => {
  const { t } = useTranslation();

  const handleInputChange = (field: string, value: string) => {
    if (/^\d*$/.test(value)) {
      // Allow only numbers
      setBirthdate({ ...birthdate, [field]: value });
    } else {
      toast.error(t("numbers_only"));
    }
  };

  const isValidDate = (day: number, month: number, year: number): boolean => {
    const currentYear = new Date().getFullYear();

    // Year validation
    if (year < 1940 || year > currentYear || year.toString().length !== 4) {
      toast.error(t("invalid_date"));
      return false;
    }

    // Month and day validation
    if (month < 1 || month > 12) return false;
    const daysInMonth = new Date(year, month, 0).getDate();
    return day > 0 && day <= daysInMonth;
  };

  function handleBirthdayStep() {
    const day = parseInt(birthdate.day, 10);
    const month = parseInt(birthdate.month, 10);
    const year = parseInt(birthdate.year, 10);

    if (!birthdate.day || !birthdate.month || !birthdate.year) {
      toast.error(t("fill_all_fields"));
    } else if (!isValidDate(day, month, year)) {
      toast.error(t("invalid_date"));
    } else {
      onContinue();
    }
  }
  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10 overflow-y-auto">
      <div className="absolute">
        <Toaster />
      </div>
      <div className="flex flex-col w-full gap-3">
        <div className="flex self-end justify-start w-full">
          <GoBackButton onClick={onBack} />
        </div>

        <ProgressBar filledBars={3} />

        <div className="flex flex-col self-end gap-2">
          <h1 className="text-2xl font-bold text-black text-end " dir="ltr">
            {t("ادخل تاريخ عيد ميلادك 🎂")}
          </h1>

          <p className="text-[#B3B3B3] text-sm text-end">
            {t("اكمل حسابك واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center w-full gap-3">
        <div className="flex flex-col items-center justify-center w-full gap-3">
          <img src={cakeImage} alt="" className="w-64 h-64" />
          <div className="flex w-full gap-3">
            <GenericInput
              type="text"
              placeholder={t("السنة")}
              title={t("السنة")}
              onChange={(e) => handleInputChange("year", e.target.value)}
              value={birthdate.year}
            />
            <GenericInput
              type="text"
              placeholder={t("الشهر")}
              title={t("الشهر")}
              onChange={(e) => handleInputChange("month", e.target.value)}
              value={birthdate.month}
            />
            <GenericInput
              type="text"
              placeholder={t("اليوم")}
              title={t("اليوم")}
              onChange={(e) => handleInputChange("day", e.target.value)}
              value={birthdate.day}
            />
          </div>
        </div>
      </div>

      <div className="w-full ">
        <div onClick={handleBirthdayStep}>
          <PrimaryButton style="fill" text={t("متابعة")} arrow="left" />
        </div>
      </div>
    </div>
  );
};

export default Step3;
