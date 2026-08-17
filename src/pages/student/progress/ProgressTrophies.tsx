import { API_BASE_URL } from "../../../config/api";
import { useAutoStartGuide } from "../../../guides/useAutoStartGuide";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import trophy from "../../../assets/trophy.png";
import Loading from "../../../components/Loading";
import i18n from "i18next";

// Sanabel resource icons
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";
import water from "../../../assets/resources/ماء.png";
import fertilizer from "../../../assets/resources/سماد.png";

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
  useAutoStartGuide("student-trophies", true);
  const { t } = useTranslation();
  const [trophyType, setTrophyType] = useState(0); // 0 = Sanabel trophies, 1 = Other trophies
  const [trophies, setTrophies] = useState<any[]>([]);
  const [groupedTrophies, setGroupedTrophies] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true); // Loading state

  const fetchTrophies = async (token?: string) => {
    setLoading(true);
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        trophyType === 1
          ? `${API_BASE_URL}/students/student-trophy-secondaire`
          : `${API_BASE_URL}/students/student-trophy-primaire`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response.status === 200 && response.data) {
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        setTrophies(data);
        groupTrophiesByTitle(data);
      }
    } catch (error) {
      console.error("Error fetching trophies data:", error);
      setTrophies([]);
      setGroupedTrophies({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrophies();
  }, [trophyType]);

  // Group trophies by title to show one card per trophy type
  const groupTrophiesByTitle = (trophiesData: any[]) => {
    if (!Array.isArray(trophiesData)) {
      setGroupedTrophies({});
      return;
    }
    const grouped = trophiesData.reduce((acc: Record<string, any[]>, trophyItem: any) => {
      const title = trophyItem?.challenge?.title;
      if (!title) return acc;
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(trophyItem);
      return acc;
    }, {});
    setGroupedTrophies(grouped);
  };

  const getTrophyRewards = (trophyItem: any) => {
    if (!trophyItem?.challenge) return [];
    return [
      { value: trophyItem.challenge.snabelBlue || 0, icon: blueSanabel },
      { value: trophyItem.challenge.snabelRed || 0, icon: redSanabel },
      { value: trophyItem.challenge.snabelYellow || 0, icon: yellowSanabel },
      { value: trophyItem.challenge.xp || 0, icon: xpIcon },
      { value: trophyItem.challenge.water || 0, icon: water },
      { value: trophyItem.challenge.seeder || 0, icon: fertilizer },
    ].filter((reward) => reward.value > 0);
  };

  // Find the most progressed trophy within a group
  const getMostProgressedTrophy = (trophyGroup: any[]) => {
    if (!trophyGroup || trophyGroup.length === 0) return null;
    return trophyGroup.reduce((mostProgressed, current) => {
      return (current?.pointOfStudent || 0) > (mostProgressed?.pointOfStudent || 0)
        ? current
        : mostProgressed;
    }, trophyGroup[0]);
  };

  // Get milestone values for a trophy group
  const getTrophyMilestones = (trophyGroup: any[]) => {
    const rawMilestones = trophyGroup
      .map((trophyItem) => {
        if (
          trophyItem?.challenge?.point !== undefined &&
          trophyItem?.challenge?.point !== null
        ) {
          return Number(trophyItem.challenge.point);
        }
        const description = trophyItem?.challenge?.description || "";
        const match =
          description.match(/Complete (\d+) tasks/i) || description.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((value): value is number => value !== null && !isNaN(value) && value > 0);

    const uniqueSorted = Array.from(new Set(rawMilestones)).sort((a, b) => a - b);
    return uniqueSorted.length > 0 ? uniqueSorted : [1];
  };

  // Calculate total trophies count
  const completedTrophiesCount = trophies.filter(
    (trophyItem) => trophyItem.completionStatus === "Completed"
  ).length;

  if (loading) {
    return <Loading />;
  }

  // Get formatted milestone value (convert numbers >= 1000 to 1k/1ك format)
  const formatMilestone = (value: any, isArabic = true) => {
    const num = Number(value) || 0;
    if (num >= 1000) {
      const formattedValue = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
      return isArabic ? `${formattedValue}ك` : `${formattedValue}k`;
    }
    return num.toString();
  };

  const handleTrophyTypeChange = (type: number) => {
    if (type !== trophyType) {
      setTrophyType(type);
    }
  };

  // Get the next milestone based on current progress
  const getNextMilestone = (currentPoints: number, milestones: number[]) => {
    if (!milestones || milestones.length === 0) return Math.max(currentPoints, 1);
    const nextMilestone = milestones.find(
      (milestone) => milestone > currentPoints
    );
    return nextMilestone || milestones[milestones.length - 1] || Math.max(currentPoints, 1);
  };

  return (
    <div className="flex flex-col w-full gap-3 overflow-y-auto h-3/4">
      <div className="flex w-full rounded-2xl bg-[#e6e6e6]">
        <h1
          className={`text-[#999] text-sm p-2 rounded-2xl w-1/2 flex-center cursor-pointer transition-colors ${
            trophyType === 0 && "bg-yellowprimary text-white font-bold"
          }`}
          onClick={() => handleTrophyTypeChange(0)}
        >
          {t("جوائز السنابل")}
        </h1>
        <h1
          className={`text-[#999] text-sm p-2 rounded-2xl w-1/2 flex-center cursor-pointer transition-colors ${
            trophyType === 1 && "bg-yellowprimary text-white font-bold"
          }`}
          onClick={() => handleTrophyTypeChange(1)}
        >
          {t("جوائز أخرى")}
        </h1>
      </div>

      <motion.div
        className="w-full bg-[#E14E54] flex-center justify-between items-center p-2 px-4 gap-3 rounded-2xl text-md shadow-sm"
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
          alt="trophy icon"
          className="w-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "backOut" }}
        />
      </motion.div>

      {Object.entries(groupedTrophies).length > 0 ? (
        Object.entries(groupedTrophies).map(
          ([title, trophyGroup]: [string, any[]]) => {
            const representativeTrophy = getMostProgressedTrophy(trophyGroup);
            if (!representativeTrophy) return null;
            const currentPoints = representativeTrophy.pointOfStudent || 0;
            const trophyMilestones = getTrophyMilestones(trophyGroup);
            const nextMilestone = getNextMilestone(
              currentPoints,
              trophyMilestones
            );

            // Calculate progress percentage based on next milestone
            const progressPercentage =
              nextMilestone > 0
                ? Math.min(Math.round((currentPoints / nextMilestone) * 100), 100)
                : 0;

            // Get appropriate trophy image based on trophy type with fallback
            const trophyImage =
              trophyType === 1
                ? OtherTrophies[title] || trophy
                : SanabelTrophies[title as keyof typeof SanabelTrophies] || trophy;

            return (
              <div
                className="w-full flex flex-col justify-between items-center shadow-sm p-3 rounded-xl border-[1px] gap-2 bg-white"
                key={`${trophyType}-${title}`}
              >
                <div className="flex flex-row-reverse items-center justify-between w-full">
                  <div className="flex gap-2">
                    {getTrophyRewards(representativeTrophy).map((item, idx) => (
                      <div className="flex-col flex-center" key={idx}>
                        <img src={item.icon} alt="reward icon" className="w-auto h-6" />
                        <h1 className="text-sm font-semibold text-black">{item.value}</h1>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <img src={trophyImage} alt={title} className="object-contain w-16 h-16" />
                    <h1
                      className="w-full font-bold text-black text-end"
                      dir="rtl"
                    >
                      {t("جائزة") + " " + t(title)}
                    </h1>
                  </div>
                </div>

                <div className="w-full flex-row-reverse bg-[#fab70050] rounded-3xl h-6 flex justify-end items-center relative overflow-hidden">
                  {/* Text displaying current and needed points */}
                  <h1 className="text-[#997000] px-3 relative z-10 font-bold text-xs" dir="ltr">
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
                      className={`flex-center px-2 h-6 rounded-full transition-colors ${
                        currentPoints >= milestone
                          ? "bg-[#FAB700] text-black"
                          : "bg-[#FFF8E5] text-[#999]"
                      }`}
                    >
                      <h1 className="text-xs font-bold" dir="rtl">
                        {formatMilestone(milestone, i18n.language === "ar")}
                      </h1>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        )
      ) : (
        <div className="flex flex-col items-center justify-center w-full py-10 gap-3 text-center">
          <img src={trophy} alt="no trophies" className="w-16 h-16 opacity-40" />
          <p className="text-sm text-gray-500 font-medium">
            {t("لا توجد جوائز متاحة حالياً")}
          </p>
        </div>
      )}
    </div>
  );
};

export default Progress;
