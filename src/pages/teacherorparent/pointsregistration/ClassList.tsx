import { API_BASE_URL } from "../../../config/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import SearchIcon from "../../../icons/SearchIcon";
import GoBackButton from "../../../components/GoBackButton";
import PrimaryButton from "../../../components/PrimaryButton";
import GetAvatar from "../../student/tutorial/GetAvatar";
import {
  FaCheck,
  FaTimes,
  FaFilter,
  FaSort,
  FaChevronDown,
} from "react-icons/fa";
import { taskdata } from "../../../data/SanabelBackData";
import { taskCategories } from "../../../data/SanabelTypeBackData";
import { sanabelImgs } from "../../../data/SanabelDictionary";
import MedalAndLevel from "../../../components/MedalAndLevel";
import { calculateLevel } from "../../../utils/LevelCalculator";
// Sanabel Types
import sanabelType1Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";
import sanabelType2Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";
// Sanabel
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";

// Define types for better type safety
interface User {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  profileImg: any;
}

interface StudentData {
  id: number;
  userId: number;
  user: User;
  Class?: any;
  xp: number;
}

interface ClassData {
  classId: number;
  className: string;
  organizationName: string;
  studentCount?: number;
}

interface TaskCategory {
  id: number;
  title: string;
  description: string;
}

interface Task {
  type: string;
  title: string;
  description: string;
  categoryId: number;
  xp: number;
  kind?: string;
  snabelRed: number;
  snabelYellow: number;
  snabelBlue: number;
}

// Filter and Sort Dropdown Component
const FilterSortDropdown = ({
  isOpen,
  onClose,
  onApply,
  type,
  currentFilter,
  currentSort,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filter: string, sort: string) => void;
  type: "class" | "student";
  currentFilter: string;
  currentSort: string;
}) => {
  const { t } = useTranslation();
  const [tempFilter, setTempFilter] = useState(currentFilter);
  const [tempSort, setTempSort] = useState(currentSort);

  if (!isOpen) return null;

  const classFilters = [
    { value: "all", label: t("الكل") },
    { value: "high_xp", label: t("نقاط خبرة عالية") },
    { value: "medium_xp", label: t("نقاط خبرة متوسطة") },
    { value: "low_xp", label: t("نقاط خبرة منخفضة") },
    // { value: "large_class", label: t("فصل كبير (+20 طالب)") },
    // { value: "small_class", label: t("فصل صغير (-10 طلاب)") },
  ];

  const classSorts = [
    { value: "name_asc", label: t("الاسم (أ-ي)") },
    { value: "name_desc", label: t("الاسم (ي-أ)") },
    { value: "xp_high", label: t("نقاط الخبرة (عالي-منخفض)") },
    { value: "xp_low", label: t("نقاط الخبرة (منخفض-عالي)") },
    { value: "student_count_high", label: t("عدد الطلاب (كثير-قليل)") },
    { value: "student_count_low", label: t("عدد الطلاب (قليل-كثير)") },
  ];

  const studentFilters = [
    { value: "all", label: t("الكل") },
    { value: "high_level", label: t("مستوى عالي (10+)") },
    { value: "medium_level", label: t("مستوى متوسط (5-9)") },
    { value: "low_level", label: t("مستوى منخفض (1-4)") },
    { value: "high_xp", label: t("نقاط خبرة عالية") },
    { value: "medium_xp", label: t("نقاط خبرة متوسطة") },
    { value: "low_xp", label: t("نقاط خبرة منخفضة") },
  ];

  const studentSorts = [
    { value: "name_asc", label: t("الاسم (أ-ي)") },
    { value: "name_desc", label: t("الاسم (ي-أ)") },
    { value: "xp_high", label: t("نقاط الخبرة (عالي-منخفض)") },
    { value: "xp_low", label: t("نقاط الخبرة (منخفض-عالي)") },
    { value: "level_high", label: t("المستوى (عالي-منخفض)") },
    { value: "level_low", label: t("المستوى (منخفض-عالي)") },
  ];

  const filters = type === "class" ? classFilters : studentFilters;
  const sorts = type === "class" ? classSorts : studentSorts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
      dir="rtl"
    >
      <div className="w-11/12 max-w-md p-5 overflow-y-auto bg-white rounded-xl max-h-90vh ">
        <h2 className="mb-4 text-xl font-bold text-center text-black">
          {t("تصفية وترتيب")}
        </h2>

        {/* Filter Section */}
        <div className="mb-4">
          <h3 className="mb-2 font-semibold text-black">{t("تصفية حسب")}</h3>
          <div className="space-y-2">
            {filters.map((filter) => (
              <label
                key={filter.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="filter"
                  value={filter.value}
                  checked={tempFilter === filter.value}
                  onChange={(e) => setTempFilter(e.target.value)}
                  className="text-blueprimary"
                />
                <span className="text-black">{filter.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort Section */}
        <div className="mb-5">
          <h3 className="mb-2 font-semibold text-black">{t("ترتيب حسب")}</h3>
          <div className="space-y-2">
            {sorts.map((sort) => (
              <label
                key={sort.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="sort"
                  value={sort.value}
                  checked={tempSort === sort.value}
                  onChange={(e) => setTempSort(e.target.value)}
                  className="text-blueprimary"
                />
                <span className="text-black">{sort.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex w-full gap-3">
          <PrimaryButton
            style="bg-gray-300 text-black flex-1"
            text={t("إلغاء")}
            arrow="none"
            onClick={onClose}
          />
          <PrimaryButton
            style="flex-1"
            text={t("تطبيق")}
            arrow="none"
            onClick={() => {
              onApply(tempFilter, tempSort);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Duplicate Task Popup Component (same as StudentList)
const DuplicateTaskPopup = ({
  isOpen,
  onClose,
  onContinue,
  existingStudentIds,
  allStudents,
  onDeselectStudent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  existingStudentIds: number[];
  allStudents: StudentData[];
  onDeselectStudent: (studentId: number) => void;
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const existingStudents = existingStudentIds
    .map((id) => allStudents.find((student) => student.id === id))
    .filter(Boolean) as StudentData[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-11/12 max-w-md p-5 overflow-y-auto bg-white rounded-xl max-h-90vh">
        <h2 className="mb-4 text-xl font-bold text-center text-black">
          {t("مهمة مكررة!")}
        </h2>

        <p className="mb-4 text-center text-gray-600">
          {t("بعض الطلاب أكملوا هذه المهمة بالفعل اليوم")}
        </p>

        <div className="mb-5">
          <div className="flex flex-wrap justify-center gap-3">
            {existingStudents.map((student) => (
              <div
                key={student.id}
                className="relative flex flex-col items-center"
              >
                <div
                  className="absolute z-10 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full cursor-pointer -top-1 -right-1"
                  onClick={() => onDeselectStudent(student.id)}
                >
                  <FaTimes className="text-xs text-white" />
                </div>
                <div className="w-16 h-16 overflow-hidden rounded-full">
                  <GetAvatar userAvatarData={student.user.profileImg} />
                </div>
                <span className="mt-1 text-xs font-medium text-center text-black">
                  {`${student.user.firstName}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full gap-3">
          <PrimaryButton
            style="bg-gray-300 text-black flex-1"
            text={t("إلغاء")}
            arrow="none"
            onClick={onClose}
          />
          <PrimaryButton
            style=""
            text={t("تسجيل للباقي")}
            arrow="none"
            onClick={onContinue}
          />
        </div>
      </div>
    </div>
  );
};

// Confirmation Popup Component (same as StudentList)
const ConfirmationPopup = ({
  isOpen,
  onClose,
  onConfirm,
  selectedTask,
  selectedStudents,
  onRemoveStudent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTask: Task | null;
  selectedStudents: StudentData[];
  onRemoveStudent: (studentId: number) => void;
}) => {
  const { t } = useTranslation();

  if (!isOpen || !selectedTask) return null;

  const getTaskTypeImage = (type: string) => {
    return sanabelImgs[type] || null;
  };

  const renderResources = (task: any) =>
    [
      { icon: blueSanabel, value: task.snabelBlue, label: "سنبلة زرقاء" },
      { icon: redSanabel, value: task.snabelRed, label: "سنبلة حمراء" },
      { icon: yellowSanabel, value: task.snabelYellow, label: "سنبلة صفراء" },
      { icon: xpIcon, value: task.xp, label: "نقاط الخبرة" },
    ].map((resource, index) => (
      <div key={index} className="flex flex-col items-center">
        <img
          src={resource.icon}
          alt={resource.label}
          className="w-auto h-5"
          loading="lazy"
        />
        <h1 className="text-sm text-black">{resource.value}</h1>
      </div>
    ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-11/12 max-w-md p-5 overflow-y-auto bg-white rounded-xl max-h-90vh">
        <h2 className="mb-4 text-xl font-bold text-center text-black">
          {t("تأكيد تسجيل المهمة")}
        </h2>

        <div className="flex-col justify-center w-full p-3 mb-5 border-2 rounded-xl flex-center">
          <h3 className="mb-2 text-lg font-bold text-center text-black">
            {t(selectedTask?.title || "")}
          </h3>
          <div className="flex justify-center mb-3">
            <img
              src={getTaskTypeImage(selectedTask?.type ?? "")}
              alt={selectedTask?.type}
              className="object-contain w-16 h-16"
            />
          </div>
          <div className="flex items-center justify-end gap-3 mb-2">
            <div className="flex gap-2">{renderResources(selectedTask)}</div>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 font-medium text-right text-black">
            {t("الطلاب المختارين")}
          </h3>
          <div className="flex justify-start gap-3 px-4 py-2 overflow-x-auto ">
            {selectedStudents.map((student: any) => (
              <div
                key={student.id}
                className="relative flex flex-col items-center"
              >
                <div
                  className="absolute z-10 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full cursor-pointer -top-1 -right-1"
                  onClick={() => onRemoveStudent(student.id)}
                >
                  <FaTimes className="text-xs text-white" />
                </div>
                <div className="overflow-hidden rounded-full w-14 h-14">
                  <GetAvatar userAvatarData={student.user.profileImg} />
                </div>
                <span className="mt-1 text-xs font-medium text-center text-black">
                  {`${student.user.firstName}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full gap-3">
          <PrimaryButton
            style="bg-gray-300 text-black flex-1"
            text={t("إلغاء")}
            arrow="none"
            onClick={onClose}
          />
          <PrimaryButton
            style="flex-1"
            text={t("تأكيد")}
            arrow="none"
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
};

// Congratulations Popup Component (same as StudentList)
const CongratsPopup = ({
  isOpen,
  onClose,
  selectedTask,
  selectedStudents,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  selectedStudents: StudentData[];
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getTaskTypeImage = (type: string) => {
    return sanabelImgs[type] || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-11/12 max-w-md p-5 text-center bg-white rounded-xl">
        <div className="flex justify-center mb-2">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <FaCheck className="text-3xl text-green-500" />
          </div>
        </div>
        <div className="flex-col justify-center w-full mb-3 flex-center">
          <h2 className="mb-2 text-xl font-bold text-black">
            {t("تم تسجيل المهمة بنجاح")}
          </h2>
          <p className="mb-2 text-gray-600">
            <span className="font-bold">{t(selectedTask?.title || "")}</span>
          </p>
          <p className="mb-4 text-gray-600">
            {t("لعدد")}{" "}
            <span className="font-bold text-blueprimary">
              {selectedStudents.length}
            </span>{" "}
            {t("طالب")}
          </p>
          <img
            src={getTaskTypeImage(selectedTask?.type ?? "")}
            alt={selectedTask?.type}
            className="object-contain w-16 h-16"
          />
        </div>
        {selectedTask && (
          <div className="flex justify-center gap-3 mb-4">
            {[
              { icon: blueSanabel, value: selectedTask.snabelBlue },
              { icon: redSanabel, value: selectedTask.snabelRed },
              { icon: yellowSanabel, value: selectedTask.snabelYellow },
              { icon: xpIcon, value: selectedTask.xp },
            ].map((resource, index) => (
              <div key={index} className="flex flex-col items-center">
                <img
                  src={resource.icon}
                  alt="icon"
                  className="w-auto h-6"
                  loading="lazy"
                />
                <h1 className="text-sm font-bold text-black">
                  +{resource.value}
                </h1>
              </div>
            ))}
          </div>
        )}

        <PrimaryButton
          style="w-full bg-blueprimary"
          text={t("حسناً")}
          arrow="none"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

const ClassList: React.FC = () => {
  const { t } = useTranslation();
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [classXpData, setClassXpData] = useState<
    Record<number, { totalXp: number; studentCount: number }>
  >({});
  // Add new state for class students data
  const [classStudentsData, setClassStudentsData] = useState<
    Record<number, StudentData[]>
  >({});
  const [isClassSelected, setIsClassSelected] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isStudentsSelected, setIsStudentsSelected] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showDuplicateTask, setShowDuplicateTask] = useState(false);
  const [existingStudentIds, setExistingStudentIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New states for filtering and sorting
  const [showFilterSort, setShowFilterSort] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [classSort, setClassSort] = useState("name_asc");
  const [studentFilter, setStudentFilter] = useState("all");
  const [studentSort, setStudentSort] = useState("name_asc");

  const sanabelTypeImg = [
    sanabelType1Img,
    sanabelType2Img,
    sanabelType3Img,
    sanabelType4Img,
  ];

  // Fetch classes data on component mount
  useEffect(() => {
    fetchClassesData();
  }, []);

  // Update available types when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const typesForCategory = [
        ...new Set(
          taskdata
            .filter((task) => task.categoryId === selectedCategoryId)
            .map((task) => task.type)
        ),
      ];
      setAvailableTypes(typesForCategory);
      setSelectedType(null);
      setFilteredTasks([]);
    }
  }, [selectedCategoryId]);

  // Update filtered tasks when type changes
  useEffect(() => {
    if (selectedType) {
      const tasksForType = taskdata.filter(
        (task) =>
          task.categoryId === selectedCategoryId && task.type === selectedType
      );
      setFilteredTasks(tasksForType);
      setSelectedTaskId(null);
    }
  }, [selectedType, selectedCategoryId]);

  // Fetch class students data when classes are loaded
  useEffect(() => {
    if (classesData.length > 0) {
      fetchAllClassStudents();
    }
  }, [classesData]);

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
        }
      );
      if (response.ok) {
        const data = await response.json();
        setClassesData(data.data);
        console.log("Classes data:", data.data);
        // Fetch XP data for each class
        fetchClassXpData(data.data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassXpData = async (classes: ClassData[]) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    const xpDataObj: Record<number, { totalXp: number; studentCount: number }> =
      {};

    try {
      for (const classItem of classes) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/teachers/appear-student-class/${classItem.classId}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const students = data.data || [];

            const totalXp = students.reduce(
              (sum: number, student: any) => sum + (student.xp || 0),
              0
            );

            xpDataObj[classItem.classId] = {
              totalXp,
              studentCount: students.length,
            };
          }
        } catch (error) {
          console.error(
            `Error fetching students for class ${classItem.classId}:`,
            error
          );
          xpDataObj[classItem.classId] = {
            totalXp: 0,
            studentCount: 0,
          };
        }
      }

      setClassXpData(xpDataObj);
    } catch (error) {
      console.error("Error in fetchClassXpData:", error);
    }
  };

  // New function to fetch students for all classes (for avatars display)
  const fetchAllClassStudents = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    const studentsDataObj: Record<number, StudentData[]> = {};

    try {
      for (const classItem of classesData) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/teachers/appear-student-class/${classItem.classId}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const students = data.data || [];
            // Store first 10 students for avatar display
            studentsDataObj[classItem.classId] = students.slice(0, 10);
          }
        } catch (error) {
          console.error(
            `Error fetching students for class ${classItem.classId}:`,
            error
          );
          studentsDataObj[classItem.classId] = [];
        }
      }

      setClassStudentsData(studentsDataObj);
    } catch (error) {
      console.error("Error in fetchAllClassStudents:", error);
    }
  };

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

  const fetchClassStudents = async (classId: number) => {
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
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudentsData(data.data || []);
        // Auto-select all students
        const allStudentIndices = (data.data || []).map(
          (_: any, index: number) => index
        );
        setSelectedStudentIds(allStudentIndices);
        console.log("Students data:", data.data);
      }
    } catch (error) {
      console.error("Error fetching class students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassSelection = (classItem: ClassData) => {
    setSelectedClass(classItem);
    setIsClassSelected(true);
    fetchClassStudents(classItem.classId);
  };

  const toggleStudentSelection = (userId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeSelectedStudent = (userId: number) => {
    setSelectedStudentIds((prev) => prev.filter((id) => id !== userId));
  };

  // New functions for select all/deselect all
  const selectAllStudents = () => {
    const allIndices = filteredStudents.map((_, index) => index);
    setSelectedStudentIds(allIndices);
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toISOString();
  };

  const addProgress = async () => {
    if (!selectedStudentIds.length || selectedTaskId === null) return;
    const authToken = localStorage.getItem("token");
    if (!authToken) return;
    try {
      const selectedTask = filteredTasks[selectedTaskId];
      if (!selectedTask) {
        console.error("Selected task not found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/teachers/add-pros`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            taskId:
              taskdata.findIndex(
                (task) =>
                  task.type === selectedTask.type &&
                  task.title === selectedTask.title
              ) + 1,
            studentIds: selectedStudentIds.map((id) => studentsData[id].id),
            comment: "Great job!",
            time: getCurrentTime(),
          }),
        }
      );

      if (response.ok) {
        console.log("Progress added successfully");
        setShowConfirmation(false);
        setShowCongrats(true);
      } else {
        const errorData = await response.json();
        if (
          errorData.message ===
            "Some students have already completed this task today" &&
          errorData.existingStudents
        ) {
          setExistingStudentIds(errorData.existingStudents);
          setShowDuplicateTask(true);
          setShowConfirmation(false);
        } else {
          console.error("Error adding progress:", errorData.message);
        }
      }
    } catch (error) {
      console.error("Error adding progress:", error);
    }
  };

  const handleContinueAfterDuplicate = () => {
    const filteredStudentIds = selectedStudentIds.filter(
      (id) => !existingStudentIds.includes(studentsData[id].id)
    );
    setSelectedStudentIds(filteredStudentIds);
    setShowDuplicateTask(false);

    if (filteredStudentIds.length > 0) {
      addProgress();
    } else {
      setShowConfirmation(false);
    }
  };

  const handleRemoveDuplicateStudent = (studentId: number) => {
    setExistingStudentIds((prev) => prev.filter((id) => id !== studentId));
    const studentIndex = studentsData.findIndex((s) => s.id === studentId);
    if (studentIndex !== -1) {
      removeSelectedStudent(studentIndex);
    }
  };

  const handleCongratsClose = () => {
    setShowCongrats(false);
    // Reset form
    setIsClassSelected(false);
    setIsStudentsSelected(false);
    setSelectedClass(null);
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedTaskId(null);
    setSelectedStudentIds([]);
    setStudentsData([]);
  };

  // Filter and Sort Functions
  const applyClassFilter = (classes: ClassData[]) => {
    return classes.filter((classItem) => {
      const classXp = classXpData[classItem.classId]?.totalXp || 0;
      const studentCount = classXpData[classItem.classId]?.studentCount || 0;

      switch (classFilter) {
        case "high_xp":
          return classXp > 1000;
        case "medium_xp":
          return classXp >= 500 && classXp <= 1000;
        case "low_xp":
          return classXp < 500;
        case "large_class":
          return studentCount > 20;
        case "small_class":
          return studentCount < 10;
        default:
          return true;
      }
    });
  };

  const sortClasses = (classes: ClassData[]) => {
    return [...classes].sort((a, b) => {
      const aXp = classXpData[a.classId]?.totalXp || 0;
      const bXp = classXpData[b.classId]?.totalXp || 0;
      const aStudentCount = classXpData[a.classId]?.studentCount || 0;
      const bStudentCount = classXpData[b.classId]?.studentCount || 0;

      switch (classSort) {
        case "name_desc":
          return b.className.localeCompare(a.className);
        case "xp_high":
          return bXp - aXp;
        case "xp_low":
          return aXp - bXp;
        case "student_count_high":
          return bStudentCount - aStudentCount;
        case "student_count_low":
          return aStudentCount - bStudentCount;
        default: // name_asc
          return a.className.localeCompare(b.className);
      }
    });
  };

  const applyStudentFilter = (students: StudentData[]) => {
    return students.filter((student) => {
      const level = calculateLevel(student.xp).level;
      const xp = student.xp;

      switch (studentFilter) {
        case "high_level":
          return level >= 10;
        case "medium_level":
          return level >= 5 && level < 10;
        case "low_level":
          return level < 5;
        case "high_xp":
          return xp > 500;
        case "medium_xp":
          return xp >= 200 && xp <= 500;
        case "low_xp":
          return xp < 200;
        default:
          return true;
      }
    });
  };

  const sortStudents = (students: StudentData[]) => {
    return [...students].sort((a, b) => {
      const aLevel = calculateLevel(a.xp).level;
      const bLevel = calculateLevel(b.xp).level;
      const aName = `${a.user.firstName} ${a.user.lastName}`;
      const bName = `${b.user.firstName} ${b.user.lastName}`;

      switch (studentSort) {
        case "name_desc":
          return bName.localeCompare(aName);
        case "xp_high":
          return b.xp - a.xp;
        case "xp_low":
          return a.xp - b.xp;
        case "level_high":
          return bLevel - aLevel;
        case "level_low":
          return aLevel - bLevel;
        default: // name_asc
          return aName.localeCompare(bName);
      }
    });
  };

  // Filter classes based on search query, filter, and sort
  const getFilteredAndSortedClasses = () => {
    let filtered = classesData.filter((classItem) =>
      classItem.className.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = applyClassFilter(filtered);
    return sortClasses(filtered);
  };

  // Filter and sort students, with selected students on top
  const getFilteredAndSortedStudents = () => {
    let filtered = studentsData.filter((student) =>
      `${student.user.firstName} ${student.user.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    filtered = applyStudentFilter(filtered);
    filtered = sortStudents(filtered);

    // Separate selected and unselected students
    const selectedStudents: StudentData[] = [];
    const unselectedStudents: StudentData[] = [];

    filtered.forEach((student, originalIndex) => {
      const studentIndex = studentsData.findIndex((s) => s.id === student.id);
      if (selectedStudentIds.includes(studentIndex)) {
        selectedStudents.push(student);
      } else {
        unselectedStudents.push(student);
      }
    });

    // Return selected students first, then unselected
    return [...selectedStudents, ...unselectedStudents];
  };

  const filteredClasses = getFilteredAndSortedClasses();
  const filteredStudents = getFilteredAndSortedStudents();

  // Get selected student data
  const selectedStudents = selectedStudentIds
    .map((id) => studentsData[id])
    .filter(Boolean) as StudentData[];

  const handleContinueClick = () => {
    if (isStudentsSelected) {
      addProgress();
    } else {
      setIsStudentsSelected(true);
    }
  };

  const getTaskTypeImage = (type: string) => {
    return sanabelImgs[type] || null;
  };

  const colors = [
    "text-blueprimary",
    "text-redprimary",
    "text-yellowprimary",
    "text-greenprimary",
  ];

  const renderResources = (items: any) =>
    [
      { icon: blueSanabel, value: items.snabelBlue },
      { icon: redSanabel, value: items.snabelRed },
      { icon: yellowSanabel, value: items.snabelYellow },
      { icon: xpIcon, value: items.xp },
    ].map((resource, index) => (
      <div key={index} className="flex flex-col items-center">
        <img
          src={resource.icon}
          alt="icon"
          className="w-auto h-4"
          loading="lazy"
        />
        <h1 className="text-sm text-black">{resource.value}</h1>
      </div>
    ));

  // Function to get the current step title
  const getCurrentStepTitle = () => {
    if (!isClassSelected) return t("الفصول");
    if (!isStudentsSelected) return t("الطلاب");
    if (selectedCategoryId === null) return t("اختر الفئة");
    if (selectedType === null) return t("اختر النوع");
    return t("اختر المهمة");
  };

  // Get current step number for progress indicator
  const getCurrentStep = () => {
    if (!isClassSelected) return 1;
    if (!isStudentsSelected) return 2;
    if (selectedCategoryId === null) return 3;
    if (selectedType === null) return 4;
    return 5;
  };

  const handleTaskRegister = () => {
    setShowConfirmation(true);
  };

  const getSelectedTask = () => {
    return selectedTaskId !== null ? filteredTasks[selectedTaskId] : null;
  };

  const handleFilterSortApply = (filter: string, sort: string) => {
    if (!isClassSelected) {
      setClassFilter(filter);
      setClassSort(sort);
    } else if (!isStudentsSelected) {
      setStudentFilter(filter);
      setStudentSort(sort);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-between gap-5 p-4"
      id="page-height"
    >
      {/* Header and Search */}
      <div className="flex-col w-full gap-3 flex-center">
        <div className="flex items-center justify-between w-full">
          <div className="w-16 h-16"></div>
          <h1 className="text-2xl font-bold text-black" dir="ltr">
            {getCurrentStepTitle()}
          </h1>
          <GoBackButton />
        </div>
        {(!isClassSelected || !isStudentsSelected) && (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
              <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
                <SearchIcon className="text-white" size={20} />
              </div>
              <input
                type="text"
                placeholder={t(
                  !isClassSelected ? "ابحث عن فصل" : "ابحث عن طالب"
                )}
                className="w-full py-3 text-black bg-transparent drop-shadow-sm text-end"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter/Sort Button */}
            <div
              className="w-12 h-12 bg-gray-200 cursor-pointer rounded-xl flex-center hover:bg-gray-300"
              onClick={() => setShowFilterSort(true)}
            >
              <FaFilter className="text-gray-600" size={16} />
            </div>
          </div>
        )}
      </div>

      {/* Selected Students Horizontal List - Show when students are selected */}
      {isStudentsSelected && (
        <div className="w-full ">
          {/* Selected Students Row */}
          <div className="flex flex-row w-full gap-3 p-2 overflow-x-auto">
            {selectedStudents.map((student) => (
              <div
                key={student.id}
                className="relative flex flex-col items-center"
              >
                <div
                  className="absolute z-10 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full cursor-pointer -top-1 -right-1"
                  onClick={() =>
                    removeSelectedStudent(
                      studentsData.findIndex((s) => s.id === student.id)
                    )
                  }
                >
                  <FaTimes className="text-xs text-white" />
                </div>
                <div className="overflow-hidden rounded-full w-14 h-14">
                  <GetAvatar userAvatarData={student.user.profileImg} />
                </div>
                <span className="mt-1 text-xs font-medium text-center text-black">
                  {`${student.user.firstName}`}
                </span>
              </div>
            ))}
          </div>

          {/* Step Indicator - Show only when in task selection mode */}
          {isStudentsSelected && (
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    getCurrentStep() >= 3
                      ? "bg-blueprimary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                ></div>
                <div
                  className={`flex-1 h-1 mx-1 ${
                    getCurrentStep() >= 4 ? "bg-blueprimary" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    getCurrentStep() >= 4
                      ? "bg-blueprimary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                ></div>
                <div
                  className={`flex-1 h-1 mx-1 ${
                    getCurrentStep() >= 5 ? "bg-blueprimary" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    getCurrentStep() >= 5
                      ? "bg-blueprimary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {!isClassSelected ? (
        // Class List View
        <div className="flex flex-col justify-start w-full h-full gap-2 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center w-full py-10">
              <p className="text-gray-500">{t("جاري التحميل...")}</p>
            </div>
          ) : filteredClasses.length > 0 ? (
            filteredClasses.map((classItem) => (
              <div
                key={classItem.classId}
                className="flex justify-between w-full p-4 border-2 cursor-pointer rounded-xl hover:bg-gray-50"
                onClick={() => handleClassSelection(classItem)}
              >
                <div className="flex items-center gap-2">
                  <MedalAndLevel
                    level={
                      calculateLevel(
                        classXpData[classItem.classId]?.totalXp || 0
                      ).level
                    }
                    color={"text-black text-center"}
                    dir={""}
                    size={""}
                  />
                </div>
                <div className="flex flex-col w-full text-end">
                  <h1 className="text-black capitalize text-md">
                    {classItem.className}
                  </h1>
                  <h1 className="text-sm text-gray-500 capitalize">
                    {classItem.organizationName}
                  </h1>
                  <div
                    className="px-3 py-1 font-medium text-gray-800 rounded-lg"
                    dir="rtl"
                  >
                    {classXpData[classItem.classId]?.studentCount || 0}{" "}
                    {t("طلاب")}
                  </div>
                  {/* Add student avatars display */}
                  <div className="flex justify-end w-full mt-2">
                    {renderClassAvatars(classItem.classId)}
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
      ) : !isStudentsSelected ? (
        // Student List View
        <div className="flex flex-col justify-start w-full h-full gap-2 overflow-y-auto">
          <div className="gap-2 p-2 mb-2 text-center flex-center bg-blueprimary rounded-xl">
            <h2 className="text-lg font-bold text-white capitalize">
              {selectedClass?.className}
            </h2>
            <p className="text-sm text-white opacity-90" dir="rtl">
              {classXpData[selectedClass?.classId || 0]?.studentCount || 0}{" "}
              {t("طلاب")}
            </p>
          </div>

          {/* Select All/Deselect All Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg bg-blueprimary"
              onClick={selectAllStudents}
            >
              {t("تحديد الكل")}
            </button>
            <button
              className="flex-1 px-4 py-2 text-sm font-medium text-black bg-gray-300 rounded-lg"
              onClick={deselectAllStudents}
            >
              {t("إلغاء تحديد الكل")}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center w-full py-10">
              <p className="text-gray-500">{t("جاري التحميل...")}</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const studentIndex = studentsData.findIndex(
                (s) => s.id === student.id
              );
              const isSelected = selectedStudentIds.includes(studentIndex);

              return (
                <div
                  className={`w-full flex p-2 justify-between items-center border-2 rounded-xl ${
                    isSelected ? "border-blueprimary bg-blue-50" : ""
                  }`}
                  key={student.id}
                >
                  <div
                    className={`w-10 h-10 flex-center rounded-xl ${
                      isSelected
                        ? "bg-blueprimary border-0"
                        : "bg-transparent border-2"
                    }`}
                    onClick={() => toggleStudentSelection(studentIndex)}
                  >
                    <FaCheck
                      className={isSelected ? "text-white" : "text-gray-400"}
                    />
                  </div>
                  <div className="gap-3 flex-center">
                    <div className="gap-0 flex-center">
                      <MedalAndLevel
                        level={calculateLevel(student.xp).level}
                        color="text-blueprimary text-sm"
                        dir=""
                        size={"w-8"}
                      />
                      <h1 className="mx-2 text-black text-nowrap">
                        {`${student.user.firstName} ${student.user.lastName}`}
                      </h1>
                    </div>
                    <div className="w-12 h-12">
                      <GetAvatar userAvatarData={student.user.profileImg} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center w-full py-10">
              <p className="text-gray-500">{t("لا يوجد طلاب")}</p>
            </div>
          )}
        </div>
      ) : (
        // Task Selection Views
        <div className="w-full h-full overflow-y-auto">
          {selectedCategoryId === null ? (
            // Category Selection View
            <div className="w-full">
              <div className="grid grid-cols-2 gap-3">
                {taskCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex flex-col items-center p-3 border-2 cursor-pointer rounded-xl"
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <img
                      src={sanabelTypeImg[index]}
                      alt={category.title}
                      className="object-contain w-16 h-16"
                    />
                    <h3
                      className={`${colors[index]} font-bold text-center mt-2`}
                    >
                      {t(category.title)}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedType === null ? (
            // Type Selection View
            <div className="w-full h-full overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {availableTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3 border-2 cursor-pointer rounded-xl"
                    onClick={() => setSelectedType(type)}
                  >
                    <img
                      src={getTaskTypeImage(type)}
                      alt={type}
                      className="object-contain w-16 h-16"
                    />
                    <h3 className="mt-2 font-bold text-center text-black">
                      {t(type)}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Task Selection View
            <div className="w-full h-full overflow-y-auto">
              <div className="flex flex-col gap-3">
                {filteredTasks.map((task, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-3 cursor-pointer ${
                      selectedTaskId === index ? "border-blueprimary" : ""
                    }`}
                    onClick={() => setSelectedTaskId(index)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex w-20 gap-2">
                        {renderResources(task)}
                      </div>
                      <h3 className="text-right text-black text-md">
                        {t(task.title)}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isClassSelected &&
        !isStudentsSelected &&
        selectedStudentIds.length > 0 && (
          <PrimaryButton
            style=""
            text={t("متابعة")}
            arrow="none"
            onClick={handleContinueClick}
          />
        )}

      {isStudentsSelected && (
        <div className="flex w-full gap-3">
          <PrimaryButton
            style="bg-gray-300 text-black flex-1"
            text={t("رجوع")}
            arrow="none"
            onClick={() => {
              if (selectedTaskId !== null) {
                setSelectedTaskId(null);
              } else if (selectedType !== null) {
                setSelectedType(null);
              } else if (selectedCategoryId !== null) {
                setSelectedCategoryId(null);
              } else {
                setIsStudentsSelected(false);
              }
            }}
          />
          {selectedTaskId !== null && (
            <PrimaryButton
              style="flex-1"
              text={t("تسجيل")}
              arrow="none"
              onClick={handleTaskRegister}
            />
          )}
        </div>
      )}

      {/* Filter/Sort Popup */}
      <FilterSortDropdown
        isOpen={showFilterSort}
        onClose={() => setShowFilterSort(false)}
        onApply={handleFilterSortApply}
        type={!isClassSelected ? "class" : "student"}
        currentFilter={!isClassSelected ? classFilter : studentFilter}
        currentSort={!isClassSelected ? classSort : studentSort}
      />

      {/* Duplicate Task Popup */}
      <DuplicateTaskPopup
        isOpen={showDuplicateTask}
        onClose={() => setShowDuplicateTask(false)}
        onContinue={handleContinueAfterDuplicate}
        existingStudentIds={existingStudentIds}
        allStudents={studentsData}
        onDeselectStudent={handleRemoveDuplicateStudent}
      />

      {/* Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={addProgress}
        selectedTask={getSelectedTask()}
        selectedStudents={selectedStudents}
        onRemoveStudent={(studentId: any) => {
          const studentIndex = studentsData.findIndex(
            (s) => s.id === studentId
          );
          if (studentIndex !== -1) {
            removeSelectedStudent(studentIndex);
          }
        }}
      />

      {/* Congratulations Popup */}
      <CongratsPopup
        isOpen={showCongrats}
        onClose={handleCongratsClose}
        selectedTask={getSelectedTask()}
        selectedStudents={selectedStudents}
      />

      {/* Navigation */}
      <TeacherNavbar />
    </div>
  );
};

export default ClassList;
