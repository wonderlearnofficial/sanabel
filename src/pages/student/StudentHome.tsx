import StudentNavbar from "../../components/navbar/StudentNavbar";
import i18n from "../../i18n";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useUserContext } from "../../context/StudentUserProvider";

import Greeting from "../../components/Greeting";
import Notification from "../../components/Notification";

import { medalsImgs } from "../../data/Medals";

import missionsDoneImg from "../../assets/target.png";
// Inventory Assets

import waterImg from "../../assets/resources/ماء.png";
import fertilizerImg from "../../assets/resources/سماد.png";
import redImg from "../../assets/resources/سنبلة حمراء.png";
import yellowImg from "../../assets/resources/سنبلة صفراء.png";
import blueImg from "../../assets/resources/سنبلة زرقاء.png";

// Tree
import { treeStages } from "../../data/Tree";

import SanabelTree from "../../components/tree/SanabelTree";
import Inventory from "../../components/tree/Inventory";
import { motion } from "framer-motion";
import axios from "axios";
import { calculateLevel } from "../../utils/LevelCalculator";

import { medalsData } from "../../data/MedalsData";

const StudentHome: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { user } = useUserContext();
  const xp = Number(user?.xp);

  const [missionsDoneToday, setMissionsDoneToday] = useState(0);
  // Function to fetch user data

  const fetchUserData = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await axios.get(
        "https://sanabel.wonderlearn.net/students/task-count-sucess",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        setMissionsDoneToday(response.data.completedTasksCount);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const { level, remainingXp, xpForNextLevel } = calculateLevel(xp);

  const currentXp = remainingXp;
  const neededXp = xpForNextLevel;

  const inventory = [
    { name: "سنبلة", img: blueImg },
    { name: "سنبلة", img: yellowImg },
    { name: "سنبلة", img: redImg },
    { name: "سماد", img: fertilizerImg },
    { name: "ماء", img: waterImg },
  ];

  // Update level and medal
  const [medalImgTracker, setMedalImgTracker] = useState(0);
  useEffect(() => {
    if (level < 5) {
      setMedalImgTracker(0);
    } else if (level >= 5 && level < 10) {
      setMedalImgTracker(1);
    } else if (level >= 10 && level < 25) {
      setMedalImgTracker(2);
    } else if (level >= 25 && level < 50) {
      setMedalImgTracker(3);
    } else if (level >= 50 && level < 75) {
      setMedalImgTracker(4);
    } else if (level >= 75 && level < 100) {
      setMedalImgTracker(5);
    } else if (level >= 100 && level < 150) {
      setMedalImgTracker(6);
    } else if (level >= 150 && level < 200) {
      setMedalImgTracker(7);
    } else {
      setMedalImgTracker(8);
    }
  }, [xp]);

  return (
    <div
      className="flex flex-col items-center w-full gap-3 p-3 overflow-y-auto"
      id="page-height"
    >
      <div className="flex flex-row items-center justify-between w-full">
        <Greeting
          name={`${t("مرحباً")} ${user?.firstName}`}
          text={"هيا بنا نصنع الخير معًا"}
        />
        <Notification />
      </div>

      <div className="flex flex-col gap-1 rounded-xl w-full shadow-md p-2 relative border-[1px] border-[#33333325]  ">
        {/* Medal and Level */}
        <div className="w-full gap-3 flex-center">
          <div className="flex flex-col items-start w-full ">
            <div className="text-lg font-bold text-black flex-center">
              <p className="text-lg font-bold text-black">
                {t("المستوى")} {level}
              </p>
            </div>
            <div className="flex-center font-bold text-[#B3B3B3] text-xs ">
              <h1> {t("نقطة خبرة للوصول إلى المستوى التالي")} </h1>
              &nbsp;
              <h1> {neededXp - currentXp} </h1>
            </div>
          </div>
          <img
            className="w-auto h-16 "
            src={medalsData[medalImgTracker].img}
          ></img>
        </div>
        <div className="w-full bg-[#fab70050] rounded-3xl h-8 flex justify-end items-center relative overflow-hidden">
          {/* Text displaying current and needed XP */}
          <div
            className={`text-[#997000] px-3 relative z-10 ${
              i18n.language === "ar" ? "" : "flex"
            } `}
          >
            <span className="text-black">{neededXp}/</span>
            {currentXp}
          </div>

          {/* Progress bar */}
          <motion.div
            className={`bg-[#F3B14E] rounded-3xl h-8 absolute top-0  ${
              i18n.language === "ar" ? "right-0" : "left-0"
            }`}
            style={{ width: `${(currentXp / neededXp) * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${(currentXp / neededXp) * 100}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>

        <div className="flex items-center justify-between w-full text-sm">
          <h1 className="text-[#999999]">{t("المستوي التالي")}</h1>
          <h1 className="text-[#999999]">
            {t("تم إنجاز")} {currentXp} {t("نقطة")}
          </h1>
        </div>
      </div>

      <Inventory
        waterCount={Number(user?.water)}
        fertilizerCount={Number(user?.fertilizer)}
        blueCount={Number(user?.snabelBlue)}
        redCount={Number(user?.snabelRed)}
        yellowCount={Number(user?.snabelYellow)}
      />

      <div className="w-full bg-[#4AAAD6] flex justify-between items-center p-1 px-2 rounded-xl ">
        <h1 className="text-lg font-bold text-white text-end " dir="ltr">
          {missionsDoneToday}
        </h1>
        <div className="gap-3 flex-center">
          <h1 className="text-sm font-bold text-white text-end" dir="ltr">
            {t("التحديات التي تم إنجازها اليوم")}
          </h1>
          <img src={missionsDoneImg} alt="" className="w-8" />
        </div>
      </div>

      <div className="flex-1 w-full min-h-[180px]">
        <SanabelTree />
      </div>
      <StudentNavbar />
    </div>
  );
};

export default StudentHome;
