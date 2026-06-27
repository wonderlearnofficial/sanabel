import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { useHistory } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { medalsImgs } from "../../../data/Medals";
import lock from "../../../icons/lock.svg";
import { AnimatePresence, motion, useAnimation } from "framer-motion";

import { medalsData } from "../../../data/MedalsData";

const StudentTutorial: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Initial configs for XP system
  const [currentXp, setCurrentXp] = useState(0);
  const [neededXp, setNeededXp] = useState(100);
  const [level, setLevel] = useState(1);
  const [medalImgTracker, setMedalImgTracker] = useState(0);
  const progressAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [isLevelUpAnimating, setIsLevelUpAnimating] = useState(false);

  // Function to handle level up
  const handleLevelUp = () => {
    setIsLevelUpAnimating(true);

    // Find the next medal level or loop back to beginning
    let nextMedalIndex;
    if (medalImgTracker >= medalsData.length - 1) {
      // If we've reached the last medal, loop back to the first one
      nextMedalIndex = 0;
    } else {
      nextMedalIndex = medalImgTracker + 1;
    }

    // Update level to the new medal's level
    const newLevel = medalsData[nextMedalIndex].level;

    // After a short delay, update the medal and level
    setTimeout(() => {
      setLevel(newLevel);
      setMedalImgTracker(nextMedalIndex);
      setCurrentXp(0); // Reset XP
      setIsLevelUpAnimating(false);
    }, 1000);
  };

  // Start progress animation
  useEffect(() => {
    const startProgressAnimation = () => {
      if (progressAnimationRef.current) {
        clearInterval(progressAnimationRef.current);
      }

      progressAnimationRef.current = setInterval(() => {
        setCurrentXp((prev) => {
          // If we've reached max XP, trigger level up
          if (prev >= neededXp && !isLevelUpAnimating) {
            handleLevelUp();
            return prev; // Keep current XP until animation completes
          }
          return Math.min(prev + 1, neededXp);
        });
      }, 5); // Adjust speed as needed
    };

    startProgressAnimation();

    // Cleanup
    return () => {
      if (progressAnimationRef.current) {
        clearInterval(progressAnimationRef.current);
      }
    };
  }, [medalImgTracker, neededXp, isLevelUpAnimating]);

  // Get the next medal (for display purposes)
  const getNextMedalIndex = () => {
    return medalImgTracker >= medalsData.length - 1 ? 0 : medalImgTracker + 1;
  };
  const currentLanguage = localStorage.getItem("language");
  return (
    <motion.div
      className="flex flex-col items-center justify-center w-full gap-6 flex-center"
      dir={currentLanguage === "en" ? "ltr" : "rtl"}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: -30, transition: { duration: 0.4 } }}
    >
      <motion.h1
        className="text-3xl font-bold text-black"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {t("المستوي")} {level}
      </motion.h1>

      <div className="w-4/5 max-w-sm">
        <div className="w-full bg-[#fab70030] rounded-full h-8 flex items-center relative overflow-hidden">
          <motion.div
            className="bg-[#F3B14E] rounded-full h-8 absolute top-0 left-0"
            style={{ width: `${(currentXp / neededXp) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-sm">0</span>
          <span className="text-sm">{neededXp} XP</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="flex items-center mt-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          key={medalImgTracker}
        >
          <motion.div
            className="mx-4 text-center"
            animate={
              isLevelUpAnimating
                ? { scale: [1, 1.2, 1], transition: { duration: 0.5 } }
                : {}
            }
          >
            <img
              src={medalsData[medalImgTracker].img}
              alt="Current Medal"
              className="w-24 h-24 mx-auto"
            />
            <p className="mt-2 text-lg font-medium text-black">
              {t(medalsData[medalImgTracker].title)}
            </p>
          </motion.div>

          {level < 200 && (
            <motion.div
              className={`flex items-center justify-center p-2 bg-yellow-100 rounded-full `}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <svg
                className={`w-8 h-8 text-yellow-500  ${
                  currentLanguage == "ar" ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          )}
          {level < 200 && (
            <div className="mx-4 text-center">
              <div className="relative">
                <img
                  src={medalsData[getNextMedalIndex()].img}
                  alt="Next Medal"
                  className="w-24 h-24 mx-auto opacity-40"
                />
                <img
                  src={lock}
                  alt="lock"
                  className="absolute w-10 h-10 transform -translate-x-1/2 -translate-y-1/2 top-1/4 left-1/4"
                />
              </div>
              <p className="mt-2 text-lg font-medium text-gray-500">
                {t(medalsData[getNextMedalIndex()].title)}
              </p>
              <p className="text-xs text-gray-400">
                {t("المستوي")} {medalsData[getNextMedalIndex()].level}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentTutorial;
