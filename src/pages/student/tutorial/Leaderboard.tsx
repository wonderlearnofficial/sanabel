import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import LeaderboardsStar from "../../../icons/Leaderboards/LeaderboardsStar";
import FirstPlaceColumn from "../../../icons/Leaderboards/FirstPlaceColumn";
import SecondPlaceColumn from "../../../icons/Leaderboards/SecondPlaceColumn";
import ThirdPlaceColumn from "../../../icons/Leaderboards/ThirdPlaceColumn";
import { delay, motion } from "framer-motion";
import MedalAndLevel from "../../../components/MedalAndLevel";

import avatar1 from "../../../assets/avatars/Boys/1.png";
import avatar2 from "../../../assets/avatars/Boys/4.png";
import avatar3 from "../../../assets/avatars/Girls/1.png";
const Leaderboards: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  const [showWeekOrDay, setShowWeekOrDay] = useState<"day" | "week">("day");

  type LeaderboardEntry = {
    name: string;
    level: number;
    color: string;
    avatar: string;
    stage: string;
    grade: string;
    class: string;
  };

  type LeaderboardData = {
    day: LeaderboardEntry[];
    week: LeaderboardEntry[];
  };

  // Sample leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    day: [
      {
        name: "سارة حسن",
        level: 88,
        color: "bg-yellowprimary",
        avatar: avatar3,
        stage: "secondary",
        grade: "10",
        class: "1",
      },

      {
        name: "عمر شريف",
        level: 125,
        color: "bg-orangeprimary",
        avatar: avatar2,
        stage: "primary",
        grade: "2",
        class: "1",
      },

      {
        name: "احمد جمال",
        level: 206,
        color: "bg-pinkprimary",
        avatar: avatar1,
        stage: "primary",
        grade: "4",
        class: "2",
      },
    ],
    week: [
      {
        name: "سارة حسن",
        level: 702,
        color: "bg-yellowprimary",
        avatar: avatar1,
        stage: "primary",
        grade: "6",
        class: "3",
      },

      {
        name: "أحمد جمال",
        level: 700,
        color: "bg-greenprimary",
        avatar: avatar1,
        stage: "secondary",
        grade: "11",
        class: "3",
      },

      {
        name: "عمر شريف",
        level: 700,
        color: "bg-orangeprimary",
        avatar: avatar1,
        stage: "preparatory",
        grade: "9",
        class: "2",
      },
    ],
  });

  // Sort leaderboard data by points in descending order based on `showWeekOrDay`
  const sortedData = leaderboardData[showWeekOrDay].sort(
    (a: LeaderboardEntry, b: LeaderboardEntry) => b.level - a.level
  );

  // Animation Variants
  const columnVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
  };

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const currentLanguage = localStorage.getItem("language");
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full gap-2"
      dir={currentLanguage === "en" ? "ltr" : "rtl"}
    >
      <motion.h1
        className="text-2xl font-bold text-center text-black"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {t("لوحة المتصدرين")}
      </motion.h1>
      <motion.h1
        className="text-md font-bold text-center text-[#999] w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 1 }}
      >
        {t("نافس أصدقاءك واظهر اسمك في قائمة الأفضل")}
      </motion.h1>
      {/* leaderboards places */}
      <div className="flex flex-col w-full gap-2 px-1 py-5 ">
        {/* Leaderboards for top 3 */}
        <motion.div
          className="flex items-end justify-between w-full"
          initial="hidden"
          animate="visible"
          variants={listVariants}
          transition={{ duration: 1, ease: "easeOut", delay: 2 }}
        >
          <motion.div
            className="flex flex-col items-center w-1/3"
            variants={columnVariants}
          >
            <div className="relative w-20 h-20 border-2 rounded-full border-blueprimary">
              <img
                className="w-[75px] h-[75px] rounded-full absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 bg-blueprimary/80"
                src={sortedData[0].avatar}
              />
              <div className="absolute top-0 p-4 text-center transform -translate-x-1/2 -translate-y-1/2 flex-center left-1/2">
                <LeaderboardsStar size={40} className="text-blueprimary" />
              </div>
            </div>
            <h1 className="text-black">{t(sortedData[0].name)}</h1>
            <div className="scale-90">
              <MedalAndLevel
                level={sortedData[0].level}
                color="text-blueprimary"
                dir={""}
                size={""}
              />
            </div>

            <FirstPlaceColumn className="w-full" />
          </motion.div>
          <motion.div
            className="flex flex-col items-center w-1/3 -order-1"
            variants={columnVariants}
          >
            <img
              className="w-20 h-20 rounded-full bg-redprimary/80"
              src={sortedData[1].avatar}
            />
            <h1 className="text-black">{t(sortedData[1].name)}</h1>
            <div className="scale-90">
              <MedalAndLevel
                level={sortedData[1].level}
                color={"text-redprimary"}
                dir={""}
                size={""}
              />
            </div>
            <SecondPlaceColumn className="w-full" />
          </motion.div>
          <motion.div
            className="flex flex-col items-center w-1/3"
            variants={columnVariants}
          >
            <img
              className="w-20 h-20 rounded-full bg-yellowprimary/80"
              src={sortedData[2].avatar}
            />
            <h1 className="text-black">{t(sortedData[2].name)}</h1>
            <div className="scale-90">
              <MedalAndLevel
                level={sortedData[2].level}
                color={"text-yellowprimary"}
                dir={""}
                size={""}
              />
            </div>
            <ThirdPlaceColumn className="w-full " />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboards;
