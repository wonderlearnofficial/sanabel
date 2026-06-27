import { useTheme } from "../../context/ThemeContext";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import LeaderboardsStar from "../../icons/Leaderboards/LeaderboardsStar";
import FirstPlaceColumn from "../../icons/Leaderboards/FirstPlaceColumn";
import SecondPlaceColumn from "../../icons/Leaderboards/SecondPlaceColumn";
import ThirdPlaceColumn from "../../icons/Leaderboards/ThirdPlaceColumn";
import FilterIcon from "../../icons/Leaderboards/FilterIcon";
import PrimaryButton from "../../components/PrimaryButton";
import { delay, motion } from "framer-motion";
import MedalAndLevel from "../../components/MedalAndLevel";
import { useEffect } from "react";
import axios from "axios";
import React from "react";
import { calculateLevel } from "../../utils/LevelCalculator";
import TeacherNavbar from "../../components/navbar/TeacherNavbar";
import LeaderboardsFilter from "./Leaderboards/LeaderboardsFilter";
import GetAvatar from "./tutorial/GetAvatar";
import { useUserContext } from "../../context/StudentUserProvider";
import ParentNavbar from "../../components/navbar/ParentNavbar";
import { FaSearch } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

interface LeaderboardItem {
  id: number;
  xp: number;
  level: number;
  user: {
    firstName: string;
    lastName: string;
    profileImg?: {
      gender?: string;
      bgColor?: string;
      avatarId?: number;
      bgPattern?: string;
      hairColor?: string;
      skinColor?: string;
      tshirtColor?: string;
    } | null;
    gender?: string;
  };
  class: {
    classname: string;
    category: string;
  };
  originalPosition?: number;
}

interface ApiResponse {
  students: LeaderboardItem[];
}

interface FilterState {
  category: string;
  classId: string;
  className?: string;
  gender: string;
}

const Leaderboards: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  const [leaderboardsData, setLeaderboardsData] = useState<LeaderboardItem[]>([
    {
      id: 0,
      level: 1,
      user: {
        firstName: "",
        lastName: "",
      },
      xp: 0,
      class: {
        classname: "",
        category: "",
      },
    },
  ]);
  const [filteredData, setFilteredData] = useState<LeaderboardItem[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchButton, setIsSearchButton] = useState(false);

  const [activeFilters, setActiveFilters] = useState<FilterState>({
    category: "",
    classId: "",
    className: "",
    gender: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const userRole = localStorage.getItem("role");

  // Update the fetchUserData function
  const fetchUserData = async (filters?: FilterState) => {
    setIsLoading(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    try {
      // Build query parameters based on filters
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.append("category", filters.category);
      if (filters?.className)
        queryParams.append("className", filters.className); // Changed from classId to className
      if (filters?.gender) queryParams.append("gender", filters.gender);

      // Use the actual query parameters
      const queryString = queryParams.toString();

      let url = "";
      if (userRole === "Teacher") {
        url = `https://sanabel.wonderlearn.net/teachers/leader-board${
          queryString ? `?${queryString}` : ""
        }`;
      } else if (userRole === "Parent") {
        url = `https://sanabel.wonderlearn.net/parents/appear-leaderboard${
          queryString ? `?${queryString}` : ""
        }`;
      } else {
        url = `https://sanabel.wonderlearn.net/students/appear-Leaderboard${
          queryString ? `?${queryString}` : ""
        }`;
      }

      const response = await axios.get<ApiResponse>(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 200 && response.data.students) {
        setLeaderboardsData(response.data.students);
        setFilteredData(response.data.students);
        console.log(
          "Leaderboards data fetched successfully:",
          response.data.students,
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters);
    fetchUserData(filters);
  };

  // Update the hasActiveFilters function
  const hasActiveFilters = () => {
    return (
      activeFilters.category || activeFilters.className || activeFilters.gender // Changed from classId to className
    );
  };

  // Update the clearAllFilters function
  const clearAllFilters = () => {
    const emptyFilters: any = { category: "", className: "", gender: "" }; // Changed from classId to className
    setActiveFilters(emptyFilters);
    fetchUserData(emptyFilters);
  };

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);

    if (query.length === 0) {
      setFilteredData(leaderboardsData);
    } else {
      const filtered = leaderboardsData.filter(
        (item) =>
          item.user.firstName.toLowerCase().includes(query.toLowerCase()) ||
          item.user.lastName.toLowerCase().includes(query.toLowerCase()) ||
          `${item.user.firstName} ${item.user.lastName}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      );
      setFilteredData(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setFilteredData(leaderboardsData);
  };

  const [ordinalNumbers] = useState([
    "الأول",
    "الثاني",
    "الثالث",
    "الرابع",
    "الخامس",
    "السادس",
    "السابع",
    "الثامن",
    "التاسع",
    "العاشر",
  ]);

  // Recalculate levels based on XP and sort by XP (descending)
  const sortedData = React.useMemo(() => {
    return filteredData
      .map((item) => {
        const { level } = calculateLevel(item.xp);
        return {
          ...item,
          level,
          user: {
            ...item.user,
            profileImg: item.user.profileImg
              ? { ...item.user.profileImg }
              : null,
          },
        };
      })
      .sort((a, b) => b.xp - a.xp);
  }, [filteredData]);

  const dataWithOriginalPositions = React.useMemo(() => {
    // First, get all data sorted by XP to establish original positions
    const allDataSorted = leaderboardsData
      .map((item) => {
        const { level } = calculateLevel(item.xp);
        return {
          ...item,
          level,
          user: {
            ...item.user,
            profileImg: item.user.profileImg
              ? { ...item.user.profileImg }
              : null,
          },
        };
      })
      .sort((a, b) => b.xp - a.xp);

    // Create a map of user ID to original position
    const positionMap = new Map();
    allDataSorted.forEach((item, index) => {
      positionMap.set(item.id, index + 1);
    });

    // Add original position to filtered/sorted data
    return sortedData.map((item) => ({
      ...item,
      originalPosition: positionMap.get(item.id) || 0,
    }));
  }, [sortedData, leaderboardsData]);

  // Animation Variants
  const columnVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
  };

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 1 } },
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full overflow-y-auto" id="page-height">
        <div className="flex flex-col items-center justify-center w-full h-full p-2">
          <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">{t("جاري التحميل...")}</p>
          {userRole === "Student" ? (
            <StudentNavbar />
          ) : userRole === "Teacher" ? (
            <TeacherNavbar />
          ) : (
            <ParentNavbar />
          )}
        </div>
      </div>
    );
  }

  // Guard clause for insufficient data (only when not searching)
  if (sortedData.length < 3 && !isSearching) {
    return (
      <div className="w-full" id="page-height">
        <div className="flex flex-col items-center justify-center w-full h-full p-2">
          <h1 className="text-2xl font-bold text-black">
            {t("لوحة المتصدرين")}
          </h1>
          <p className="mt-4 text-center text-gray-500">
            {hasActiveFilters()
              ? t("لا توجد نتائج تطابق المرشحات المحددة")
              : t("لا توجد بيانات كافية لعرض لوحة المتصدرين")}
          </p>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 mt-4 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {t("مسح الكل")}
            </button>
          )}
          {userRole == "Student" ? (
            <StudentNavbar />
          ) : userRole == "Teacher" ? (
            <TeacherNavbar />
          ) : (
            <ParentNavbar />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto" id="page-height">
      <div className="flex flex-col items-center justify-between w-full h-full p-2 overflow-y-auto">
        <div className="flex flex-col items-center justify-between w-full gap-2">
          <div className="flex items-center justify-between w-full gap-1">
            <div className="flex justify-between w-full gap-2">
              {/* Filter Button */}
              <h1 className="text-2xl font-bold text-black">
                {t("لوحة المتصدرين")}
              </h1>

              {/* Filter Button */}
              <div className="flex gap-4 flex-center">
                <button
                  onClick={() => setIsSearchButton(!isSearchButton)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    hasActiveFilters()
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {!isSearchButton ? (
                    <FaSearch size={20} className="text-blueprimary" />
                  ) : (
                    <IoMdClose size={20} className="text-redprimary" />
                  )}
                </button>

                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    hasActiveFilters()
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <FilterIcon size={20} />

                  {hasActiveFilters() && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search Input */}
          {isSearchButton && (
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder={t("بحث")}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-1 pr-10 text-center text-gray-400 bg-white border-2 border-gray-300 rounded-lg focus:border-blueprimary focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
              <div className="absolute transform -translate-y-1/2 text-blueprimary right-3 top-1/2">
                <FaSearch />
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap justify-start w-full gap-2">
              {activeFilters.category && (
                <span className="px-3 py-1 text-sm text-blue-800 capitalize bg-blue-100 rounded-full">
                  {activeFilters.category}
                </span>
              )}
              {activeFilters.classId && (
                <span className="px-3 py-1 text-sm text-green-800 capitalize bg-green-100 rounded-full">
                  {activeFilters.className || activeFilters.classId}
                </span>
              )}
              {activeFilters.gender && (
                <span className="px-3 py-1 text-sm text-purple-800 capitalize bg-purple-100 rounded-full">
                  {activeFilters.gender === "male" ? "ذكور" : "إناث"}
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm text-red-800 transition-colors bg-red-100 rounded-full hover:bg-red-200"
              >
                {t("مسح الكل")}
              </button>
            </div>
          )}

          {/* Search Results Info */}
          {isSearching && (
            <div className="w-full text-center">
              <p className="text-sm text-gray-600">
                {sortedData.length > 0
                  ? `${t("تم العثور على")} ${sortedData.length} ${t("طالب")}`
                  : t("لا توجد نتائج للبحث")}
              </p>
            </div>
          )}
        </div>

        {/* Leaderboards Content */}
        <div className="flex flex-col gap-2 h-[90%] w-full overflow-y-auto py-5 px-1">
          {isSearching ? (
            // Search Results - Simple List
            <motion.div
              className="flex flex-col w-full gap-2"
              initial="hidden"
              animate="visible"
              variants={listVariants}
            >
              {dataWithOriginalPositions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-center text-gray-500">
                    {t("لا توجد نتائج تطابق بحثك")}
                  </p>
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 mt-4 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {t("مسح البحث")}
                  </button>
                </div>
              ) : (
                dataWithOriginalPositions.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center justify-between w-full transition-shadow bg-white border-2 shadow-sm rounded-2xl "
                    variants={listItemVariants}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-gray-600 min-w-[2rem] text-center">
                        #{item.originalPosition}
                      </div>
                      <div className="scale-90">
                        <MedalAndLevel
                          level={item.level}
                          color="text-black"
                          dir=""
                          size="w-16"
                        />
                      </div>
                    </div>

                    {/* Rest of your existing JSX remains the same */}
                    <div className="flex-col text-center flex-center">
                      <h1 className="text-[#999] uppercase text-xs">
                        {item.class.category}
                      </h1>
                      <h1 className="text-[#999] uppercase text-xs">
                        {item.class.classname}
                      </h1>
                    </div>

                    <div className="items-center gap-3 flex-center">
                      <div className="flex-col flex-center">
                        <h1 className="font-medium text-black">
                          {item.user.firstName}
                        </h1>
                        <h1 className="font-medium text-black">
                          {item.user.lastName}
                        </h1>
                      </div>

                      <div className="w-12 h-12">
                        <GetAvatar
                          userAvatarData={item.user.profileImg ?? undefined}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            // Original Leaderboards Layout with Podium
            <>
              {/* Leaderboards for top 3 */}
              <motion.div
                className="flex items-end justify-between w-full"
                initial="hidden"
                animate="visible"
                variants={listVariants}
              >
                {/* First Place (center) */}
                <motion.div
                  className="flex flex-col items-center order-2 w-1/3"
                  variants={columnVariants}
                >
                  <div className="relative w-20 h-20 border-2 rounded-full border-blueprimary">
                    <GetAvatar
                      userAvatarData={
                        sortedData[0].user.profileImg ?? undefined
                      }
                    />
                    <div className="absolute top-0 p-4 text-center transform -translate-x-1/2 -translate-y-1/2 flex-center left-1/2">
                      <LeaderboardsStar
                        size={40}
                        className="text-blueprimary"
                      />
                    </div>
                  </div>
                  <h1 className="text-sm text-center text-black">
                    {sortedData[0].user.firstName +
                      " " +
                      sortedData[0].user.lastName}
                  </h1>
                  <h1 className="text-[#999] uppercase text-xs text-center">
                    {sortedData[0].class.category}
                  </h1>
                  <h1 className="text-[#999] uppercase text-xs text-center">
                    {sortedData[0].class.classname}
                  </h1>
                  <div className="scale-90">
                    <MedalAndLevel
                      level={sortedData[0].level}
                      color="text-blueprimary"
                      dir=""
                      size="w-16"
                    />
                  </div>
                  <FirstPlaceColumn className="w-full" />
                </motion.div>

                {/* Second Place (left) */}
                <motion.div
                  className="flex flex-col items-center order-1 w-1/3"
                  variants={columnVariants}
                >
                  <div className="w-20 h-20">
                    <GetAvatar
                      userAvatarData={
                        sortedData[1].user.profileImg ?? undefined
                      }
                    />
                  </div>
                  <h1 className="text-sm text-center text-black">
                    {sortedData[1].user.firstName +
                      " " +
                      sortedData[1].user.lastName}
                  </h1>
                  <h1 className="text-[#999] uppercase text-xs text-center">
                    {sortedData[1].class.category}
                  </h1>
                  <h1 className="text-[#999] uppercase text-xs text-center">
                    {sortedData[1].class.classname}
                  </h1>
                  <div className="scale-90">
                    <MedalAndLevel
                      level={sortedData[1].level}
                      color="text-redprimary"
                      dir=""
                      size="w-16"
                    />
                  </div>
                  <SecondPlaceColumn className="w-full" />
                </motion.div>

                {/* Third Place (right) */}
                <motion.div
                  className="flex flex-col items-center order-3 w-1/3"
                  variants={columnVariants}
                >
                  <div className="w-20 h-20">
                    <GetAvatar
                      userAvatarData={
                        sortedData[2].user.profileImg ?? undefined
                      }
                    />
                  </div>
                  <h1 className="text-sm text-center text-black">
                    {sortedData[2].user.firstName +
                      " " +
                      sortedData[2].user.lastName}
                  </h1>
                  <h1 className="text-[#999] uppercase text-xs text-center">
                    {sortedData[2].class.category}
                  </h1>
                  <h1 className="text-[#999] uppercase text-xs text-center">
                    {sortedData[2].class.classname}
                  </h1>
                  <div className="scale-90">
                    <MedalAndLevel
                      level={sortedData[2].level}
                      color="text-yellowprimary"
                      dir=""
                      size="w-16"
                    />
                  </div>
                  <ThirdPlaceColumn className="w-full" />
                </motion.div>
              </motion.div>

              {/* Remaining leaderboard list */}
              <motion.div
                className="flex flex-col w-full gap-2"
                initial="hidden"
                animate="visible"
                variants={listVariants}
              >
                {sortedData
                  .slice(3, Math.min(sortedData.length, sortedData.length))
                  .map((item: LeaderboardItem, index: number) => (
                    <motion.div
                      key={item.id}
                      className="flex flex-row-reverse items-center justify-between w-full p-1 border-2 rounded-2xl"
                      variants={listItemVariants}
                    >
                      <div className="scale-90">
                        <MedalAndLevel
                          level={item.level}
                          color="text-black"
                          dir=""
                          size="w-16"
                        />
                      </div>
                      <div className="flex flex-col">
                        <h1 className="text-[#999] uppercase text-xs text-center">
                          {item.class.category}
                        </h1>
                        <h1 className="text-[#999] uppercase text-xs text-center">
                          {item.class.classname}
                        </h1>
                      </div>
                      <div className="flex-row-reverse gap-2 flex-center">
                        <div className="flex flex-col ">
                          <h1 className="text-black">
                            {item.user.firstName + " " + item.user.lastName}
                          </h1>
                          <p className="text-sm font-medium text-gray-500">
                            {`${t("المركز")} ${t(`${index + 4}`)}`}
                          </p>
                        </div>

                        <div className="w-12 h-12">
                          <GetAvatar
                            userAvatarData={item.user.profileImg ?? undefined}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            </>
          )}
        </div>

        {/* Filter Modal */}
        <LeaderboardsFilter
          isVisible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onFilterChange={handleFilterChange}
        />

        {userRole == "Student" ? (
          <StudentNavbar />
        ) : userRole == "Teacher" ? (
          <TeacherNavbar />
        ) : (
          <ParentNavbar />
        )}
      </div>
    </div>
  );
};

export default Leaderboards;
