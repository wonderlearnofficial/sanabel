import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import trophyImg from "../../../assets/trophy.png";
import trophies from "../../../data/TrophiesImgs";
import OtherTrophies from "../../../data/SanabelImgsDictionary";

import missionsImg from "../../../assets/target.png";
import mixSanabel from "../../../assets/resources/سنابل.png";
const Trophies: React.FC<{
  setTrophyIndex: (index: number) => void;
  trophyIndex: number;
}> = ({ trophyIndex, setTrophyIndex }) => {
  const { t } = useTranslation();

  // States for active trophy slides
  const [activeSanabel, setActiveSanabel] = useState(0);
  const [activeOther, setActiveOther] = useState(0);

  // Auto-slide logic
  useEffect(() => {
    const sanabelInterval = setInterval(() => {
      setActiveSanabel((prev) => (prev + 1) % trophies.length);
    }, 3000);
    const otherInterval = setInterval(() => {
      setActiveOther((prev) => (prev + 1) % OtherTrophies.length);
    }, 3000);

    return () => {
      clearInterval(sanabelInterval);
      clearInterval(otherInterval);
    };
  }, []);

  // Animation variants
  const fadeVariants = {
    hidden: { opacity: 0, scale: 0.8, x: 50 },
    visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.8 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.5 } },
  };

  const buttons = [
    {
      label: t("جوائز السنابل"),
      imgSrc: missionsImg,
      bgColor: "bg-yellowprimary",
      textColor: "text-white",
      borderColor: "border-yellowprimary",
      index: 0,
    },
    {
      label: t("جوائز أخرى"),
      imgSrc: mixSanabel,
      bgColor: "bg-blueprimary",
      textColor: "text-white",
      borderColor: "border-blueprimary",
      index: 1,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-between w-full gap-6 p-1 h-3/4 ">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="flex-col w-full text-black flex-center mb-7"
      >
        <img src={trophyImg} alt="" className="w-1/3" />
        <h1 className="text-3xl font-bold">{t("الجوائز")}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="flex flex-row-reverse w-full gap-2 text-lg flex-center "
      >
        {buttons.map((button, idx) => (
          <div
            key={idx}
            className={`p-2 px-1 gap-2 rounded-2xl w-1/2 flex-center ${
              trophyIndex === button.index
                ? `${button.bgColor} ${button.textColor}`
                : `border-2 ${button.borderColor} bg-white/50 text-${
                    button.borderColor.split("-")[1]
                  }`
            }`}
            onClick={() => setTrophyIndex(button.index)}
          >
            <img
              src={button.imgSrc}
              alt=""
              className="h-8 p-1 rounded-full bg-white/20"
            />
            <h2 className="text-sm font-bold text-end">{button.label}</h2>
          </div>
        ))}
      </motion.div>

      <div className="flex flex-col w-full gap-2">
        <div className="flex items-center justify-center w-full p-4 rounded-lg">
          <div className="flex items-center flex-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={`current-${activeSanabel}`}
                src={
                  trophyIndex == 0
                    ? trophies[activeSanabel]
                    : OtherTrophies[activeOther]
                }
                alt={`جائزة ${activeSanabel + 1}`}
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="object-contain w-2/3 mx-4 h-2/3"
              />
            </AnimatePresence>
          </div>
        </div>

        <p className="w-4/5 mx-auto text-lg font-bold text-center text-gray-700">
          {trophyIndex == 0
            ? t("هذه الجوائز المميزة تكسبها عند إكمال مهام سنابل")
            : t("هذه الجوائز تكسبها من خلال إنجازات متنوعة أخرى")}
        </p>
      </div>
    </div>
  );
};

export default Trophies;
