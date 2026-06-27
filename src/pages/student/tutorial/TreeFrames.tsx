import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, delay } from "framer-motion";
import Confetti from "react-confetti";
import { treeStages } from "../../../data/Tree";

// 0 5 15 16 30 37 47 51
const TreeProgress: React.FC<{
  setTreeFrames: (index: number) => void;
  treeFrames: number;
}> = ({ setTreeFrames, treeFrames }) => {
  const { t } = useTranslation();
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Slice the tree stages
  const slicedTree = useMemo(
    () => [2, 5, 15, 16, 30, 37, 47, 51].map((index) => treeStages[index]),
    []
  );
  const maxStage = slicedTree.length - 1;

  // Preload all images
  useEffect(() => {
    const imagePromises = slicedTree.map((src) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = reject;
      });
    });

    Promise.all(imagePromises)
      .then(() => setImagesLoaded(true))
      .catch((error) => console.error("Error preloading images:", error));
  }, [slicedTree]);

  // Animation interval effect
  useEffect(() => {
    if (!imagesLoaded) return;

    const intervalId = setInterval(() => {
      if (treeFrames < maxStage) {
        setTreeFrames(treeFrames + 1);
      } else {
        clearInterval(intervalId);
        setIsConfettiActive(true);

        // Automatically stop confetti after 5 seconds and reset frames after 1.5 seconds
        const confettiTimer = setTimeout(() => {
          setIsConfettiActive(false);
        }, 5000);

        const resetTreeTimer = setTimeout(() => {
          setTreeFrames(0);
        }, 5000);

        return () => {
          clearTimeout(confettiTimer);
          clearTimeout(resetTreeTimer);
        };
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [treeFrames, maxStage, setTreeFrames, imagesLoaded]);

  // Render loading state if images are not yet loaded
  if (!imagesLoaded) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#2C5E2E]"></div>
      </div>
    );
  }

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

      <motion.div
        className="text-center w-full mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-[#2C5E2E] drop-shadow-sm">
          {t("شجرة سنابل الإحسان")}
        </h1>
        <h2 className="text-2xl font-medium text-[#4A6741] mt-2">
          {t("كبر شجرتك")}
        </h2>
      </motion.div>

      <div className="flex flex-col justify-start items-center h-full w-full gap-2 overflow-y-auto">
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          src={slicedTree[treeFrames]}
          alt="tree"
          className="w-5/6 mb-8"
        />
      </div>
    </div>
  );
};

export default TreeProgress;
