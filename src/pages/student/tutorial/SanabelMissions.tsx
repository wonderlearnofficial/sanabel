import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
// Import React Icons
import { FaPray, FaMoon } from "react-icons/fa";
import { FaMosque } from "react-icons/fa";
import { IoTime } from "react-icons/io5";

import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";

import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";

interface SanabelType {
  id: number;
  title: string;
  image: string;
  color: string;
  bgColor: string;
  description: string;
  sanabels: {
    id: number;
    title: string;
    image: string;
    icon: React.ReactNode;
    description: string;
    missions: {
      text: string;
      icon: React.ReactNode;
    }[];
  }[];
}

// Map the resources
const resources = [
  { icon: blueSanabel },
  { icon: redSanabel },
  { icon: yellowSanabel },
  { icon: xpIcon },
];

// Import all the sanabel images
import { sanabelImgs } from "../../../data/SanabelImgs";

const SanabelOnboarding: React.FC = () => {
  const { t } = useTranslation();
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [currentSanabelIndex, setCurrentSanabelIndex] = useState(0);

  // Define the Sanabel types with detailed information and icons
  const sanabelTypes: SanabelType[] = [
    {
      id: 0,
      title: "سنابل الإحسان في العلاقة مع الله",
      image: sanabelType4Img,
      color: "from-emerald-600 to-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-600 to-emerald-400",
      description: "تعزيز علاقتك مع الله من خلال العبادات والأذكار اليومية",
      sanabels: [
        {
          id: 0,
          title: "الصلاة",
          image: sanabelImgs[0][0],
          icon: <FaPray className="w-6 h-6" />,
          description: "أعظم أركان الإسلام بعد الشهادتين",
          missions: [
            { text: "احرص على أداء الصلوات الخمس في وقتها", icon: <FaPray /> },
            { text: "خصص وقتاً لصلاة الضحى", icon: <IoTime /> },
            { text: "احرص على الذهاب إلى المسجد للصلاة", icon: <FaMosque /> },
            { text: "صل ركعتين قيام ليل", icon: <FaMoon /> },
          ],
        },
      ],
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
        staggerChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const type = sanabelTypes[currentTypeIndex];
  const sanabel = type.sanabels[currentSanabelIndex];

  const resources = [
    { icon: blueSanabel, value: 2 },
    { icon: redSanabel, value: 2 },
    { icon: yellowSanabel, value: 2 },
    { icon: xpIcon, value: 5 },
  ];

  return (
    <motion.div
      className={`flex-center  flex-col w-full h-full p-2 gap-4 py-8 text-white rounded-2xl `}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-2"
        variants={itemVariants}
      >
        <div className="w-16 h-16 p-2 rounded-full shadow-lg bg-white/20">
          <img
            src={type.image}
            alt={type.title}
            className="object-contain w-full h-full"
          />
        </div>
        <div className="w-3/4 ">
          <h2 className="text-lg">{t(type.title)}</h2>
        </div>
      </motion.div>

      {/* Sanabel spotlight */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentTypeIndex}-${currentSanabelIndex}`}
          className="w-full p-3 rounded-xl flex-center "
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col h-full gap-4">
            {/* Sanabel header */}
            <div className="flex items-center gap-3 ">
              <div className="flex items-center justify-center flex-shrink-0 p-2 rounded-full w-14 h-14 bg-white/20">
                {
                  <img
                    src={sanabel.image}
                    alt={sanabel.title}
                    className="object-contain w-full h-full"
                  />
                }
              </div>
              <div>
                <h3 className="text-xl font-bold">{t(sanabel.title)}</h3>
                <p className="text-sm text-white/80">
                  {t(sanabel.description)}
                </p>
              </div>
            </div>

            {/* Missions */}

            <h4 className="flex items-center gap-2 my-2 text-lg font-semibold">
              <span>{t("تحديات")}</span>
              <div className="flex-1 h-px bg-white/30"></div>
            </h4>
            <div className="space-y-3 ">
              {sanabel.missions.map((mission, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-3 p-3 transition-colors border-2 rounded-lg border-white/20"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: idx * 0.2 + 0.3, duration: 0.4 },
                  }}
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-lg rounded-full bg-white/20">
                    {mission.icon}
                  </div>
                  <span className="flex-1 text-sm">{t(mission.text)}</span>
                  <div className="flex gap-1 p-2 bg-white/10 rounded-2xl">
                    {resources.map((resource, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-0"
                      >
                        <img
                          src={resource.icon}
                          alt="icon"
                          className="w-auto h-6"
                          loading="lazy"
                        />
                        <h1 className="text-sm text-white">{resource.value}</h1>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default SanabelOnboarding;
