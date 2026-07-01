import { API_BASE_URL } from "../../config/api";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import TeacherNavbar from "../../components/navbar/TeacherNavbar";
import SearchIcon from "../../icons/SearchIcon";
import FilterIcon from "../../icons/Leaderboards/FilterIcon";
import GoBackButton from "../../components/GoBackButton";
import GetAvatar from "../student/tutorial/GetAvatar";
import MedalAndLevel from "../../components/MedalAndLevel";
import { calculateLevel } from "../../utils/LevelCalculator";
import { FiGrid } from "react-icons/fi";
import { FaThList } from "react-icons/fa";

// Define types for better type safety

const TeacherView: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [selectViewType, setSelectViewType] = useState("students");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentsData, setStudentsData]: any = useState([]);
  const [classesData, setClassesData]: any = useState([]);
  const [classStudentsData, setClassStudentsData] = useState<
    Record<number, any[]>
  >({});
  const [classXpData, setClassXpData]: any = useState({});
  const [layoutType, setLayoutType] = useState<"grid" | "row">("grid");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClassXp, setIsLoadingClassXp] = useState(false);

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "level_high", label: "المستوى (الأعلى)" },
    { value: "level_low", label: "المستوى (الأدنى)" },
    { value: "name_asc", label: "الاسم (أ-ي)" },
    { value: "name_desc", label: "الاسم (ي-أ)" },
  ];

  const classFilterOptions = [
    { value: "all", label: "الكل" },
    { value: "xp_high", label: "النقاط (الأعلى)" },
    { value: "xp_low", label: "النقاط (الأدنى)" },
    { value: "name_asc", label: "الاسم (أ-ي)" },
    { value: "name_desc", label: "الاسم (ي-أ)" },
    { value: "students_high", label: "عدد الطلاب (الأعلى)" },
    { value: "students_low", label: "عدد الطلاب (الأدنى)" },
  ];

  // Fetch students data on component mount
  useEffect(() => {
    fetchStudentsData();
    fetchClassesData();
  }, []);

  // Fetch class XP data when classes are loaded
  useEffect(() => {
    if (classesData.length > 0) {
      fetchClassXpData();
    }
  }, [classesData]);

  const fetchStudentsData = async () => {
    setIsLoading(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/appear-student`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setStudentsData(data.data);
        console.log("Students data:", data.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassesData = async () => {
    setIsLoading(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/appear-class`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setClassesData(data.data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students for each class to calculate total XP
  const fetchClassXpData = async () => {
    setIsLoadingClassXp(true);
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoadingClassXp(false);
      return;
    }

    const xpDataObj: Record<number, { totalXp: number; studentCount: number }> =
      {};

    try {
      // Process classes sequentially to avoid rate limiting
      for (const classItem of classesData) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/teachers/appear-student-class/${classItem.classId}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            },
          );

          if (response.ok) {
            const data = await response.json();
            const students = data.data || [];

            // Calculate total XP for this class
            const totalXp = students.reduce(
              (sum: number, student: any) => sum + (student.xp || 0),
              0,
            );

            xpDataObj[classItem.classId] = {
              totalXp,
              studentCount: students.length,
            };
          }
        } catch (error) {
          console.error(
            `Error fetching students for class ${classItem.classId}:`,
            error,
          );
          // Set default values if fetch fails
          xpDataObj[classItem.classId] = {
            totalXp: 0,
            studentCount: 0,
          };
        }
      }

      setClassXpData(xpDataObj);
    } catch (error) {
      console.error("Error in fetchClassXpData:", error);
    } finally {
      setIsLoadingClassXp(false);
    }
  };

  // Fetch students for each class (for avatars)
  const fetchClassStudents = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    const studentsDataObj: Record<number, any[]> = {};

    try {
      // Process classes sequentially
      for (const classItem of classesData) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/teachers/appear-student-class/${classItem.classId}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            },
          );

          if (response.ok) {
            const data = await response.json();
            const students = data.data || [];

            studentsDataObj[classItem.classId] = students.slice(0, 10);
          }
        } catch (error) {
          console.error(
            `Error fetching students for class ${classItem.classId}:`,
            error,
          );
          studentsDataObj[classItem.classId] = [];
        }
      }

      setClassStudentsData(studentsDataObj);
    } catch (error) {
      console.error("Error in fetchClassStudents:", error);
    }
  };

  // Modify your useEffect to call the new function
  useEffect(() => {
    if (classesData.length > 0) {
      fetchClassXpData();
      fetchClassStudents(); // Add this line
    }
  }, [classesData]);

  // Helper function to render student avatars
  const renderClassAvatars = (classId: number) => {
    const students = classStudentsData[classId] || [];

    if (students.length === 0) {
      return (
        <div className="text-xs italic text-gray-400">{t("لا يوجد طلاب")}</div>
      );
    }

    return (
      <div className="flex -space-x-3 rtl:space-x-reverse">
        {students.map((student, index) => (
          <div
            key={student.id}
            className="relative z-10 w-8 h-8 overflow-hidden border-2 border-white rounded-full"
            style={{ marginLeft: index > 0 ? "-0.75rem" : "0" }}
          >
            <GetAvatar userAvatarData={student.user.profileImg} />
          </div>
        ))}
        {classXpData[classId]?.studentCount > 10 && (
          <div className="flex items-center justify-center w-8 h-8 text-xs font-medium bg-gray-200 border-2 border-white rounded-full">
            +{classXpData[classId]?.studentCount - 10}
          </div>
        )}
      </div>
    );
  };

  // Filter and sort students based on search query and active filter
  const getFilteredStudents = () => {
    const searchFiltered = studentsData.filter((student: any) => {
      const firstName = student?.user?.firstName ?? "";
      const lastName = student?.user?.lastName ?? "";
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });

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

  // Filter and sort classes based on search query and active filter
  const getFilteredClasses = () => {
    const searchFiltered = classesData.filter((classItem: any) =>
      classItem.className.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Apply sorting based on active filter
    switch (activeFilter) {
      case "xp_high":
        return [...searchFiltered].sort(
          (a, b) =>
            (classXpData[b.classId]?.totalXp || 0) -
            (classXpData[a.classId]?.totalXp || 0),
        );
      case "xp_low":
        return [...searchFiltered].sort(
          (a, b) =>
            (classXpData[a.classId]?.totalXp || 0) -
            (classXpData[b.classId]?.totalXp || 0),
        );
      case "name_asc":
        return [...searchFiltered].sort((a, b) =>
          a.className.localeCompare(b.className),
        );
      case "name_desc":
        return [...searchFiltered].sort((a, b) =>
          b.className.localeCompare(a.className),
        );
      case "students_high":
        return [...searchFiltered].sort(
          (a, b) =>
            (classXpData[b.classId]?.studentCount || 0) -
            (classXpData[a.classId]?.studentCount || 0),
        );
      case "students_low":
        return [...searchFiltered].sort(
          (a, b) =>
            (classXpData[a.classId]?.studentCount || 0) -
            (classXpData[b.classId]?.studentCount || 0),
        );
      default:
        return searchFiltered;
    }
  };

  const filteredStudents = getFilteredStudents();
  const filteredClasses = getFilteredClasses();

  // Modified to navigate to student details page
  const navigateToStudentDetail = (studentId: number) => {
    history.push(`/teacher/student/${studentId}`);
  };

  // Navigate to class detail page if needed
  const navigateToClassDetail = (classId: number) => {
    // Implement if needed
    history.push(`/teacher/classes/${classId}`);
  };

  return (
    <div
      className="flex flex-col items-center justify-between gap-5 p-4 overflow-y-auto"
      id="page-height"
    >
      {/* Header */}

      <div className="flex flex-row-reverse items-center justify-between w-full">
        <div className="w-16"></div>
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-black ">
            {t("استعرض الطلاب")}
          </h1>
        </div>
        <GoBackButton />
      </div>

      {/* View Type Selector */}
      <div className="flex justify-between w-full p-1 my-2 bg-gray-200 rounded-3xl">
        <div
          className={`w-full text-center py-1 rounded-3xl ${
            selectViewType === "students"
              ? "bg-blueprimary text-white"
              : "text-gray-500"
          }`}
          onClick={() => setSelectViewType("students")}
        >
          <h1>{t("طلاب")}</h1>
        </div>

        <div
          className={`w-full text-center py-1 rounded-3xl ${
            selectViewType === "classes"
              ? "bg-blueprimary text-white"
              : "text-gray-500"
          }`}
          onClick={() => setSelectViewType("classes")}
        >
          <h1>{t("فصول")}</h1>
        </div>
      </div>

      {/* Search Bar and Layout Options */}
      <div className="w-full space-y-3 ">
        {/* Filter and Layout Options Row */}
        <div className="flex items-center justify-between w-full f">
          {/* Filter Menu */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-xl "
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <FilterIcon />
              <span className="text-gray-700">
                {t(
                  (selectViewType === "students"
                    ? filterOptions
                    : classFilterOptions
                  ).find((opt) => opt.value === activeFilter)?.label || "فلتر",
                )}
              </span>
            </div>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute left-0 z-10 mt-2 text-black bg-white border shadow-lg rounded-xl min-w-max">
                {(selectViewType === "students"
                  ? filterOptions
                  : classFilterOptions
                ).map((option) => (
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

          {/* Layout Switcher - Only for Students View */}
          {selectViewType === "students" && (
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
          )}
        </div>

        {/* Search bar */}
        <div className="flex flex-row-reverse items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
          <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
            <SearchIcon className="text-white" size={20} />
          </div>
          <input
            type="text"
            placeholder={t(
              selectViewType === "students"
                ? t("ابحث عن طالب")
                : t("ابحث عن فصل"),
            )}
            className="w-full py-3 text-black bg-transparent drop-shadow-sm text-start"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full overflow-y-auto ">
        {/* Classes View */}
        {selectViewType === "classes" && (
          <div className="flex flex-col items-end w-full gap-2">
            <h1 className="text-xl font-bold text-black ">{t("الفصول")}</h1>
            <div className="flex flex-col w-full gap-3">
              {isLoading || isLoadingClassXp ? (
                <div className="flex items-center justify-center w-full py-10">
                  <p className="text-gray-500">{t("جاري التحميل...")}</p>
                </div>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((item: any) => (
                  <div
                    key={item.classId}
                    className="flex justify-between w-full p-4 border-2 cursor-pointer rounded-xl hover:bg-gray-50"
                    onClick={() => navigateToClassDetail(item.classId)}
                  >
                    <div className="flex items-center gap-2">
                      <MedalAndLevel
                        level={
                          calculateLevel(
                            classXpData[item.classId]?.totalXp || 0,
                          ).level
                        }
                        color={"text-black text-center"}
                        dir={""}
                        size={""}
                      />
                    </div>
                    <div className="flex flex-col w-full ">
                      <h1 className="text-black capitalize text-md">
                        {item.className}
                      </h1>
                      <h1 className="text-sm text-gray-500 capitalize">
                        {item.organizationName}
                      </h1>

                      <div className="px-3 py-1 font-medium text-gray-800 rounded-lg">
                        {classXpData[item.classId]?.studentCount + " " || 0}
                        {t("طلاب")}
                      </div>

                      <div className="flex justify-end w-full mt-2">
                        {renderClassAvatars(item.classId)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full py-10">
                  <p className="text-gray-500">{t("لا يوجد فصول")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students View - with Grid and Row layout options */}
        {selectViewType === "students" && (
          <div className="flex flex-col items-end w-full gap-2">
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
                          {student.Class?.classname || t("لا يوجد فصل")}
                        </span>
                        <span className="text-sm text-gray-500 uppercase">
                          {student.Class?.category || t("لا يوجد فصل")}
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
                          {student.Class?.classname || t("لا يوجد فصل")}
                        </span>
                        <span className="text-sm text-gray-500 uppercase">
                          {student.Class?.category || t("لا يوجد فصل")}
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
        )}
      </div>

      {/* Navigation */}
      <TeacherNavbar />
    </div>
  );
};

export default TeacherView;
