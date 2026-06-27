import { useState } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import PrimaryButton from "../../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../../components/GenericInput";
import BackArrow from "../../../../icons/BackArrow";
import GoBackButton from "../../../../components/GoBackButton";
import { FaCheck } from "react-icons/fa";
import classNames from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import axios from "axios";

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

const Password: React.FC<{
  onContinue: () => void;
  setPassword: (value: string) => void;
  password: string;
}> = ({ onContinue, setPassword, password }) => {
  const { t } = useTranslation();

  const [isValid, setIsValid] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const validatePassword = (newPassword: string) => {
    setIsValid({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword); // Update the password state
    validatePassword(newPassword); // Validate the password
  };

  const finishPasswordStep = async () => {
    if (validConditionsCount < 3) {
      toast.error(t("passwordNotMeetRequirements"));
    } else {
      setPassword(password);
      onContinue();
    }
  };

  const validationCircles = [
    { condition: isValid.minLength, text: t("8 أحرف كحد أدنى") },
    { condition: isValid.hasNumber, text: t("رقم") },
    { condition: isValid.hasSpecialChar, text: t("رمز") },
  ];

  const validConditionsCount = Object.values(isValid).filter(Boolean).length;

  const progressWidth = `${(validConditionsCount / 3) * 100}%`;
  const progressColor =
    validConditionsCount === 1
      ? "bg-red-500"
      : validConditionsCount === 2
      ? "bg-yellow-500"
      : validConditionsCount === 3
      ? "bg-green-500"
      : "bg-gray-200";

  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10 overflow-y-auto">
      <div className="absolute">
        <Toaster></Toaster>
      </div>
      <div className="flex flex-col w-full gap-3">
        <div className="flex justify-start w-full">
          <GoBackButton />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-black ">
            {t("Create Password")}
          </h1>
          <p className="text-[#B3B3B3] text-sm   ">
            {t("Secure your account with a strong password")}
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full gap-10">
        <div className="flex flex-col gap-5">
          <GenericInput
            type="password"
            placeholder={t("ادخل كلمة السر")}
            title={t("كلمة السر")}
            value={password}
            onChange={handlePasswordChange} // Updated onChange
          />
        </div>
        <div className="flex w-full h-2 gap-0 bg-gray-200 rounded-xl">
          <div
            className={`${progressColor} h-2 rounded-xl`}
            style={{ width: progressWidth }}
          ></div>
        </div>
        <div className="flex flex-col items-start gap-3">
          {validationCircles.map((circle) => (
            <div className="flex-row-reverse gap-3 flex-center ">
              <h1
                className={classNames(
                  circle.condition ? "text-green-500" : "text-[#8E99A4]"
                )}
              >
                {circle.text}
              </h1>
              <div
                className={classNames(
                  "rounded-full w-7 h-7 flex-center",
                  circle.condition
                    ? "bg-green-500"
                    : "border-2 border-[#c7cbd3]"
                )}
              >
                {circle.condition && <FaCheck className="text-sm text-white" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`w-full ${
          validConditionsCount === 3 ? "opacity-100" : "opacity-50"
        }`}
        onClick={finishPasswordStep}
      >
        <PrimaryButton style={""} text={"حفظ"} arrow={"none"} />
      </div>

      <IonRouterLink routerLink="/login" className="text-md">
        <h1 className="text-[#8E99A4] font-semibold">
          {t("هل لديك حساب؟")}{" "}
          <span className="text-blueprimary ">{t("تسجيل الدخول")}</span>
        </h1>
      </IonRouterLink>
    </div>
  );
};

export default Password;
