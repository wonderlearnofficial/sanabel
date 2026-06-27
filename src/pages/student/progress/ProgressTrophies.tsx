import StudentNavbar from "../../../components/navbar/StudentNavbar";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import trophy from "../../../assets/trophy.png";
import Loading from "../../../components/Loading";
import i18n from "i18next";

// Sanabel
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";
import water from "../../../assets/resources/ماء.png";
import fertilizer from "../../../assets/resources/سماد.png";

// Trophies
import xpTrophy from "../../../assets/trophies/Other Trophies/اكس-بي.png";

// Import trophy image mappings
import { OtherTrophies } from "../../../data/OtherTrophies";
import { SanabelTrophies } from "../../../data/SanabelTrophies";

import axios from "axios";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const Progress: React.FC = () => {
  const { t } = useTranslation();
  const [trophyType, setTrophyType] = useState(0); // Default to Other trophies
  const [trophies, setTrophies] = useState<any[]>([]);
  const [groupedTrophies, setGroupedTrophies] = useState<any>({});
  const [loading, setLoading] = useState(true); // Loading state

  const fetchTrophies = async (token?: string) => {
    setLoading(true);
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    try {
      const response = await axios.get(
        trophyType === 1
          ? "https://sanabel.wonderlearn.net/students/student-trophy-secondaire"
          : "https://sanabel.wonderlearn.net/students/student-trophy-primaire",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response.status === 200) {
        setTrophies(response.data.data);
        groupTrophiesByTitle(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // Stop loading once the API call is complete
    }
  };

  useEffect(() => {
    fetchTrophies();
  }, [trophyType]);

  // Group trophies by title to show one card per trophy type
  const groupTrophiesByTitle = (trophiesData: any[]) => {
    const grouped = trophiesData.reduce((acc: any, trophy: any) => {
      const title = trophy.challenge.title;
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(trophy);
      return acc;
    }, {});
    setGroupedTrophies(grouped);
  };

  const getTrophyRewards = (trophy: any) => {
    return [
      { value: trophy.challenge.snabelBlue || 0, icon: blueSanabel },
      { value: trophy.challenge.snabelRed || 0, icon: redSanabel },
      { value: trophy.challenge.snabelYellow || 0, icon: yellowSanabel },
      { value: trophy.challenge.xp || 0, icon: xpIcon },
      { value: trophy.challenge.water || 0, icon: water },
      { value: trophy.challenge.seeder || 0, icon: fertilizer },
    ].filter((reward) => reward.value > 0);
  };

  // Find the most progressed trophy within a group
  const getMostProgressedTrophy = (trophyGroup: any[]) => {
    return trophyGroup.reduce((mostProgressed, current) => {
      return current.pointOfStudent > mostProgressed.pointOfStudent
        ? current
        : mostProgressed;
    }, trophyGroup[0]);
  };

  // Get milestone values for a trophy group
  const getTrophyMilestones = (trophyGroup: any[]) => {
    // Extract milestone values from the trophy descriptions
    // Look for patterns like "Complete X tasks to unlock this challenge"
    const milestones = trophyGroup
      .map((trophy) => {
        const description = trophy.challenge.description;
        const match = description.match(/Complete (\d+) tasks/i);
        return match ? parseInt(match[1]) : null;
      })
      .filter((value) => value !== null);

    // Sort milestones in ascending order
    return milestones.sort((a, b) => a - b);
  };

  // Calculate total trophies count
  const completedTrophiesCount = trophies.filter(
    (trophy) => trophy.completionStatus === "Completed"
  ).length;

  console.log("Grouped Trophies:", groupedTrophies);
  console.log("Trophies:", trophies);

  if (loading) {
    return <Loading />;
  }

  // Get formatted milestone value (convert numbers > 100 to 1k/1ك format)
  const formatMilestone = (value: any, isArabic = true) => {
    if (value >= 1000) {
      const formattedValue = (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1);
      return isArabic ? `${formattedValue}ك` : `${formattedValue}k`;
    }
    return value.toString();
  };

  const handleTrophyTypeChange = (type: number) => {
    if (type !== trophyType) {
      setTrophyType(type);
    }
  };

  // Get the next milestone based on current progress
  const getNextMilestone = (currentPoints: number, milestones: number[]) => {
    // Find the first milestone that is greater than the current points
    const nextMilestone = milestones.find(
      (milestone) => milestone > currentPoints
    );

    // If there's no next milestone (already completed all), use the last milestone
    return nextMilestone || milestones[milestones.length - 1] || currentPoints;
  };

  return (
    <div className="flex flex-col w-full gap-3 overflow-y-auto h-3/4">
      <div className="flex w-full rounded-2xl bg-[#e6e6e6]">
        <h1
          className={`text-[#999] text-sm p-2 rounded-2xl w-1/2 flex-center ${
            trophyType === 0 && "bg-yellowprimary text-white"
          }`}
          onClick={() => handleTrophyTypeChange(0)}
        >
          {t("جوائز السنابل")}
        </h1>
        <h1
          className={`text-[#999] text-sm p-2 rounded-2xl w-1/2 flex-center ${
            trophyType === 1 && "bg-yellowprimary text-white"
          }`}
          onClick={() => handleTrophyTypeChange(1)}
        >
          {t("جوائز أخري")}
        </h1>
      </div>

      <motion.div
        className="w-full bg-[#E14E54] flex-center justify-between items-center p-1 gap-3 rounded-2xl text-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={trophyType} // Add key to reset animation when trophy type changes
      >
        <motion.h1
          className="font-bold text-white"
          dir="ltr"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {completedTrophiesCount} / {trophies.length}
        </motion.h1>

        <motion.h1
          className="font-bold text-white"
          dir="ltr"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {t("مجموع الجوائز")}
        </motion.h1>

        <motion.img
          src={trophy}
          alt=""
          className="w-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "backOut" }}
        />
      </motion.div>

      {Object.entries(groupedTrophies).map(
        ([title, trophyGroup]: [string, any]) => {
          const representativeTrophy = getMostProgressedTrophy(trophyGroup);
          const currentPoints = representativeTrophy.pointOfStudent;
          const trophyMilestones = getTrophyMilestones(trophyGroup);
          const nextMilestone = getNextMilestone(
            currentPoints,
            trophyMilestones
          );

          // Calculate progress percentage based on next milestone
          const progressPercentage = Math.min(
            (currentPoints / nextMilestone) * 100,
            100
          );

          // Get appropriate trophy image based on trophy type
          const trophyImage =
            trophyType === 1
              ? OtherTrophies[title]
              : SanabelTrophies[title as keyof typeof SanabelTrophies];

          return (
            <div
              className="w-full flex flex-col justify-between items-center shadow-sm p-3 rounded-xl border-[1px] gap-2"
              key={`${trophyType}-${title}`}
            >
              <div className="flex flex-row-reverse items-center justify-between w-full">
                <div className="flex gap-2">
                  {getTrophyRewards(representativeTrophy).map((item, idx) => (
                    <div className="flex-col flex-center" key={idx}>
                      <img src={item.icon} alt="icon" className="w-auto h-6" />
                      <h1 className="text-sm text-black">{item.value}</h1>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <img src={trophyImage} alt="trophy" className="w-16" />
                  <h1
                    className="w-full font-bold text-black text-end"
                    dir="ltr"
                  >
                    {t("جائزة") + " " + t(title)}
                  </h1>
                </div>
              </div>

              {/* DUMMY */}
              {/* <p className="w-full text-sm text-black text-end">
                {t(representativeTrophy.challenge.description)}
              </p> */}

              <div className="w-full flex-row-reverse bg-[#fab70050] rounded-3xl h-6 flex justify-end items-center relative overflow-hidden">
                {/* Text displaying current and needed points (now shows next milestone instead of target) */}
                <h1 className="text-[#997000] px-3 relative z-10">
                  {currentPoints}
                  <span className="text-black">/{nextMilestone}</span>
                </h1>

                {/* Progress bar */}
                <motion.div
                  className={`bg-[#F3B14E] rounded-3xl h-6 absolute top-0 ${
                    i18n.language !== "ar" ? "left-0" : "right-0"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center w-full gap-1 mt-2">
                {trophyMilestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className={`flex-center px-2 h-6 rounded-full ${
                      currentPoints >= milestone
                        ? "bg-[#FAB700]"
                        : "bg-[#FFF8E5]"
                    }`}
                  >
                    <h1 className="text-xs font-bold text-black " dir="rtl">
                      {formatMilestone(milestone, i18n.language === "ar")}
                    </h1>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export default Progress;
