import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import sanabelAlEhsanLogo from "../../../assets/login/logo.png";
import GetAvatar from "./GetAvatar";

interface IntroProps {
  name: string;
}

const Intro: React.FC<IntroProps> = ({ name }) => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
        delayChildren: 0.2,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.6,
      },
    },
  };

  const paragraphVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9, rotate: -5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 10,
        delay: 0.8,
      },
    },
  };

  const avatarDataString = localStorage.getItem("avatarData");
  const avatarData = avatarDataString ? JSON.parse(avatarDataString) : null;

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-6 space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex flex-col gap-7" variants={itemVariants}>
        <div className="flex gap-3 text-4xl font-bold flex-center">
          <motion.h1 className=" text-blueprimary" variants={itemVariants}>
            {name}
          </motion.h1>
          <motion.h1 className="text-gray-800 " variants={itemVariants}>
            {t("مرحبا")}
          </motion.h1>
        </div>
        <motion.div
          className="flex-col w-full gap-2 flex-center"
          variants={itemVariants}
        >
          <motion.div className="w-44 h-44 rounded-full overflow-hidden border-[1px] shadow-lg">
            <GetAvatar userAvatarData={avatarData} />
          </motion.div>
        </motion.div>
        <motion.h1
          className="text-2xl font-bold text-gray-800 "
          variants={itemVariants}
        >
          {t("في")}
        </motion.h1>
      </motion.div>
      <motion.div
        className="flex items-center justify-center w-56 h-56"
        variants={itemVariants}
      >
        <img
          src={sanabelAlEhsanLogo}
          alt="Sanabel Al Ehsan Logo"
          className="object-cover w-full h-full"
        />
      </motion.div>
    </motion.div>
  );
};

export default Intro;
