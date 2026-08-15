import PrimaryButton from "../../../components/PrimaryButton";
import GoBackButton from "../../../components/GoBackButton";

import trophyImg from "../../../assets/onboarding/trophy_2.png";

import { IonIcon, IonRouterLink } from "@ionic/react";
import { personOutline, schoolOutline } from "ionicons/icons"; // Changed businessOutline to schoolOutline for better icon representation
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const ChooseSignMethod: React.FC = () => {
  const { t } = useTranslation();
  const [showSignupOptions, setShowSignupOptions] = useState(false);

  // Function to handle the click on "Create Account" button
  const handleSignupClick = () => {
    setShowSignupOptions(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="onboarding-page"
    >
      <div className="flex self-end justify-start w-full">
        <GoBackButton />
      </div>
      <AnimatePresence mode="wait">
        {" "}
        {/* Use mode="wait" for smoother transitions */}
        {!showSignupOptions ? (
          <motion.div
            key="main-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center w-full max-w-md gap-4 pb-2 mx-auto"
          >
            {/* Trophy Image remains */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex justify-center w-full shrink-0"
            >
              <img
                src={trophyImg}
                className="onboarding-trophy"
                alt="Sign Method"
              />
            </motion.div>

            <div className="flex flex-col w-full gap-4 p-2 bg-white sm:gap-6 sm:p-4 rounded-2xl">
              {/* Added card-like styling */}
              <h1 className="text-[#040415] text-2xl sm:text-3xl text-center font-extrabold leading-tight">
                {/* Increased font weight and line height */}
                {t("سجل الآن وابدأ")}
                <br />
                <span className="text-blue-600"> {t("رحلة الإحسان")}</span>{" "}
                {/* Used a more vibrant blue */}
              </h1>
              <p className="text-base text-center text-gray-600 sm:text-lg">
                {/* Adjusted text color and size */}
                {t("سجل الآن واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
              </p>
              <IonRouterLink onClick={handleSignupClick} className="w-full">
                <PrimaryButton style="fill" text="إنشاء حساب" arrow="none" />
              </IonRouterLink>
              <IonRouterLink routerLink="/login" className="w-full">
                <PrimaryButton
                  style="stroke"
                  text="تسجيل الدخول"
                  arrow="none"
                />
              </IonRouterLink>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="signup-options"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center w-full max-w-md gap-3 pb-2 mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="flex justify-center w-full shrink-0"
            >
              <img
                src={trophyImg}
                className="onboarding-trophy onboarding-trophy--compact"
                alt="Sign Method"
              />
            </motion.div>
            <h2 className="text-[#040415] text-2xl sm:text-3xl font-extrabold text-center leading-tight">
              {" "}
              {/* Larger, bolder heading */}
              {t("اختر نوع التسجيل")}
            </h2>

            <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
              {" "}
              {/* Responsive layout for cards */}
              {/* User Card */}
              <IonRouterLink
                routerLink="/signupstudent"
                className="flex flex-col items-center justify-start min-w-0 p-2 py-3 transition-all duration-300 ease-in-out bg-white border-2 border-blue-400 shadow-lg cursor-pointer sm:p-4 rounded-2xl hover:shadow-xl hover:scale-[1.02]"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="w-20 h-20 mb-2 bg-blue-100 rounded-full shadow-md sm:w-24 sm:h-24 sm:mb-3 flex-center shrink-0"
                >
                  <IonIcon
                    icon={personOutline}
                    className="text-blue-600"
                    style={{ fontSize: "clamp(52px, 16vw, 70px)" }}
                  />
                </motion.div>
                <h1 className="mb-1 text-xl font-bold text-center text-gray-800 sm:text-2xl">
                  {t("مستخدم")}
                </h1>
                <p className="text-xs leading-snug text-center text-gray-500 sm:text-sm">
                  {t("سجل كفرد للاستفادة من جميع الميزات")}
                </p>
              </IonRouterLink>
              {/* School Card */}
              <IonRouterLink
                routerLink="/signupparentorteacher"
                className="flex flex-col items-center justify-start min-w-0 p-2 py-3 transition-all duration-300 ease-in-out bg-white border-2 border-yellow-400 shadow-lg cursor-pointer sm:p-4 rounded-2xl hover:shadow-xl hover:scale-[1.02]"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="w-20 h-20 mb-2 bg-yellow-100 rounded-full shadow-md sm:w-24 sm:h-24 sm:mb-3 flex-center shrink-0"
                >
                  <IonIcon
                    icon={schoolOutline} // Changed icon to schoolOutline
                    className="text-yellow-600"
                    style={{ fontSize: "clamp(52px, 16vw, 70px)" }}
                  />
                </motion.div>
                <h1 className="mb-1 text-xl font-bold text-center text-gray-800 sm:text-2xl">
                  {t("مدرسة")} {/* Changed to "School" */}
                </h1>
                <p className="text-xs leading-snug text-center text-gray-500 sm:text-sm">
                  {t("يمكن أن يكون معلمًا أو ولي أمر")}{" "}
                  {/* Added clarifying text */}
                </p>
              </IonRouterLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChooseSignMethod;
