import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useUserContext } from "../../../context/StudentUserProvider";
import sanabelLogo from "../../../assets/splash.png";

const AvatarReady: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { user } = useUserContext();

  const handleStart = () => {
    if (user?.email) {
      localStorage.setItem(`tutorialComplete-${user.email}`, "true");
    }
    localStorage.setItem("firstTimer", "false");
    history.push("/student/home");
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center w-full h-full gap-2 bg-white dark:bg-[#121212]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <img
        src={sanabelLogo}
        className="object-contain w-full h-auto max-w-[280px]"
        alt={t("سنابل الإحسان")}
      />
      <div className="z-10 flex flex-col items-center gap-2 -mt-8 text-center">
        <span className="text-4xl">🎉</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("صورتك الشخصية جاهزة!")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {t("لنبدأ رحلتك الآن.")}
        </p>
      </div>
      <motion.div
        className="z-10 flex flex-col items-center w-3/4 max-w-xs px-8 py-3 mt-2 transition-all rounded-2xl shadow-lg bg-blueprimary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          type="button"
          className="w-full text-xl font-bold text-center text-white"
          onClick={handleStart}
        >
          {t("ابدأ")}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AvatarReady;
