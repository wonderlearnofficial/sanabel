import { API_BASE_URL } from "../../../config/api";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import SearchIcon from "../../../icons/SearchIcon";
import FilterIcon from "../../../icons/Leaderboards/FilterIcon";
import GoBackButton from "../../../components/GoBackButton";
import GetAvatar from "../../student/tutorial/GetAvatar";
import MedalAndLevel from "../../../components/MedalAndLevel";
import { calculateLevel } from "../../../utils/LevelCalculator";
import { FiGrid } from "react-icons/fi";
import { FaThList } from "react-icons/fa";

const ClassDetails: React.FC = () => {
  const history = useHistory();

  const { classId } = useParams<{ classId: string }>();

  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>("");
  type Student = {
    id: number;
    xp: number;
    user: {
      firstName: string;
      lastName: string;
      profileImg?: string;
    };
    class?: {
      classname?: string;
    };
  };

  const [studentsData, setStudentsData] = useState<Student[]>([]);

  const [layoutType, setLayoutType] = useState<"grid" | "row">("grid");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "level_high", label: "المستوى (الأعلى)" },
    { value: "level_low", label: "المستوى (الأدنى)" },
    { value: "name_asc", label: "الاسم (أ-ي)" },
    { value: "name_desc", label: "الاسم (ي-أ)" },
  ];

  // Fetch class data and its students on component mount
  useEffect(() => {
    fetchClassStudents();
  }, [classId]);

  const fetchClassStudents = async () => {
    setIsLoading(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/appear-student-class/${classId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStudentsData(data.data || []);
        console.log("Fetched students data:", data.data);
      }
      console.log("Students data:", studentsData);
    } catch (error) {
      console.error("Error fetching class students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort students based on search query and active filter
  const getFilteredStudents = () => {
    const searchFiltered = studentsData.filter((student: any) =>
      `${student.user.firstName} ${student.user.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

    // Apply sorting based on active filter
    switch (activeFilter) {
      case "level_high":
        return [...searchFiltered].sort(
          (a, b) => calculateLevel(b.xp).level - calculateLevel(a.xp).level,
        );
      case "level_low":
        return [...searchFiltered].sort(
          (a, b) => calculateLevel(a.xp).level - calculateLevel(b.xp).level,
        );
      case "name_asc":
        return [...searchFiltered].sort((a, b) =>
          a.user.firstName.localeCompare(b.user.firstName),
        );
      case "name_desc":
        return [...searchFiltered].sort((a, b) =>
          b.user.firstName.localeCompare(a.user.firstName),
        );
      default:
        return searchFiltered;
    }
  };

  const filteredStudents = getFilteredStudents();

  // Navigate to student details page
  const navigateToStudentDetail = (studentId: number) => {
    history.push(`/teacher/student/${studentId}`);
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full gap-3 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <div className="opacity-0 w-[25px]" />
        <h1 className="self-center text-2xl font-bold text-black">
          {t("تفاصيل الفصل")}
        </h1>
        <GoBackButton />
      </div>

      {/* Class Info Card */}
      <div className="flex items-center justify-center w-full h-16 p-2 my-5 bg-redprimary rounded-xl">
        <h1 className="text-xl font-bold text-center text-white capitalize">
          {studentsData[0]?.class?.classname}
        </h1>
      </div>

      {/* Student List Header and Search */}
      <div className="flex flex-col w-full gap-2">
        <div className="flex flex-row-reverse justify-between w-full">
          <h1 className="text-[#999]">
            {filteredStudents.length} {t("طالب")}
          </h1>
          <h1 className="text-xl font-bold text-black text-end">
            {t("الطلاب")}
          </h1>
        </div>

        {/* Filter and Layout Options Row */}
        <div className="flex items-center justify-between w-full mb-3">
          {/* Filter Menu */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-xl"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <FilterIcon />
              <span className="text-gray-700">
                {t(
                  filterOptions.find((opt) => opt.value === activeFilter)
                    ?.label || "فلتر",
                )}
              </span>
            </div>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute left-0 z-10 mt-2 text-black bg-white border shadow-lg rounded-xl min-w-max">
                {filterOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                      activeFilter === option.value
                        ? "bg-gray-100 font-medium"
                        : ""
                    }`}
                    onClick={() => {
                      setActiveFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {t(option.label)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Layout Switcher */}
          <div className="flex flex-row-reverse items-center gap-2 overflow-hidden bg-gray-200 rounded-xl">
            <div
              className={`p-2 cursor-pointer ${
                layoutType === "grid"
                  ? "bg-blueprimary text-white"
                  : "text-gray-700"
              }`}
              onClick={() => setLayoutType("grid")}
            >
              <FiGrid size={20} />
            </div>
            <div
              className={`p-2 cursor-pointer ${
                layoutType === "row"
                  ? "bg-blueprimary text-white"
                  : "text-gray-700"
              }`}
              onClick={() => setLayoutType("row")}
            >
              <FaThList size={20} />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex flex-row-reverse items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
          <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
            <SearchIcon className="text-white" size={20} />
          </div>
          <input
            type="text"
            placeholder={t("ابحث عن طالب")}
            className="w-full py-3 text-black bg-transparent drop-shadow-sm text-start"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Students List */}
      <div className="flex-1 w-full mt-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center w-full py-10">
            <p className="text-gray-500">{t("جاري التحميل...")}</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          layoutType === "grid" ? (
            // Grid View
            <div className="grid w-full grid-cols-3 gap-2 mt-2">
              {filteredStudents.map((student: any) => (
                <div
                  key={student.id}
                  className="flex flex-col items-center gap-1 p-2 border-2 cursor-pointer rounded-xl hover:bg-gray-50"
                  onClick={() => navigateToStudentDetail(student.id)}
                >
                  <div className="w-12 h-12 mb-1 rounded-full">
                    <GetAvatar userAvatarData={student.user.profileImg} />
                  </div>
                  <h1 className="font-medium text-center text-black">
                    {`${student.user.firstName}`}
                  </h1>
                  <div className="flex-col flex-center">
                    <span className="text-sm text-gray-500 capitalize">
                      {student.class?.classname}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {student.grade}
                    </span>
                  </div>
                  <MedalAndLevel
                    level={calculateLevel(student.xp).level}
                    color="text-black text-sm"
                    dir=""
                    size={"w-12"}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Row View
            <div className="flex flex-col w-full gap-2 mt-1">
              {filteredStudents.map((student: any) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 border-2 cursor-pointer rounded-xl hover:bg-gray-50"
                  onClick={() => navigateToStudentDetail(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <MedalAndLevel
                      level={calculateLevel(student.xp).level}
                      color="text-black text-sm"
                      dir=""
                      size={"w-12"}
                    />
                    <div className="flex-col flex-center">
                      <span className="text-sm text-gray-500 capitalize">
                        {student.class?.classname}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {student.grade}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <h1 className="font-medium text-black">
                      {`${student.user.firstName} ${student.user.lastName}`}
                    </h1>
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <GetAvatar userAvatarData={student.user.profileImg} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center w-full py-10">
            <p className="text-gray-500">{t("لا يوجد طلاب")}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <TeacherNavbar />
    </div>
  );
};

export default ClassDetails;
