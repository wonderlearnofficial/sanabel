import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import splashgif from "../../../assets/splashscreen/Snabl-El-Ehsan Animation-Vertical.mp4";
import wonderlearnLogo from "../../../assets/WonderLearn.png";
import schoologos from "../../../assets/combinedlogosfinal.png";
import { localStore } from "../../../utils/safeStorage";

const SplashScreen: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  useEffect(() => {
    const hasVisited = localStore.getItem("hasVisited") === "true";
    const keepLoggedIn = localStore.getItem("keepLoggedIn") === "true";
    const role = localStore.getItem("role");
    const hasAuthToken = Boolean(
      localStore.getItem("token") || localStore.getItem("refreshToken"),
    );
    const firstTimer = localStore.getItem("firstTimer");

    const timer = setTimeout(() => {
      if (keepLoggedIn && role && hasAuthToken) {
        // Logged-in user redirects to home based on role
        if (role === "Student") {
          // Check if this is their first time (they need to create an avatar)
          if (firstTimer === "true") {
            history.replace("/student/create-avatar");
          } else {
            // This is a returning user, send directly to home
            history.replace("/student/home");
          }
        } else if (role === "Teacher") {
          history.replace("/teacher/home");
        } else if (role === "Parent") {
          history.replace("/parent/home");
        } else if (role === "Admin") {
          window.location.href = "/admin/userdata";
        }
        return;
      }

      // Do not route a stale keepLoggedIn flag to a protected page when its
      // tokens were cleared or lost.
      if (keepLoggedIn || role) {
        localStore.setItem("keepLoggedIn", "false");
        localStore.removeItem("role");
      }

      if (!hasVisited) {
        // First-time visitor to app redirects to onboarding
        localStore.setItem("hasVisited", "true");
        history.replace("/onboarding");
      } else {
        // Returning visitor (but not logged in) redirects to choose sign method
        history.replace("/choosesignmethod");
      }
    }, 4000); // 4-second delay for splash screen

    return () => clearTimeout(timer);
  }, [history]);

  return (
    <motion.div
      className="flex flex-col  items-center justify-between w-full h-full p-3 py-5 bg-white dark:bg-[#121212] overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="flex flex-col items-center w-full gap-2"
      >
        <motion.img src={schoologos} alt="" className="w-2/3" />
        <h1 className="text-xl font-bold text-blueprimary">
          {t("اهداء من وقف د.حسن العديسي")}
        </h1>
      </motion.div>

      <video
        src={splashgif}
        className="object-fill w-auto h-full mt-4"
        autoPlay
        muted
        playsInline
        preload="auto"
      />
      <motion.div
        className="flex-col gap-2 flex-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <motion.h1 className="text-2xl text-[#5e5e5e] font-bold ">
          {t("Powered By")}
        </motion.h1>
        <motion.img src={wonderlearnLogo} alt="" className="w-2/3" />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
