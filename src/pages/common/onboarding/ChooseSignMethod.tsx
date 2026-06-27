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
      className="flex flex-col items-center justify-end w-full h-full gap-2 p-3 pb-3 overflow-y-auto" // Added a subtle background gradient
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
            className="flex flex-col items-center justify-center w-full" // Centered content
          >
            {/* Trophy Image remains */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="w-full max-w-sm mb-8" // Added max-width for better control on larger screens
            >
              <img
                src={trophyImg}
                className="w-full h-auto" // Ensure image scales correctly
                alt="Sign Method"
              />
            </motion.div>

            <div className="flex flex-col w-full max-w-md gap-6 p-4 bg-white rounded-2xl">
              {/* Added card-like styling */}
              <h1 className="text-[#040415] text-3xl text-center font-extrabold leading-tight">
                {/* Increased font weight and line height */}
                {t("سجل الآن وابدأ")}
                <br />
                <span className="text-blue-600"> {t("رحلة الإحسان")}</span>{" "}
                {/* Used a more vibrant blue */}
              </h1>
              <p className="text-lg text-center text-gray-600">
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
            className="flex flex-col items-center justify-center w-full h-full gap-3 overflow-y-auto " // Adjusted gap and centering
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="w-full max-w-sm mb-4"
            >
              <img
                src={trophyImg}
                className="w-full h-auto"
                alt="Sign Method"
              />
            </motion.div>
            <h2 className="text-[#040415] text-3xl font-extrabold text-center">
              {" "}
              {/* Larger, bolder heading */}
              {t("اختر نوع التسجيل")}
            </h2>

            <div className="flex justify-center w-full max-w-2xl gap-1 px-4 overflow-y-auto md:flex-row">
              {" "}
              {/* Responsive layout for cards */}
              {/* User Card */}
              <IonRouterLink
                routerLink="/signupstudent"
                className="flex flex-col items-center justify-center flex-1 p-5 px-6 transition-all duration-300 ease-in-out bg-white border-2 border-blue-400 shadow-lg cursor-pointer rounded-2xl hover:shadow-xl hover:scale-105" // Enhanced styling
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mb-4 bg-blue-100 rounded-full shadow-md w-28 h-28 flex-center" // Circle background for icon
                >
                  <IonIcon
                    icon={personOutline}
                    className="text-blue-600"
                    style={{ fontSize: "80px" }} // Adjusted icon size
                  />
                </motion.div>
                <h1 className="mb-2 text-2xl font-bold text-center text-gray-800">
                  {t("مستخدم")}
                </h1>
                <p className="text-sm text-center text-gray-500">
                  {t("سجل كفرد للاستفادة من جميع الميزات")}
                </p>
              </IonRouterLink>
              {/* School Card */}
              <IonRouterLink
                routerLink="/signupparentorteacher"
                className="flex flex-col items-center justify-center flex-1 p-5 px-6 transition-all duration-300 ease-in-out bg-white border-2 border-yellow-400 shadow-lg cursor-pointer rounded-2xl hover:shadow-xl hover:scale-105" // Enhanced styling
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="mb-4 bg-yellow-100 rounded-full shadow-md w-28 h-28 flex-center" // Circle background for icon
                >
                  <IonIcon
                    icon={schoolOutline} // Changed icon to schoolOutline
                    className="text-yellow-600"
                    style={{ fontSize: "80px" }} // Adjusted icon size
                  />
                </motion.div>
                <h1 className="mb-2 text-2xl font-bold text-center text-gray-800">
                  {t("مدرسة")} {/* Changed to "School" */}
                </h1>
                <p className="text-sm text-center text-gray-500">
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
