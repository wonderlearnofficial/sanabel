import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GoBackButton from "../../components/GoBackButton";
import nonotification from "../../assets/nonotification.png";
import defaultAvatar from "../../assets/avatars/Boys/boy1.png";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { OtherTrophies } from "../../data/OtherTrophies";
import { SanabelTrophies } from "../../data/SanabelTrophies";

// Import tree stage images
import treestage1 from "../../assets/trophies/Other Trophies/مرحلة - 1.png";
import treestage2 from "../../assets/trophies/Other Trophies/مرحلة - 2.png";
import treestage3 from "../../assets/trophies/Other Trophies/مرحلة - 3.png";
import treestage4 from "../../assets/trophies/Other Trophies/مرحلة - 4.png";
import treestage5 from "../../assets/trophies/Other Trophies/مرحلة - 5.png";

import blueSanabel from "../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../assets/resources/اكس بي.png";
import water from "../../assets/resources/ماء.png";
import fertilizer from "../../assets/resources/سماد.png";

interface FilterOptions {
  timeRange: "all" | "today" | "week" | "month";
  sortBy: "newest" | "oldest";
}

const Notifications: React.FC = () => {
  const currentLanguage = localStorage.getItem("language");
  const history = useHistory();
  const { t } = useTranslation();
  const [allTrophies, setAllTrophies] = useState<any[]>([]);
  const [filteredTrophies, setFilteredTrophies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: "all",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const treeStagesImg = [
    treestage1,
    treestage2,
    treestage3,
    treestage4,
    treestage5,
  ];

  // Function to get trophy image
  const getTrophyImage = (trophy: any) => {
    if (trophy.challenge.title === "Tree Stage") {
      return treeStagesImg[trophy.challenge.point - 1] || defaultAvatar;
    }
    return (
      OtherTrophies[trophy.challenge.title] ||
      SanabelTrophies[trophy.challenge.title as keyof typeof SanabelTrophies] ||
      defaultAvatar
    );
  };

  // Function to format date
  const formatDate = (dateString: string, currentLanguage: any) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return t("اليوم"); // Today
    } else if (diffDays === 2) {
      return t("أمس"); // Yesterday
    } else if (diffDays <= 7) {
      return t("منذ {{days}} أيام", { days: diffDays });
    } else {
      return date.toLocaleDateString(
        currentLanguage == "en" ? "en-US" : "ar-EG",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );
    }
  };

  // Function to get trophy level text
  const getTrophyLevelText = (trophy: any) => {
    if (trophy.challenge.title === "Tree Stage") {
      return `${t(trophy.challenge.title)} ${trophy.challenge.point}`;
    } else if (trophy.challenge.point > 1) {
      return `${t(t(trophy.challenge.title))} - ${t("المستوى")} ${
        trophy.challenge.point
      }`;
    } else {
      return t(trophy.challenge.title);
    }
  };

  // Filter and sort trophies
  const filterAndSortTrophies = (trophies: any[], filters: FilterOptions) => {
    let filtered = [...trophies];
    const now = new Date();

    // Apply time range filter
    switch (filters.timeRange) {
      case "today":
        filtered = filtered.filter((trophy) => {
          const trophyDate = new Date(trophy.updatedAt);
          return trophyDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        filtered = filtered.filter((trophy) => {
          const trophyDate = new Date(trophy.updatedAt);
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return trophyDate >= weekAgo;
        });
        break;
      case "month":
        filtered = filtered.filter((trophy) => {
          const trophyDate = new Date(trophy.updatedAt);
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return trophyDate >= monthAgo;
        });
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return filters.sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  // Update filtered trophies when filters change
  useEffect(() => {
    const filtered = filterAndSortTrophies(allTrophies, filters);
    setFilteredTrophies(filtered);
  }, [allTrophies, filters]);

  const fetchAllTrophies = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch Sanabel trophies
      const sanabelResponse = await axios.get(
        "https://sanabel.wonderlearn.net/students/student-trophy-primaire-completed",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      // Fetch Other trophies
      const otherResponse = await axios.get(
        "https://sanabel.wonderlearn.net/students/student-trophy-secondaire-completed",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (sanabelResponse.status === 200 && otherResponse.status === 200) {
        const combinedTrophies = [
          ...sanabelResponse.data.data,
          ...otherResponse.data.data,
        ];

        setAllTrophies(combinedTrophies);
      }
    } catch (error) {
      console.error("Error fetching trophies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    fetchAllTrophies();
  }, []);

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

  console.log("Filtered Trophies:", filteredTrophies);
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800" dir="rtl">
          {t("الإشعارات")}
        </h1>
        <GoBackButton />
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-white border-b border-gray-200"
          dir="rtl"
        >
          <div className="flex flex-col gap-4">
            {/* Time Range Filter */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {t("الفترة الزمنية")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "الكل" },
                  { value: "today", label: "اليوم" },
                  { value: "week", label: "هذا الأسبوع" },
                  { value: "month", label: "هذا الشهر" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleFilterChange("timeRange", option.value)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.timeRange === option.value
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t(option.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {t("ترتيب النتائج")}
              </h3>
              <div className="flex gap-2">
                {[
                  { value: "newest", label: t("الأحدث أولاً") },
                  { value: "oldest", label: t("الأقدم أولاً") },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange("sortBy", option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.sortBy === option.value
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-gray-600">{t("جاري التحميل...")}</p>
            </div>
          </div>
        ) : filteredTrophies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <img
              src={nonotification}
              alt="no notifications"
              className="w-32 h-32 mb-4 opacity-70"
            />
            <h2 className="mb-2 text-lg font-semibold text-gray-800">
              {filters.timeRange === "all"
                ? t("لا يوجد إشعارات")
                : t("لا يوجد إشعارات في هذه الفترة")}
            </h2>
            <p className="text-center text-gray-500">
              {filters.timeRange === "all"
                ? t("لم تحصل على أي كؤوس حتى الآن")
                : t("جرب تغيير الفترة الزمنية للبحث")}
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Results count */}
              <div className="mb-4 text-sm text-right text-gray-500">
                {t("عدد النتائج:")} {filteredTrophies.length}
              </div>

              {filteredTrophies.map((trophy, index) => (
                <motion.div
                  key={`trophy-${trophy.challengeId}-${trophy.updatedAt}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="p-4 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md"
                  dir="rtl"
                >
                  <div className="flex items-center gap-4">
                    {/* Trophy Icon */}
                    <div className="flex-shrink-0">
                      <img
                        src={getTrophyImage(trophy)}
                        alt={trophy.challenge.title}
                        className="object-contain w-16 h-16"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 text-center">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {t("تهانينا! حصلت على كأس جديد")}
                        </h3>
                      </div>

                      <p className="text-sm font-medium text-blue-600">
                        {t(getTrophyLevelText(trophy))}
                      </p>

                      {/* Trophy Rewards */}
                      <div className="flex items-center gap-2 mt-2 mb-2">
                        {getTrophyRewards(trophy).map((reward, rewardIndex) => (
                          <div
                            key={rewardIndex}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50"
                          >
                            <img
                              src={reward.icon}
                              alt="reward"
                              className="object-contain w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {reward.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500" dir="ltr">
                          {formatDate(trophy.updatedAt, currentLanguage)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
