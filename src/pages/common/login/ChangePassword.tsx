import { API_BASE_URL } from "../../../config/api";
import { useState } from "react";

import PrimaryButton from "../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../components/GenericInput";
import GoBackButton from "../../../components/GoBackButton";
import { FaCheck } from "react-icons/fa";
import classNames from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import axios from "axios";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiLockPasswordLine } from "react-icons/ri";
import { getErrorMessage } from "../../../config/getErrorMessage";

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

const ChangePassword: React.FC = () => {
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [isValid, setIsValid] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const validatePassword = (password: string) => {
    setIsValid({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const validationCircles = [
    { condition: isValid.minLength, text: t("8 أحرف كحد أدنى") },
    { condition: isValid.hasNumber, text: t("رقم") },
    { condition: isValid.hasSpecialChar, text: t("رمز") },
  ];

  // Count the number of valid conditions
  const validConditionsCount = Object.values(isValid).filter(Boolean).length;

  // Determine width and color based on valid conditions
  const progressWidth = `${(validConditionsCount / 3) * 100}%`;
  const progressColor =
    validConditionsCount === 1
      ? "bg-red-500"
      : validConditionsCount === 2
      ? "bg-yellow-500"
      : validConditionsCount === 3
      ? "bg-green-500"
      : "bg-gray-200";

  const location = useLocation<{ email: string }>();
  const email = location.state?.email || "";

  const handleChangePassword = async () => {
    // Check if all conditions are met
    if (validConditionsCount < 3) {
      toast.error(t("passwordNotMeetRequirements"));
      return;
    }

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/reset-password`,
        {
          email: email,
          newPassword: password,
        }
      );

      if (response.status === 200) {
        setIsPasswordChanged(true);
        toast.success(t("passwordChangeSuccess"));
      }
    } catch (error) {
      console.error("Error during password change:", error);

      toast.error(t(getErrorMessage(error, "passwordChangeFailed")));
    }
  };
  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10 overflow-y-auto">
      <div className="absolute">
        <Toaster />
      </div>
      <div className="flex flex-col w-full gap-3">
        <GoBackButton />

        <div className="flex flex-col self-end gap-2">
          <h1 className="text-2xl font-bold text-black text-end ">
            {t("إعادة تعيين كلمة السر")}
          </h1>
          <p className="text-[#B3B3B3] text-sm  text-end ">
            {t("تأمين حسابك بكلمة مرور جديدة")}
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
            onChange={handlePasswordChange}
          />
        </div>
        <div className="flex w-full h-2 gap-0 bg-gray-200 rounded-xl">
          <div
            className={`${progressColor} h-2 rounded-xl`}
            style={{ width: progressWidth }}
          ></div>
        </div>
        {/* className="w-1/3 h-2 bg-redprimary rounded-xl" */}
        <div className="flex flex-col items-end self-end gap-3">
          {validationCircles.map((circle) => (
            <div className="gap-3 flex-center ">
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
        onClick={handleChangePassword}
      >
        <PrimaryButton
          style={""}
          text={"حفظ"}
          arrow={"none"}
          onClick={handleChangePassword}
        />
      </div>

      <IonRouterLink routerLink="/choosesignmethod" className="text-md ">
        <h1 className="text-[#8E99A4] font-semibold">
          {t("ليس لديك حساب؟")}{" "}
          <span className="text-blueprimary ">{t("إنشاء حساب")}</span>
        </h1>
      </IonRouterLink>
      {isPasswordChanged && (
        <motion.div
          initial={{ opacity: 1, y: 250 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 w-full h-full border-2 rounded-lg bg-gradient-to-t"
        >
          <div className="w-full bg-black h-1/3 opacity-10"></div>
          <div className="flex flex-col items-center justify-around w-full p-5 bg-white h-2/3">
            <RiLockPasswordLine className="text-9xl text-blueprimary" />
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold text-center text-black ">
                {t("تم تغير كلمة السر بنجاح")}
              </h1>
              <p className="text-[#B3B3B3] text-sm  text-center ">
                {t("قم بتسجيل الدخول و ابدأ في جمع الحسنات")}
              </p>
            </div>
            <IonRouterLink routerLink="/login" className="w-full text-md">
              <PrimaryButton
                style={""}
                text={t("تسجيل الدخول")}
                arrow={"none"}
              />
            </IonRouterLink>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChangePassword;
