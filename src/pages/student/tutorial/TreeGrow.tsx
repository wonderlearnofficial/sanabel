import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// Tree Stages
import frame1 from "../../../assets/tree/0.png";
import frame2 from "../../../assets/tree/0-1.png";
import frame3 from "../../../assets/tree/0-2.png";
import frame4 from "../../../assets/tree/1.png";

import waterImg from "../../../assets/resources/ماء.png";
import fertilizerImg from "../../../assets/resources/سماد.png";
import treeHeader from "../../../assets/lqei3f4z.png";

import Confetti from "react-confetti";

const TreeProgress: React.FC<{
  setTreeProgress: (index: number) => void;
  treeProgress: number;
}> = ({ setTreeProgress, treeProgress }) => {
  const { t } = useTranslation();
  const treeStages = [frame1, frame2, frame3, frame4];

  const [currentWater, setCurrentWater] = useState(0);
  const [currentFertilizer, setCurrentFertilizer] = useState(0);

  const [isTreePlanted, setIsTreePlanted] = useState(false);

  const waterNeeded = 1;
  const fertilizerNeeded = 1;

  const handlePlantTree = () => {
    if (!isTreePlanted) {
      // Initial planting
      setIsTreePlanted(true);
      setCurrentWater(0);
      setCurrentFertilizer(0);
      setTreeProgress(1);
    } else if (isTreePlanted && treeProgress === 1) {
      // Instantly progress through animation frames

      setTreeProgress(2);
      setTimeout(() => {
        setTreeProgress(3);
      }, 1500);
      setTimeout(() => {
        setCurrentWater(1);
        setCurrentFertilizer(1);
      }, 1500);
    } else if (treeProgress === 3) {
      // Progress to final stage (frame 4)
      if (
        currentWater === waterNeeded &&
        currentFertilizer === fertilizerNeeded
      ) {
        setTimeout(() => {
          setTreeProgress(4);
        }, 1500);
      }
    }
  };

  const [isConfettiActive, setIsConfettiActive] = useState(false);

  useEffect(() => {
    if (treeProgress === 4) {
      // Activate confetti when tree reaches final stage
      setIsConfettiActive(true);

      // Automatically stop confetti after 5 seconds
      const confettiTimer = setTimeout(() => {
        setIsConfettiActive(false);
      }, 5000);

      return () => clearTimeout(confettiTimer);
    }
  }, [treeProgress]);

  return (
    <div className="relative flex flex-col gap-2 w-full h-full">
      {/* Confetti overlay */}
      {isConfettiActive && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={100}
            gravity={0.5}
          />
        </div>
      )}

      {/* Header Section */}
      <motion.div
        className="text-center w-full"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!isTreePlanted && (
          <motion.img
            src={treeHeader}
            alt="Shop"
            className="mx-auto h-28 w-auto mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          />
        )}

        <h1 className="text-3xl font-bold text-black/80 mb-4">
          {t("شجرة سنابل الإحسان")}
        </h1>
        {isTreePlanted && treeProgress == 4 && (
          <p className="text-lg text-green-700">{t("هذه شجرتك الآن، أحسنت")}</p>
        )}
      </motion.div>

      <div className="flex flex-col h-full w-full items-center justify-between">
        <div className="w-full flex flex-col gap-1">
          <div className="flex w-full h-full justify-between">
            {/* Water Indicator */}
            {isTreePlanted && treeProgress > 1 && treeProgress < 4 && (
              <div className="flex items-center flex-col w-max gap-1">
                <img src={waterImg} alt="Water Icon" className="w-8" />
                <div className="relative w-full h-full rounded-2xl bg-[#D1E2EA] overflow-hidden">
                  <motion.div
                    initial={{ height: "0%" }}
                    animate={{
                      height: `${(currentWater / waterNeeded) * 100}%`,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-0 w-full rounded-2xl bg-gradient-to-t from-[#4AAAD6] to-[#8ED6F8] transition-all duration-100"
                    style={{
                      height: `${(currentWater / waterNeeded) * 100}%`,
                    }}
                  ></motion.div>
                </div>
              </div>
            )}

            {isTreePlanted && treeProgress > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  className={`flex-center flex-col mx-auto w-10/12 h-auto`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <img
                    src={treeStages[treeProgress - 1]}
                    className="h-full w-full transition-transform duration-500 ease-in-out transform scale-100"
                    alt={`Tree Stage ${treeProgress}`}
                  />
                </motion.div>
              </AnimatePresence>
            ) : null}

            {/* Fertilizer Indicator */}
            {isTreePlanted && treeProgress > 1 && treeProgress < 4 && (
              <div className="flex items-center flex-col w-max gap-1">
                <img src={fertilizerImg} alt="fertilizerImg" className="w-8" />
                <div className="w-full flex justify-center items-end h-full rounded-2xl bg-[#D1E2EA] text-black relative">
                  <motion.div
                    className="absolute bottom-0 w-full rounded-2xl bg-gradient-to-t from-[#7F4333] to-[#b46a56] transition-all duration-100"
                    initial={{ height: "0%" }}
                    animate={{
                      height: `${
                        (currentFertilizer / fertilizerNeeded) * 100
                      }%`,
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      height: `${
                        (currentFertilizer / fertilizerNeeded) * 100
                      }%`,
                    }}
                  ></motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {treeProgress < 4 && (
        <motion.div
          onClick={handlePlantTree}
          initial={{ opacity: 0.8, y: -20 }}
          animate={{
            opacity: 1,
            y: 20,
            scale: [1, 1.02, 1],
            transition: {
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
          className={`
          flex-center 
          w-11/12 
          p-2 
          bg-[#4e8d3a] 
          text-white 
          rounded-2xl 
          mx-auto 
          cursor-pointer 
          shadow-lg 
          hover:shadow-xl 
          transition-all 
          duration-300
          ${isTreePlanted && treeProgress > 0 ? "mt-24 my-6" : "my-6"}
        `}
        >
          <h1 className="text-md w-full text-center font-bold">
            {treeProgress === 0
              ? t("ابدأ")
              : treeProgress < 3
              ? t("ازرع شجرتك")
              : t("كبر شجرتك")}
          </h1>
        </motion.div>
      )}
    </div>
  );
};

export default TreeProgress;
