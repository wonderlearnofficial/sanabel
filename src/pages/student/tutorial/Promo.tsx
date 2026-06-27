import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Gift,
  Users,
  Star,
  Gamepad,
  Award,
  TrendingUp,
  Crown,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import sanabelAlEhsanLogo from "../../../assets/login/logo.png";

import {
  FaBullseye,
  FaStar,
  FaTrophy,
  FaHandHoldingHeart,
  FaRankingStar,
  FaGamepad,
  FaWandMagicSparkles,
  FaCircleNotch,
} from "react-icons/fa6";

const colors = {
  blueprimary: "#3B82F6", // More vibrant blue
  redprimary: "#EF4444", // Brighter red
  yellowprimary: "#F59E0B", // Warmer yellow
  greenprimary: "#10B981", // Fresh mint green
  purpleprimary: "#8B5CF6", // Fun purple
  pinkprimary: "#EC4899", // Playful pink

  background: "#F9FAFB", // Ultra-light background
  text: "#1F2937", // Deep gray for text
};

const SanabelFeaturesPage = () => {
  const { t } = useTranslation();

  const features = [
    {
      Icon: FaBullseye,
      title: "التحديات اليومية",
      description: "خطوات بسيطة لتعلم العطاء ومساعدة الآخرين",
      color: colors.redprimary,
    },
    {
      Icon: FaStar,
      title: "نظام النقاط",
      description: "تتبع تقدمك والمنافسة مع الأصدقاء",
      color: colors.yellowprimary,
    },
    {
      Icon: FaGamepad,
      title: "الألعاب التعليمية",
      description: "تعلم العطاء عبر ألعاب مسلية",
      color: colors.blueprimary,
    },
    {
      Icon: FaWandMagicSparkles,
      title: "تصميم تفاعلي",
      description: "رسومات كرتونية وأنيميشن جذابة",
      color: colors.greenprimary,
    },
    {
      Icon: FaHandHoldingHeart,
      title: "إرشادات الوالدين",
      description: "خطوات عملية لتعزيز دور الأهل",
      color: colors.redprimary,
    },

    {
      Icon: FaTrophy,
      title: "المكافآت والجوائز",
      description: "اجمع النقاط واستبدلها بمفاجآت رائعة",
      color: colors.yellowprimary,
    },

    {
      Icon: FaCircleNotch,
      title: "تتبع التقدم",
      description: "راقب تطورك وانمِ مهاراتك بشكل مستمر",
      color: colors.blueprimary,
    },
    {
      Icon: FaRankingStar,
      title: "لوحات المتصدرين",
      description: "تنافس مع أصدقائك واحتل المراكز الأولى",
      color: colors.yellowprimary,
    },
  ];

  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % features.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="h-[80vh] flex flex-col w-full items-center justify-center p-2"
    >
      <motion.div className="w-[70%] h-auto  my-4">
        <img
          src={sanabelAlEhsanLogo}
          alt="Sanabel Al Ehsan Logo"
          className="object-contain w-full h-full"
        />
      </motion.div>

      <div className="flex flex-col items-center justify-center w-full ">
        <div className="flex justify-between w-full h-3 gap-1">
          {features.map((_, i) => (
            <motion.div
              key={i}
              className="h-full w-[15%] rounded-md border-2 bg-[#AAA]"
              style={{
                backgroundColor: i <= index ? features[index].color : "",
                opacity: i <= index ? 1 : 0.2,
                border: `1px solid ${
                  i <= index ? features[index].color : "#e5e7eb"
                }`,
              }}
              animate={{
                backgroundColor: i <= index ? features[index].color : "",
                borderColor: i <= index ? features[index].color : "#e5e7eb",
                scale: i === index ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                scale: {
                  duration: 0.8,
                  repeat: i === index ? Infinity : 0,
                  repeatType: "reverse",
                  repeatDelay: 1,
                },
              }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: 50, opacity: 0, scale: 0.8 }}
            animate={{
              x: 0,
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            exit={{
              y: -50,
              opacity: 0,
              scale: 0.9,
              transition: {
                duration: 0.4,
              },
            }}
            className="rounded-2xl p-2 gap-2 flex-center flex-col items-center text-center w-[90vw]  py-10"
          >
            <motion.div
              className="p-4 mb-4 rounded-full"
              style={{
                backgroundColor: features[index].color + "1A",
              }}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{
                scale: { repeat: Infinity, duration: 2, repeatType: "reverse" },
                rotate: {
                  repeat: Infinity,
                  duration: 3,
                  repeatType: "reverse",
                },
              }}
            >
              {React.createElement(features[index].Icon, {
                size: 60,
                style: { color: features[index].color },
              })}
            </motion.div>
            <motion.h3
              className="text-2xl font-bold text-black"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ color: features[index].color }}
            >
              {t(features[index].title)}
            </motion.h3>
            <motion.h3
              className="w-full h-10 text-lg text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {t(features[index].description)}
            </motion.h3>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SanabelFeaturesPage;
