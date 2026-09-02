import { useTranslation } from "react-i18next";
import { useAutoStartGuide } from "../../guides/useAutoStartGuide";
import GoBackButton from "../../components/GoBackButton";
import nonotification from "../../assets/nonotification.png";
import defaultAvatar from "../../assets/avatars/Boys/boy1.png";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OtherTrophies } from "../../data/OtherTrophies";
import { SanabelTrophies } from "../../data/SanabelTrophies";
import { useNotifications } from "./NotificationContext";
import GetAvatar from "../student/tutorial/GetAvatar";
import { sanabelImgs } from "../../data/SanabelDictionary";

const approvalCategoryVisuals = [
  { border: "border-t-blueprimary", text: "text-blueprimary" },
  { border: "border-t-redprimary", text: "text-redprimary" },
  { border: "border-t-yellowprimary", text: "text-yellowprimary" },
  { border: "border-t-greenprimary", text: "text-greenprimary" },
];

// Parent/Teacher: mission approval requests, reusing the same bell/route as
// student trophy notifications rather than building a separate page.
const ApprovalRequestsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language.startsWith("ar");
  const {
    pendingApprovalRequests,
    isLoading,
    refreshNotifications,
    approveApprovalRequest,
    denyApprovalRequest,
  } = useNotifications();
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [errorByRequest, setErrorByRequest] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    refreshNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMissionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "en" ? "en-US" : "ar-EG", {
      day: "numeric",
      month: "short",
    });
  };
  const formatRequestAge = (dateString: string) => {
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
    if (elapsedMinutes < 60) return t("منذ {{count}} دقيقة", { count: elapsedMinutes });
    const hours = Math.floor(elapsedMinutes / 60);
    if (hours < 24) return t("منذ {{count}} ساعة", { count: hours });
    return t("منذ {{count}} يوم", { count: Math.floor(hours / 24) });
  };

  const handleDecision = async (
    requestId: number,
    decision: "approve" | "deny",
  ) => {
    setActioningId(requestId);
    setErrorByRequest((prev) => ({ ...prev, [requestId]: "" }));
    try {
      if (decision === "approve") {
        await approveApprovalRequest(requestId);
      } else {
        await denyApprovalRequest(requestId);
      }
    } catch (error: any) {
      setErrorByRequest((prev) => ({
        ...prev,
        [requestId]:
          error?.response?.data?.message || t("حدث خطأ، حاول مرة أخرى"),
      }));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div
      data-testid="approval-requests-page"
      className="flex flex-col w-full h-full bg-gray-50"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white shadow-sm">
        <GoBackButton />
        <h1 className="text-xl font-bold text-gray-900">
          {t("طلبات الموافقة")}
        </h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : pendingApprovalRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <img
              src={nonotification}
              alt="no notifications"
              className="w-36 h-36 opacity-60"
            />
            <h2 className="text-lg font-bold text-gray-700">
              {t("لا توجد طلبات موافقة حاليًا")}
            </h2>
            <p className="text-sm text-center text-gray-400 max-w-[240px]">
              {t("ستظهر هنا طلبات إنجاز المهام التي يرسلها أبناؤك أو طلابك")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {pendingApprovalRequests.map((request: any) => {
                const studentUser =
                  request.Student?.user ?? request.Student?.User;
                const studentClass =
                  request.Student?.Class ?? request.Student?.class;
                const studentName = `${studentUser?.firstName || ""} ${
                  studentUser?.lastName || ""
                }`.trim();
                const studentClassName = studentClass?.classname;
                const studentGrade =
                  studentClass?.grade || request.Student?.grade;
                const isActioning = actioningId === request.id;
                const error = errorByRequest[request.id];

                const catIndex =
                  ((request.Mission?.categoryId || 1) - 1) %
                  approvalCategoryVisuals.length;
                const categoryVisual = approvalCategoryVisuals[catIndex];
                const typeImg = sanabelImgs[request.Mission?.type];

                const resources = [
                  { icon: blueSanabel, value: request.Mission?.snabelBlue },
                  { icon: redSanabel, value: request.Mission?.snabelRed },
                  { icon: yellowSanabel, value: request.Mission?.snabelYellow },
                  { icon: xpIcon, value: request.Mission?.xp },
                ].filter((r) => r.value);

                return (
                  <motion.div
                    key={request.id}
                    data-testid={`approval-request-${request.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`w-full bg-white border-t-2 ${categoryVisual.border} sanabel-shadow-bottom rounded-xl p-4`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0 gap-2">
                        <div className="flex-shrink-0 w-10 h-10">
                          <GetAvatar
                            userAvatarData={studentUser?.profileImg}
                          />
                        </div>
                        <div className="min-w-0 text-start">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            <bdi>{studentName || t("طالب")}</bdi>
                          </p>
                          {(studentClassName || studentGrade) && (
                            <p className="text-xs text-gray-400">
                              {[studentClassName, studentGrade]
                                .filter(Boolean)
                                .map((v) => t(String(v)))
                                .map((value, index) => (
                                  <span key={`${value}-${index}`}>
                                    {index > 0 && " · "}
                                    <bdi>{value}</bdi>
                                  </span>
                                ))}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 gap-0.5 text-xs">
                        <span className="font-semibold text-gray-600">{t("تاريخ المهمة")}: {formatMissionDate(request.missionDate)}</span>
                        <span className="text-gray-400">{t("طُلبت")} {formatMissionDate(request.createdAt)} · {formatRequestAge(request.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mb-3">
                      {typeImg && (
                        <img
                          src={typeImg}
                          alt=""
                          aria-hidden="true"
                          className="flex-shrink-0 object-contain w-12 h-12"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0 text-start">
                        {request.Mission?.type && (
                          <h2
                            className={`text-xs font-bold ${categoryVisual.text} mb-0.5`}
                          >
                            {t(request.Mission.type)}
                          </h2>
                        )}
                        <p className="text-sm font-semibold text-gray-800">
                          {t(request.Mission?.title)}
                        </p>
                      </div>
                    </div>

                    {resources.length > 0 && (
                      <div className="flex items-center gap-3 mb-3">
                        {resources.map((reward, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <img
                              src={reward.icon}
                              alt=""
                              className="w-auto h-5"
                            />
                            <span className="text-xs font-bold text-gray-600">
                              {reward.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {error && (
                      <p className="mb-2 text-xs font-medium text-red-600">
                        {error}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(request.id, "deny")}
                        disabled={isActioning}
                        className="flex-1 py-2 text-sm font-bold text-white transition-colors bg-red-500 rounded-lg hover:opacity-80 disabled:opacity-50"
                      >
                        {t("رفض")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(request.id, "approve")}
                        disabled={isActioning}
                        className="flex-1 py-2 text-sm font-bold text-white transition-colors rounded-lg bg-greenprimary hover:opacity-80 disabled:opacity-50"
                      >
                        {t("موافقة")}
                      </button>
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
    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-2xl" />
    <div className="flex flex-col flex-1 gap-2">
      <div className="w-3/4 h-3 bg-gray-200 rounded" />
      <div className="w-1/2 h-3 bg-gray-200 rounded" />
      <div className="flex gap-2 mt-1">
        <div className="w-12 h-6 bg-gray-200 rounded-full" />
        <div className="w-12 h-6 bg-gray-200 rounded-full" />
        <div className="w-12 h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="w-1/4 h-2 mt-1 bg-gray-200 rounded" />
    </div>
  </div>
);

const Notifications: React.FC = () => {
  const currentLanguage = localStorage.getItem("language");
  const role = localStorage.getItem("role");
  useAutoStartGuide("student-notifications", role === "Student");
  const { t } = useTranslation();
  const [filteredTrophies, setFilteredTrophies] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: "all",
    sortBy: "newest",
  });

  const {
    allTrophies,
    readChallengeIds,
    markAsRead,
    markAllAsRead,
    isLoading,
    refreshNotifications,
  } = useNotifications();

  const treeStagesImg = [
    treestage1,
    treestage2,
    treestage3,
    treestage4,
    treestage5,
  ];

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
    return date.toLocaleDateString(
      currentLanguage === "en" ? "en-US" : "ar-EG",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  const getTrophyLevelText = (trophy: any) => {
    if (trophy.challenge.title === "Tree Stage") {
      return `${t("مرحلة الشجرة")} ${trophy.challenge.point}`;
    } else if (trophy.challenge.point > 1) {
      return `${t(trophy.challenge.title)} — ${t("المستوى")} ${
        trophy.challenge.point
      }`;
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

  useEffect(() => {
    refreshNotifications();
  }, []);

  const getTrophyRewards = (trophy: any) =>
    [
      {
        value: trophy.challenge.snabelBlue || 0,
        icon: blueSanabel,
        label: "سنبلة زرقاء",
      },
      {
        value: trophy.challenge.snabelRed || 0,
        icon: redSanabel,
        label: "سنبلة حمراء",
      },
      {
        value: trophy.challenge.snabelYellow || 0,
        icon: yellowSanabel,
        label: "سنبلة صفراء",
      },
      { value: trophy.challenge.xp || 0, icon: xpIcon, label: "XP" },
      { value: trophy.challenge.water || 0, icon: water, label: "ماء" },
      { value: trophy.challenge.seeder || 0, icon: fertilizer, label: "سماد" },
    ].filter((r) => r.value > 0);

  const hasUnread = allTrophies.some(
    (t) => !readChallengeIds.includes(t.challengeId),
  );

  if (role === "Parent" || role === "Teacher") {
    return <ApprovalRequestsView />;
  }

  return (
    <div className="flex flex-col w-full h-full bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <GoBackButton />
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-gray-900">
              {t("الإشعارات")}
            </h1>
            {!isLoading && allTrophies.length > 0 && (
              <span className="text-xs font-medium text-gray-400">
                {allTrophies.length} {t("إنجاز")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mark all as read */}
            {hasUnread && (
              <button
                onClick={() =>
                  markAllAsRead(allTrophies.map((t) => t.challengeId))
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blueprimary hover:bg-blue-100 transition-colors"
                title={t("تحديد الكل كمقروء")}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t("تحديد الكل كمقروء")}
                </span>
              </button>
            )}

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
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {t("الأحدث")}
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  {t("الأقدم")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Time filter tabs — always visible */}
        <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
          {TIME_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                setFilters((f) => ({ ...f, timeRange: opt.value }))
              }
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
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredTrophies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <img
              src={nonotification}
              alt="no notifications"
              className="w-36 h-36 opacity-60"
            />
            <h2 className="text-lg font-bold text-gray-700">
              {filters.timeRange === "all"
                ? t("لا يوجد إشعارات بعد")
                : t("لا يوجد إشعارات في هذه الفترة")}
            </h2>
            <p className="text-sm text-center text-gray-400 max-w-[240px]">
              {filters.timeRange === "all"
                ? t("أكمل التحديات لتحصل على كؤوس ومكافآت!")
                : t("جرّب تغيير الفترة الزمنية للعثور على إشعاراتك")}
            </p>
            {filters.timeRange !== "all" && (
              <button
                onClick={() => setFilters((f) => ({ ...f, timeRange: "all" }))}
                className="px-5 py-2 mt-1 text-sm font-medium text-white rounded-full bg-blueprimary"
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
                const isUnread = !readChallengeIds.includes(trophy.challengeId);
                return (
                  <motion.div
                    key={`trophy-${trophy.challengeId}-${trophy.updatedAt}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    onClick={() => isUnread && markAsRead(trophy.challengeId)}
                    className={`flex items-center gap-4 p-3 border rounded-2xl shadow-sm hover:shadow-md transition-shadow relative ${
                      isUnread
                        ? "bg-blue-50/20 border-blue-100/70"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    {/* Trophy image with golden background */}
                    <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 shadow-inner rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100">
                      <img
                        src={getTrophyImage(trophy)}
                        alt={trophy.challenge.title}
                        className="object-contain w-12 h-12"
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
                      <p className="mb-2 text-sm font-semibold text-blueprimary">
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
                              <img
                                src={reward.icon}
                                alt={reward.label}
                                className="w-3.5 h-3.5 object-contain"
                              />
                              <span className="text-xs font-bold text-amber-700">
                                +{reward.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Date & Mark as read */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isUnread ? "bg-blueprimary" : "bg-gray-300"
                            }`}
                          />
                          <span className="text-xs text-gray-400">
                            {formatDate(trophy.updatedAt)}
                          </span>
                        </div>
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(trophy.challengeId);
                            }}
                            className="text-xs font-bold transition-colors cursor-pointer text-blueprimary hover:text-blue-700"
                          >
                            {t("تحديد كمقروء")}
                          </button>
                        )}
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
