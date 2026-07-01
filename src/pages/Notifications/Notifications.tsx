import { API_BASE_URL } from "../../config/api";
import { useTranslation } from "react-i18next";
import GoBackButton from "../../components/GoBackButton";
import nonotification from "../../assets/nonotification.png";
import defaultAvatar from "../../assets/avatars/Boys/boy1.png";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { OtherTrophies } from "../../data/OtherTrophies";
import { SanabelTrophies } from "../../data/SanabelTrophies";

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

const TIME_FILTERS: { value: FilterOptions["timeRange"]; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
];

const SkeletonCard = () => (
  <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl animate-pulse">
    <div className="w-16 h-16 bg-gray-200 rounded-2xl flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex gap-2 mt-1">
        <div className="h-6 w-12 bg-gray-200 rounded-full" />
        <div className="h-6 w-12 bg-gray-200 rounded-full" />
        <div className="h-6 w-12 bg-gray-200 rounded-full" />
      </div>
      <div className="h-2 bg-gray-200 rounded w-1/4 mt-1" />
    </div>
  </div>
);

const Notifications: React.FC = () => {
  const currentLanguage = localStorage.getItem("language");
  const { t } = useTranslation();
  const [allTrophies, setAllTrophies] = useState<any[]>([]);
  const [filteredTrophies, setFilteredTrophies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: "all",
    sortBy: "newest",
  });

  const treeStagesImg = [treestage1, treestage2, treestage3, treestage4, treestage5];

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t("منذ {{m}} دقيقة", { m: diffMins || 1 });
    if (diffHours < 24) return t("منذ {{h}} ساعة", { h: diffHours });
    if (diffDays === 1) return t("أمس");
    if (diffDays <= 7) return t("منذ {{days}} أيام", { days: diffDays });
    return date.toLocaleDateString(currentLanguage === "en" ? "en-US" : "ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTrophyLevelText = (trophy: any) => {
    if (trophy.challenge.title === "Tree Stage") {
      return `${t("مرحلة الشجرة")} ${trophy.challenge.point}`;
    } else if (trophy.challenge.point > 1) {
      return `${t(trophy.challenge.title)} — ${t("المستوى")} ${trophy.challenge.point}`;
    }
    return t(trophy.challenge.title);
  };

  const filterAndSortTrophies = (trophies: any[], f: FilterOptions) => {
    let filtered = [...trophies];
    const now = new Date();

    if (f.timeRange === "today") {
      filtered = filtered.filter(
        (tr) => new Date(tr.updatedAt).toDateString() === now.toDateString(),
      );
    } else if (f.timeRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter((tr) => new Date(tr.updatedAt) >= weekAgo);
    } else if (f.timeRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter((tr) => new Date(tr.updatedAt) >= monthAgo);
    }

    filtered.sort((a, b) => {
      const da = new Date(a.updatedAt).getTime();
      const db = new Date(b.updatedAt).getTime();
      return f.sortBy === "newest" ? db - da : da - db;
    });

    return filtered;
  };

  useEffect(() => {
    setFilteredTrophies(filterAndSortTrophies(allTrophies, filters));
  }, [allTrophies, filters]);

  const fetchAllTrophies = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [sanabelRes, otherRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students/student-trophy-primaire-completed`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_BASE_URL}/students/student-trophy-secondaire-completed`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      if (sanabelRes.status === 200 && otherRes.status === 200) {
        setAllTrophies([...sanabelRes.data.data, ...otherRes.data.data]);
      }
    } catch (error) {
      console.error("Error fetching trophies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllTrophies(); }, []);

  const getTrophyRewards = (trophy: any) =>
    [
      { value: trophy.challenge.snabelBlue || 0, icon: blueSanabel, label: "سنبلة زرقاء" },
      { value: trophy.challenge.snabelRed || 0, icon: redSanabel, label: "سنبلة حمراء" },
      { value: trophy.challenge.snabelYellow || 0, icon: yellowSanabel, label: "سنبلة صفراء" },
      { value: trophy.challenge.xp || 0, icon: xpIcon, label: "XP" },
      { value: trophy.challenge.water || 0, icon: water, label: "ماء" },
      { value: trophy.challenge.seeder || 0, icon: fertilizer, label: "سماد" },
    ].filter((r) => r.value > 0);

  return (
    <div className="flex flex-col w-full h-full bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <GoBackButton />
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-gray-900">{t("الإشعارات")}</h1>
            {!isLoading && allTrophies.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                {allTrophies.length} {t("إنجاز")}
              </span>
            )}
          </div>
          {/* Sort toggle */}
          <button
            onClick={() =>
              setFilters((f) => ({
                ...f,
                sortBy: f.sortBy === "newest" ? "oldest" : "newest",
              }))
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {filters.sortBy === "newest" ? (
              <>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {t("الأحدث")}
              </>
            ) : (
              <>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                {t("الأقدم")}
              </>
            )}
          </button>
        </div>

        {/* Time filter tabs — always visible */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
          {TIME_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters((f) => ({ ...f, timeRange: opt.value }))}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.timeRange === opt.value
                  ? "bg-blueprimary text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t(opt.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredTrophies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
            <img
              src={nonotification}
              alt="no notifications"
              className="w-36 h-36 opacity-60"
            />
            <h2 className="text-lg font-bold text-gray-700">
              {filters.timeRange === "all" ? t("لا يوجد إشعارات بعد") : t("لا يوجد إشعارات في هذه الفترة")}
            </h2>
            <p className="text-sm text-center text-gray-400 max-w-[240px]">
              {filters.timeRange === "all"
                ? t("أكمل التحديات لتحصل على كؤوس ومكافآت!")
                : t("جرّب تغيير الفترة الزمنية للعثور على إشعاراتك")}
            </p>
            {filters.timeRange !== "all" && (
              <button
                onClick={() => setFilters((f) => ({ ...f, timeRange: "all" }))}
                className="mt-1 px-5 py-2 text-sm font-medium text-white bg-blueprimary rounded-full"
              >
                {t("عرض الكل")}
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {filteredTrophies.map((trophy, index) => {
                const rewards = getTrophyRewards(trophy);
                return (
                  <motion.div
                    key={`trophy-${trophy.challengeId}-${trophy.updatedAt}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Trophy image with golden background */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center shadow-inner">
                      <img
                        src={getTrophyImage(trophy)}
                        alt={trophy.challenge.title}
                        className="w-12 h-12 object-contain"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">🏆</span>
                        <span className="text-sm font-bold text-gray-800 truncate">
                          {t("حصلت على كأس جديد!")}
                        </span>
                      </div>

                      {/* Trophy name */}
                      <p className="text-sm font-semibold text-blueprimary mb-2">
                        {getTrophyLevelText(trophy)}
                      </p>

                      {/* Rewards */}
                      {rewards.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {rewards.map((reward, ri) => (
                            <div
                              key={ri}
                              className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-full"
                            >
                              <img src={reward.icon} alt={reward.label} className="w-3.5 h-3.5 object-contain" />
                              <span className="text-xs font-bold text-amber-700">+{reward.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span className="text-xs text-gray-400">
                          {formatDate(trophy.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
