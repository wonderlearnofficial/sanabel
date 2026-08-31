import React, { useState } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import PrimaryButton from "../../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../../components/GenericInput";
import BackArrow from "../../../../icons/BackArrow";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";

import nameImg from "../../../../assets/signup/name.png";
import ProgressBar from "../ProgressBar";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import i18n from "../../../../i18n";

const Toaster = () => (
  <ToastContainer
    position="top-right"
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

interface Step1Props {
  onContinue: () => void;
  onBack: () => void;
  name: { firstName: string; parentName: string };
  setName: (name: { firstName: string; parentName: string }) => void;
  isSubmitting?: boolean;
}

const Step1: React.FC<Step1Props> = ({
  onContinue,
  onBack,
  name,
  setName,
  isSubmitting = false,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  const handleNameChange = (key: string, value: string) => {
    setName({ ...name, [key]: value });
  };
  const isRTL = i18n.language === "ar";
  // Validation helper to check if a string contains only letters
  const isAlphabetic = (str: string) => /^[A-Za-z\u0621-\u064A ]+$/.test(str);

  function finishStep1() {
    if (!name.firstName || !name.parentName) {
      toast.error(t("enterFirstNameAndParentName"));
    } else if (
      !isAlphabetic(name.firstName) ||
      !isAlphabetic(name.parentName)
    ) {
      toast.error(t("noNumbersOrSymbols"));
    } else {
      onContinue();
    }
  }

  return (
    <div className="registration-page">
      <div className="absolute">
        <Toaster />
      </div>
      <div className="flex flex-col w-full gap-3">
        <div className="flex justify-start w-full">
          <GoBackButton onClick={onBack} />
        </div>

        <ProgressBar filledBars={2} />

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-black text-start ">
            {t("أدخل اسمك واسم والدك")}
          </h1>

          <p className="text-[#B3B3B3] text-sm text-start">
            {t("أكمل حسابك واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full gap-5">
        <div className="flex flex-col">
          <img src={nameImg} alt="" className="signup-illustration pointer-events-none select-none" />
          <div className="grid grid-cols-2 gap-3">
            <GenericInput
              type="text"
              placeholder={t("اسمك")}
              title={t("اسمك الأول")}
              onChange={(e) => handleNameChange("firstName", e.target.value)}
              value={name.firstName}
            />
            <GenericInput
              type="text"
              placeholder={t("اسمك الأخير")}
              title={t("اسمك الأخير")}
              onChange={(e) => handleNameChange("parentName", e.target.value)}
              value={name.parentName}
            />
          </div>
        </div>
      </div>
      <div className="w-full">
        <PrimaryButton
          style="fill"
          text={isSubmitting ? "جاري التحميل..." : "إنشاء حساب جديد"}
          arrow={isRTL ? "left" : "right"}
          disabled={isSubmitting}
          onClick={finishStep1}
        />
      </div>
    </div>
  );
};

export default Step1;
