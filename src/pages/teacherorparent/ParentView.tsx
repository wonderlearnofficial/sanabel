import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import SearchIcon from "../../icons/SearchIcon";
import FilterIcon from "../../icons/Leaderboards/FilterIcon";
import GoBackButton from "../../components/GoBackButton";
import GetAvatar from "../student/tutorial/GetAvatar";
import MedalAndLevel from "../../components/MedalAndLevel";
import { calculateLevel } from "../../utils/LevelCalculator";
import { FiGrid } from "react-icons/fi";
import { FaThList } from "react-icons/fa";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import ParentNavbar from "../../components/navbar/ParentNavbar";

const ParentView: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentsData, setStudentsData]: any = useState([]);
  const [layoutType, setLayoutType] = useState<"grid" | "row">("grid");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "level_high", label: "المستوى (الأعلى)" },
    { value: "level_low", label: "المستوى (الأدنى)" },
    { value: "name_asc", label: "الاسم (أ-ي)" },
    { value: "name_desc", label: "الاسم (ي-أ)" },
  ];

  // Fetch students data on component mount
  useEffect(() => {
    fetchStudentsData();
  }, []);

  const fetchStudentsData = async () => {
    setIsLoading(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `https://sanabel.wonderlearn.net/parents/appear-student-by-parent`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        // Ensure data.data is an array, if it's a single object, wrap it in an array
        const studentsArray = Array.isArray(data.data)
          ? data.data
          : [data.data];
        setStudentsData(studentsArray);
        console.log("Students data:", studentsArray);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort students based on search query and active filter
  const getFilteredStudents = () => {
    // Ensure studentsData is an array before filtering
    if (!Array.isArray(studentsData)) {
      return [];
    }

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
    history.push(`/parent/student/${studentId}`);
  };

  const role = localStorage.getItem("role");

  return (
    <div
      className="flex flex-col items-center justify-between gap-5 p-4 overflow-y-auto"
      id="page-height"
    >
      {/* Header */}
      <div className="flex-col w-full gap-3 flex-center">
        <div className="flex flex-row-reverse items-center justify-between w-full">
          <div className="w-16"></div>
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-black text-end">
              {t("استعرض الطلاب")}
            </h1>
          </div>
          <GoBackButton />
        </div>
      </div>

      {/* Search Bar and Layout Options */}
      <div className="w-full space-y-3 ">
        {/* Filter and Layout Options Row */}
        <div className="flex items-center justify-between w-full">
          {/* Filter Menu */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-xl "
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
          <div className="flex items-center gap-2 overflow-hidden bg-gray-200 rounded-xl">
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
            className="w-full py-3 text-black bg-transparent drop-shadow-sm "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full overflow-y-auto">
        {/* Students View - with Grid and Row layout options */}
        <div className="flex flex-col items-start w-full gap-2">
          <h1 className="text-xl font-bold text-black ">{t("الطلاب")}</h1>

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
                        {student.Class?.classname || null}
                      </span>
                      <span className="text-sm text-gray-500 uppercase">
                        {student.Class?.category || null}
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
                    className="flex flex-row-reverse items-center justify-between w-full p-1 border-2 rounded-xl "
                    onClick={() => navigateToStudentDetail(student.id)}
                  >
                    <MedalAndLevel
                      level={calculateLevel(student.xp).level}
                      color="text-black text-sm"
                      dir="horizontal"
                      size={"w-12"}
                    />

                    <div className="flex-col flex-center">
                      <span className="text-sm text-gray-500 capitalize">
                        {student.Class?.classname}
                      </span>
                      <span className="text-sm text-gray-500 uppercase">
                        {student.Class?.category}
                      </span>
                    </div>
                    <div className="flex flex-col items-center w-full">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <GetAvatar userAvatarData={student.user.profileImg} />
                      </div>
                      <h1 className="font-medium text-black">
                        {`${student.user.firstName} ${student.user.lastName}`}
                      </h1>
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
      </div>

      {/* Navigation */}
      {role == "Student" ? <StudentNavbar /> : <ParentNavbar />}
    </div>
  );
};

export default ParentView;
