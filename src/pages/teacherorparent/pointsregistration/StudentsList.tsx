import { API_BASE_URL } from "../../../config/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import SearchIcon from "../../../icons/SearchIcon";
import GoBackButton from "../../../components/GoBackButton";
import PrimaryButton from "../../../components/PrimaryButton";
import GetAvatar from "../../student/tutorial/GetAvatar";
import { FaCheck, FaTimes } from "react-icons/fa";
import { taskdata } from "../../../data/SanabelBackData";
import { taskCategories } from "../../../data/SanabelTypeBackData";
import { sanabelImgs } from "../../../data/SanabelDictionary";
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
import StudentNavbar from "../../../components/navbar/StudentNavbar";
import ParentNavbar from "../../../components/navbar/ParentNavbar";

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

// Duplicate Task Popup Component
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

  // Find student objects for existingStudentIds
  const existingStudents = existingStudentIds
    .map((id) => allStudents.find((student) => student.id === id))
    .filter(Boolean) as StudentData[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="w-11/12 max-w-md p-5 overflow-y-auto bg-white rounded-xl max-h-90vh">
        <h2 className="mb-4 text-xl font-bold text-center text-black">
          {t("مهمة مكررة!")}
        </h2>

        <p className="mb-4 text-center text-gray-600">
          {t("بعض الطلاب أكملوا هذه المهمة بالفعل اليوم")}
        </p>

        {/* Existing Students */}
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

        {/* Action Buttons */}
        <div className="flex w-full gap-3">
          <PrimaryButton
            style="stroke"
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

// Confirmation Popup Component
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

  // Get the image for the selected task type
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

        {/* Task Information */}
        <div className="flex-col justify-center w-full p-3 mb-5 border-2 rounded-xl flex-center">
          <h3 className="mb-2 text-lg font-bold text-center text-black">
            {t(selectedTask.title)}
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

        {/* Selected Students */}
        <div className="mb-5 ">
          <h3 className="mb-2 font-medium text-right text-black ">
            {t("الطلاب المختارين")}
          </h3>
          <div className="flex justify-center gap-3 py-2 overflow-x-auto ">
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

        {/* Action Buttons */}
        <div className="flex w-full gap-3">
          <PrimaryButton
            style="stroke"
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

// Congratulations Popup Component
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

  // Make the popup show even if task is null (for debugging purposes)
  if (!isOpen) return null;

  // Get the image for the selected task type
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
        {/* Added Sanabel Type Image */}
        <div className="flex-col justify-center w-full mb-3 flex-center">
          <h2 className="mb-2 text-xl font-bold text-black">
            {t("تم تسجيل المهمة بنجاح")}
          </h2>
          <p className="mb-2 text-gray-600">
            <span className="font-bold">
              {t(selectedTask?.title ?? "المحددة")}
            </span>
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
        {/* Task Resources */}
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

const StudentList = () => {
  const { t } = useTranslation();
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [isStudentsSelected, setIsStudentsSelected] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showDuplicateTask, setShowDuplicateTask] = useState(false);
  const [existingStudentIds, setExistingStudentIds] = useState<number[]>([]);

  const role = localStorage.getItem("role");
  const sanabelTypeImg = [
    sanabelType1Img,
    sanabelType2Img,
    sanabelType3Img,
    sanabelType4Img,
  ];

  // Fetch students data on component mount
  useEffect(() => {
    fetchStudentsData();
  }, []);

  // Update available types when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const typesForCategory = [
        ...new Set(
          taskdata
            .filter((task) => task.categoryId === selectedCategoryId)
            .map((task) => task.type),
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
          task.categoryId === selectedCategoryId && task.type === selectedType,
      );
      setFilteredTasks(tasksForType);
      setSelectedTaskId(null);
    }
  }, [selectedType, selectedCategoryId]);

  const fetchStudentsData = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return;
    try {
      // Using fetch instead of axios
      const response = await fetch(
        role == "Teacher"
          ? `${API_BASE_URL}/teachers/appear-student`
          : `${API_BASE_URL}/parents/appear-student-by-parent`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setStudentsData(data.data);
        console.log("Students data,", data.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const toggleStudentSelection = (userId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
    console.log(userId);
  };

  const removeSelectedStudent = (userId: number) => {
    setSelectedStudentIds((prev) => prev.filter((id) => id !== userId));
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const addProgress = async () => {
    if (!selectedStudentIds.length || selectedTaskId === null) return;
    const authToken = localStorage.getItem("token");
    console.log(selectedStudentIds);
    if (!authToken) return;
    try {
      // Find selected task from filteredTasks array
      const selectedTask = filteredTasks[selectedTaskId];
      if (!selectedTask) {
        console.error("Selected task not found");
        return;
      }
      // Using fetch instead of axios
      const response = await fetch(
        role == "Teacher"
          ? `${API_BASE_URL}/teachers/add-pros`
          : `${API_BASE_URL}/parents/add-pros`,
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
                  task.title === selectedTask.title,
              ) + 1,
            studentIds: selectedStudentIds.map((id) => id),
            comment: "Great job!",
            time: getCurrentTime(),
          }),
        },
      );

      if (response.ok) {
        console.log("Progress added successfully");
        console.log(selectedStudentIds);
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

  // Handles the continuation after showing duplicate task warning
  const handleContinueAfterDuplicate = () => {
    // Remove existing student IDs from the selected IDs
    const filteredStudentIds = selectedStudentIds.filter(
      (id) => !existingStudentIds.includes(id + 1),
    );
    setSelectedStudentIds(filteredStudentIds);
    setShowDuplicateTask(false);

    // If there are still students to register, continue with the process
    if (filteredStudentIds.length > 0) {
      addProgress();
    } else {
      // If no students left, just close the popup
      setShowConfirmation(false);
    }
  };

  // Handle removing a student from the duplicate task list
  const handleRemoveDuplicateStudent = (studentId: number) => {
    // Remove from existingStudentIds
    setExistingStudentIds((prev) => prev.filter((id) => id !== studentId));

    // Also remove from selectedStudentIds
    const studentIndex = studentsData.findIndex((s) => s.id === studentId);
    if (studentIndex !== -1) {
      removeSelectedStudent(studentIndex);
    }
  };

  // Reset form after congratulations
  const handleCongratsClose = () => {
    setShowCongrats(false);
    // Reset form
    setIsStudentsSelected(false);
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedTaskId(null);
    setSelectedStudentIds([]);
  };

  // Filter students based on search query
  const filteredStudents = studentsData.filter((student) =>
    `${student.user.firstName} ${student.user.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  // Get selected student data
  const selectedStudents = selectedStudentIds
    .map((id) => studentsData.find((student, index) => index === id - 1))
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
    if (!isStudentsSelected) return t("الطلاب");
    if (selectedCategoryId === null) return t("اختر الفئة");
    if (selectedType === null) return t("اختر النوع");
    return t("اختر المهمة");
  };

  // Get current step number for progress indicator
  const getCurrentStep = () => {
    if (!isStudentsSelected) return 1;
    if (selectedCategoryId === null) return 2;
    if (selectedType === null) return 3;
    return 4;
  };

  const handleTaskRegister = () => {
    setShowConfirmation(true);
  };

  const getSelectedTask = () => {
    return selectedTaskId !== null ? filteredTasks[selectedTaskId] : null;
  };

  return (
    <div
      className="flex flex-col items-center justify-between gap-5 p-4"
      id="page-height"
    >
      {/* Header and Search */}
      <div className="flex-col w-full gap-3 flex-center">
        <div className="flex flex-row-reverse items-center justify-between w-full">
          <div className="w-16 h-16"></div>
          <h1 className="text-2xl font-bold text-black">
            {getCurrentStepTitle()}
          </h1>
          <GoBackButton />
        </div>
        {!isStudentsSelected && (
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
        )}
      </div>

      {/* Selected Students Horizontal List - Always show when students are selected */}
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
                      studentsData.findIndex((s) => s.id === student.id),
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
                    getCurrentStep() >= 2
                      ? "bg-blueprimary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                ></div>
                <div
                  className={`flex-1 h-1 mx-1 ${
                    getCurrentStep() >= 3 ? "bg-blueprimary" : "bg-gray-200"
                  }`}
                ></div>
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {!isStudentsSelected ? (
        // Student List View
        <div className="flex flex-col justify-start w-full h-full gap-2 overflow-y-auto">
          {filteredStudents.map((student, index) => (
            <div
              className="flex flex-row-reverse items-center justify-between w-full p-3 border-2 rounded-xl"
              key={student.id}
            >
              <div
                className={`w-10 h-10 flex-center rounded-xl ${
                  selectedStudentIds.includes(student.id)
                    ? "bg-blueprimary border-0"
                    : "bg-transparent border-2"
                }`}
                onClick={() => toggleStudentSelection(student.id)}
              >
                <FaCheck />
              </div>
              <div className="flex-row-reverse gap-3 flex-center">
                <div className="flex flex-col gap-0">
                  <h1 className="text-black">
                    {`${student.user.firstName} ${student.user.lastName}`}
                  </h1>

                  <div className="flex justify-end text-blueprimary">
                    <h1 className="text-[#B3B3B3] capitalize">
                      {" "}
                      {student.Class?.classname}
                    </h1>

                    {student.Class && <h1>-</h1>}
                    <h1 className="text-[#B3B3B3] capitalize">
                      {" "}
                      {student.Class?.category}
                    </h1>
                  </div>
                </div>
                <div className="w-12 h-12">
                  <GetAvatar userAvatarData={student.user.profileImg} />
                </div>
              </div>
            </div>
          ))}
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
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex w-20 gap-2">
                        {renderResources(task)}
                      </div>
                      <h3 className="text-black text-md">{t(task.title)}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isStudentsSelected && selectedStudentIds.length > 0 && (
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
            style="stroke"
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
            (s) => s.id === studentId,
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
      {role == "Student" ? (
        <StudentNavbar />
      ) : role == "Teacher" ? (
        <TeacherNavbar />
      ) : (
        <ParentNavbar />
      )}
    </div>
  );
};

export default StudentList;
