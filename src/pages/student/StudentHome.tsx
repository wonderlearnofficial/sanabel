import { API_BASE_URL } from "../../config/api";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import i18n from "../../i18n";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useUserContext } from "../../context/StudentUserProvider";

import Greeting from "../../components/Greeting";
import Notification from "../../components/Notification";

import missionsDoneImg from "../../assets/target.png";

import SanabelTree from "../../components/tree/SanabelTree";
import Inventory from "../../components/tree/Inventory";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { calculateLevel } from "../../utils/LevelCalculator";
import { medalsData } from "../../data/MedalsData";

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const StudentHome: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { user } = useUserContext();
  const xp = Number(user?.xp);

  const [missionsDoneToday, setMissionsDoneToday] = useState(0);
  const [isMissionsLoading, setIsMissionsLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  const { level, remainingXp, xpForNextLevel } = calculateLevel(xp);
  const currentXp = remainingXp;
  const neededXp = xpForNextLevel;

  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 3000);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level]);

  const fetchUserData = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      setIsMissionsLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/students/task-count-sucess`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      if (response.status === 200) {
        setMissionsDoneToday(response.data.completedTasksCount);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsMissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const [medalImgTracker, setMedalImgTracker] = useState(0);
  useEffect(() => {
    if (level < 5) setMedalImgTracker(0);
    else if (level < 10) setMedalImgTracker(1);
    else if (level < 25) setMedalImgTracker(2);
    else if (level < 50) setMedalImgTracker(3);
    else if (level < 75) setMedalImgTracker(4);
    else if (level < 100) setMedalImgTracker(5);
    else if (level < 150) setMedalImgTracker(6);
    else if (level < 200) setMedalImgTracker(7);
    else setMedalImgTracker(8);
  }, [xp]);

  const isLoading = !user;
  const safemedal = Math.min(medalImgTracker, medalsData.length - 1);

  return (
    <div
      className="flex flex-col items-center w-full gap-3 p-3 overflow-y-auto"
      id="page-height"
    >
      {/* Level-up celebration overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="px-8 py-6 text-center text-white bg-yellow-400 shadow-2xl rounded-3xl"
              initial={{ scale: 0.7 }}
              animate={{ scale: [0.7, 1.05, 1] }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-1 text-4xl">🎉</div>
              <h2 className="text-2xl font-bold">{t("ترقية مستوى!")}</h2>
              <p className="text-lg opacity-90">
                {t("المستوى")} {level}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex flex-row items-center justify-between w-full">
        {isLoading ? (
          <>
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <Skeleton className="w-10 h-10" />
          </>
        ) : (
          <>
            <Greeting
              name={`${t("مرحباً")} ${user?.firstName}`}
              text={"هيا بنا نصنع الخير معًا"}
            />
            <Notification />
          </>
        )}
      </div>

      <motion.div
        className="flex flex-col items-center w-full gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* XP / Level card */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-1 rounded-xl w-full shadow-md p-2 border-[1px] border-[#33333325] cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => history.push("/student/progress")}
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Skeleton className="w-32 h-5" />
                <Skeleton className="w-16 h-16 rounded-full" />
              </div>
              <Skeleton className="w-full h-8" />
              <div className="flex justify-between">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          ) : (
            <>
              <div className="w-full gap-3 flex-center">
                <div className="flex flex-col items-start w-full">
                  <div className="text-lg font-bold text-black flex-center">
                    <p className="text-lg font-bold text-black">
                      {t("المستوى")} {level}
                    </p>
                  </div>
                  <div className="flex-center font-bold text-[#B3B3B3] text-xs">
                    <span>{t("نقطة خبرة للوصول إلى المستوى التالي")}</span>
                    &nbsp;
                    <span>{neededXp - currentXp}</span>
                  </div>
                </div>
                <img
                  className="w-auto h-16"
                  src={medalsData[safemedal].img}
                  alt="medal"
                />
              </div>

              <div className="w-full bg-[#fab70050] rounded-3xl h-8 flex justify-end items-center relative overflow-hidden">
                <div className="text-[#997000] px-3 relative z-10">
                  <span dir="ltr">
                    <span className="font-bold text-black">{currentXp}</span>
                    <span className="text-black">/</span>
                    <span className="text-[#997000]">{neededXp}</span>
                  </span>
                </div>
                <motion.div
                  className={`bg-[#F3B14E] rounded-3xl h-8 absolute top-0 ${
                    i18n.language === "ar" ? "right-0" : "left-0"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentXp / neededXp) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-[#999999]">{t("المستوي التالي")}</span>
                <span className="text-[#999999]">
                  {t("تم إنجاز")} {currentXp} {t("نقطة")}
                </span>
              </div>
            </>
          )}
        </motion.div>

        {/* Inventory */}
        <motion.div variants={itemVariants} className="w-full">
          {isLoading ? (
            <div className="flex flex-col w-full shadow-md p-2 border border-[#33333325] rounded-xl gap-2">
              <Skeleton className="w-32 h-5" />
              <div className="flex justify-between w-full gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="flex-1 h-16" />
                ))}
              </div>
            </div>
          ) : (
            <Inventory
              waterCount={Number(user?.water)}
              fertilizerCount={Number(user?.fertilizer)}
              blueCount={Number(user?.snabelBlue)}
              redCount={Number(user?.snabelRed)}
              yellowCount={Number(user?.snabelYellow)}
            />
          )}
        </motion.div>

        {/* Missions done today */}
        <motion.div
          variants={itemVariants}
          className="w-full bg-[#4AAAD6] flex justify-between items-center p-1 px-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[#3a9ac6] active:scale-[0.98]"
          onClick={() => history.push("/student/challenges")}
        >
          {isMissionsLoading ? (
            <div className="flex items-center justify-between w-full gap-2">
              <Skeleton className="w-8 h-6" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>
          ) : (
            <>
              <span className="text-lg font-bold text-white" dir="ltr">
                {missionsDoneToday}
              </span>
              <div className="gap-3 flex-center">
                <span
                  className="text-sm font-bold text-white text-end"
                  dir="ltr"
                >
                  {t("التحديات التي تم إنجازها اليوم")}
                </span>
                <img src={missionsDoneImg} alt="" className="w-8" />
              </div>
            </>
          )}
        </motion.div>

        {/* Tree */}
        <motion.div
          variants={itemVariants}
          className="flex-1 w-full min-h-[180px]"
        >
          {isLoading ? (
            <Skeleton className="w-full h-[180px]" />
          ) : (
            <SanabelTree />
          )}
        </motion.div>
      </motion.div>

      <StudentNavbar />
    </div>
  );
};

export default StudentHome;
