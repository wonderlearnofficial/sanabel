import { useState } from "react";

import PrimaryButton from "../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";
import GenericInput from "../../../components/GenericInput";
import GoBackButton from "../../../components/GoBackButton";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import axios from "axios";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserContext } from "../../../context/StudentUserProvider"; // Updated import

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

const ForgotPassword: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar"; // Assuming Arabic is RTL

  const [email, setEmail] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [otp, setOtp] = useState(["", "", "", ""]);

  const history = useHistory();
  const { user, isLoading } = useUserContext(); // Updated to use unified context

  // Get email from user context, works for all roles
  const emailaddress = user?.email || "";

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Prevents entering non-numeric values
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Automatically focus the next input
    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSendOTP = async () => {
    // Use email from user context if available, otherwise use manual input
    const emailToUse = emailaddress || email;

    if (!emailToUse) {
      toast.error(t("fillEmailField"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      toast.error(t("invalidEmailFormat"));
      return;
    }

    try {
      const response = await axios.patch(
        "https://sanabel.wonderlearn.net/users/send-otp",
        { email: emailToUse }
      );

      if (response.status === 200) {
        setIsOtpSent(true);
        toast.success(t("otpSentSuccess"));
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error(t("invalidOTP"));
    }
  };

  const handleConfirmOTP = async () => {
    const otpCode = otp.join("");
    const emailToUse = emailaddress || email;

    if (otpCode.length !== 4) {
      toast.error(t("enter4DigitOTP"));
      return;
    }

    try {
      const response = await axios.patch(
        "https://sanabel.wonderlearn.net/users/verify-otp",
        { email: emailToUse, otp: otpCode }
      );

      if (response.status === 200) {
        toast.success(t("otpVerifySuccess"));
        history.push({
          pathname: "/changepassword",
          state: { email: emailToUse },
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error(t("invalidOTP"));
    }
  };

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <p>{t("loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10 overflow-y-auto ${
        isRTL ? "rtl" : "ltr"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute">
        <Toaster />
      </div>
      <div className="flex flex-col w-full gap-3">
        <div className="self-start">
          <GoBackButton />
        </div>
        <div className={`flex flex-col gap-2 ${isRTL ? "self-start" : ""}`}>
          <h1
            className={`text-2xl font-bold text-black ${
              isRTL ? "text-end" : "text-start"
            }`}
            dir="ltr"
          >
            {isOtpSent
              ? t("التحقق من البريد الإلكتروني")
              : t("إعادة تعيين كلمة السر")}
          </h1>
          <p
            className={`text-[#B3B3B3] text-sm ${
              isRTL ? "text-end" : "text-start"
            }`}
          >
            {!isOtpSent ? (
              ""
            ) : (
              <span>
                {t("لقد أرسلنا للتو الرمز المكون من 5 أرقام إلى")}{" "}
                <span className="font-semibold text-blueprimary">
                  {emailaddress || email}
                </span>{" "}
                {t("أدخله أدناه:")}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full gap-7 ">
        {isOtpSent ? (
          <div className="flex flex-col items-center gap-6">
            <h1
              className={`text-[#121212] ${isRTL ? "self-end" : "self-start"}`}
            >
              {t("الرمز")}
            </h1>
            <div className="flex gap-3" dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  className={`w-10 h-10 text-center font-bold rounded-full ${
                    digit
                      ? "bg-transparent text-2xl text-black"
                      : "bg-blueprimary text-white opacity-50"
                  }`}
                  maxLength={1}
                  inputMode="numeric"
                  dir="ltr"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Show user email if available, otherwise show input field */}
            {emailaddress && (
              <h1 className="text-2xl text-center text-blueprimary">
                {emailaddress}
              </h1>
            )}
          </>
        )}

        <div onClick={isOtpSent ? handleConfirmOTP : handleSendOTP}>
          <PrimaryButton
            style="fill"
            text={`${isOtpSent ? "تأكيد الرمز" : "ارسل الرمز"}`}
            arrow="none"
          />
        </div>
        {isOtpSent && (
          <h1
            className={`text-[#B3B3B3] ${
              isRTL ? "text-center" : "text-center"
            }`}
            onClick={handleSendOTP}
          >
            {t("لم تتلق رمز")} <span dir="ltr">OTP</span> {t("بعد؟")}{" "}
            <span className="text-blueprimary ">{t("إعادة الإرسال")}</span>
          </h1>
        )}
      </div>
      <div></div>
    </div>
  );
};

export default ForgotPassword;
