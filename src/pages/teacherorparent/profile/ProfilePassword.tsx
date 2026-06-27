import { useState } from "react";
import { IonRouterLink } from "@ionic/react";
import PrimaryButton from "../../../components/PrimaryButton";
import GenericInput from "../../../components/GenericInput";
import GoBackButton from "../../../components/GoBackButton";
import { FaCheck } from "react-icons/fa";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const Password: React.FC = () => {
  const { t } = useTranslation();

  const [password, setPassword] = useState("12345678*"); // Original password
  const [tempOldPassword, setTempOldPassword] = useState(""); // Input for old password
  const [newPassword, setNewPassword] = useState(""); // Input for new password
  const [isValid, setIsValid] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Validate only the new password
  const validatePassword = (newPassword: string) => {
    setIsValid({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  const finishPasswordStep = () => {
    // Check if the old password is correct
    if (tempOldPassword !== password) {
      toast.error(t("كلمة السر القديمة غير صحيحة")); // "Old password is incorrect"
      return;
    }

    // Check if the new password meets validation conditions
    const validConditionsCount = Object.values(isValid).filter(Boolean).length;
    if (validConditionsCount < 3) {
      toast.error(t("كلمة السر الجديدة لا تلبي المتطلبات")); // "New password does not meet requirements"
    } else {
      // Process password change logic here
      console.log("Old Password:", tempOldPassword);
      console.log("New Password:", newPassword);
      toast.success(t("تم تغيير كلمة السر بنجاح")); // "Password changed successfully"
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
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10">
      <Toaster />
      <div className="flex flex-row-reverse items-center w-full gap-3">
        <GoBackButton />
        <h1 className="text-2xl font-bold text-black text-end ">
          {t("تغيير كلمة السر")}
        </h1>
      </div>

      <div className="flex flex-col w-full gap-10">
        {/* Old Password */}
        <div className="flex flex-col gap-5">
          <GenericInput
            type="password"
            placeholder={t("كلمة السر القديمة")}
            title={t("كلمة السر القديمة")}
            value={tempOldPassword}
            onChange={(e: any) => setTempOldPassword(e.target.value)} // Only update old password state
          />
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-5">
          <GenericInput
            type="password"
            placeholder={t("ادخل كلمة السر")}
            title={t("كلمة السر الجديدة")}
            value={newPassword}
            onChange={handleNewPasswordChange} // Validate only the new password
          />
        </div>

        {/* Progress Bar */}
        <div className="flex w-full h-2 gap-0 bg-gray-200 rounded-xl">
          <div
            className={`${progressColor} h-2 rounded-xl`}
            style={{ width: progressWidth }}
          ></div>
        </div>

        {/* Validation Circles */}
        <div className="flex flex-col items-end self-end gap-3">
          {validationCircles.map((circle, index) => (
            <div key={index} className="gap-3 flex-center">
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

      {/* Save Button */}
      <div
        className={`w-full ${
          validConditionsCount === 3 ? "opacity-100" : "opacity-50"
        }`}
        onClick={finishPasswordStep}
      >
        <PrimaryButton style={""} text={t("حفظ")} arrow={"none"} />
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
