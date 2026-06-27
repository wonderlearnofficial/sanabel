import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { motion, AnimatePresence } from "framer-motion";

// Sanabel type images
import sanabelType1Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType2Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";
import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";

const SanabelOnboarding: React.FC = () => {
  const { t } = useTranslation();

  const sanabelTypes = [
    {
      id: 0,
      title: "مع الله",
      img: sanabelType4Img,
      color: "bg-blueprimary",
    },
    {
      id: 1,
      title: "النفس",
      img: sanabelType2Img,
      color: "bg-redprimary",
    },
    {
      id: 2,
      title: "الاسرة والمجتمع",
      img: sanabelType1Img,
      color: "bg-yellowprimary",
    },
    {
      id: 3,
      title: "الارض والكون",
      img: sanabelType3Img,
      color: "bg-greenprimary",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.3,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex-col w-full gap-4 flex-center ">
      <motion.div
        className="flex flex-col items-center justify-center w-full h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.h2
          className="mb-8 text-3xl font-medium text-center text-black"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {t("انواع السنابل")}
        </motion.h2>
        <motion.div
          className="grid w-full grid-cols-2 gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.5,
              },
            },
          }}
        >
          {sanabelTypes.map((type) => (
            <motion.div
              key={type.id}
              className={`rounded-xl w-full p-4 flex-center flex-col shadow-lg bg-gradient-to-br ${type.color} text-white`}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: type.id * 0.2, duration: 0.5 },
              }}
            >
              <div className="flex items-center justify-center w-24 h-24 p-2 mb-4 rounded-full bg-white/90">
                <img
                  src={type.img}
                  alt={type.title}
                  className="object-contain w-20 h-20"
                />
              </div>
              <motion.div className="w-full text-center">
                <h3 className="mb-1 text-md text-white/60">
                  {t("سنابل الإحسان")}
                </h3>
                <h1 className="text-md text-white/60">{t("في العلاقة مع")}</h1>
                <h1 className="my-1 text-lg font-bold">{t(type.title)}</h1>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SanabelOnboarding;
