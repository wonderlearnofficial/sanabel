import { API_BASE_URL } from "../../../config/api";
import { useAutoStartGuide } from "../../../guides/useAutoStartGuide";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import SearchIcon from "../../../icons/SearchIcon";
import GoBackButton from "../../../components/GoBackButton";
import PrimaryButton from "../../../components/PrimaryButton";
import GetAvatar from "../../student/tutorial/GetAvatar";
import { ToastContainer, toast } from "react-toastify";
import { FaCheck, FaTimes, FaClipboardList } from "react-icons/fa";
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
  class?: any;
}

interface Task {
  id?: number;
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
  action,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTask: Task | null;
  selectedStudents: StudentData[];
  onRemoveStudent: (studentId: number) => void;
  action: "assign" | "complete";
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
        <p className={`mb-2 text-sm font-bold text-center ${action === "assign" ? "text-blueprimary" : "text-green-700"}`}>
          {t(action === "assign" ? "Assign Mission" : "Register Completed Mission")}
        </p>
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
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">
              {selectedStudents.length}
            </span>
            <h3 className="font-medium text-end text-black">
              {t("الطلاب المختارين")}
            </h3>
          </div>

          {selectedStudents.length === 0 ? (
            <p className="py-3 text-sm text-center text-gray-500 border border-dashed rounded-lg">
              {t("لم يتم اختيار أي طالب")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 overflow-y-auto max-h-56">
              {selectedStudents.map((student: any) => (
                <li
                  key={student.id}
                  className="flex items-center gap-3 p-2 border rounded-lg border-slate-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 overflow-hidden rounded-full">
                    <GetAvatar userAvatarData={student.user.profileImg} />
                  </div>
                  <div className="flex-1 min-w-0 text-end">
                    <p className="text-sm font-semibold text-black truncate">
                      {`${student.user.firstName} ${student.user.lastName || ""}`.trim()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[
                        student.Class?.grade || student.class?.grade || student.grade,
                        student.Class?.classname || student.class?.classname,
                        student.organization?.name,
                      ]
                        .filter(Boolean)
                        .map((part: string) => t(part))
                        .join(" · ") || t("لا يوجد فصل")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t("إزالة")}
                    className="flex items-center justify-center flex-shrink-0 w-11 h-11 text-white bg-red-500 rounded-full"
                    onClick={() => onRemoveStudent(student.id)}
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            disabled={selectedStudents.length === 0}
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

const SelectedStudentsSummary = ({
  students,
  onRemove,
  onChangeStudents,
}: {
  students: StudentData[];
  onRemove: (studentId: number) => void;
  onChangeStudents: () => void;
}) => {
  const { t } = useTranslation();
  // Keep the summary to one compact row even when a whole class is selected.
  const VISIBLE = 3;
  const shown = students.slice(0, VISIBLE);
  const overflow = students.length - shown.length;

  return (
    <section className="flex items-center w-full gap-2 py-2 border-b border-gray-100">
      <div className="flex items-center min-w-0 gap-2 me-auto">
        <h2 className="text-sm font-bold text-black whitespace-nowrap">
          {t("الطلاب المختارون")}
        </h2>
        <span className="flex-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white rounded-full bg-blueprimary">
          {students.length}
        </span>
      </div>

      <ul className="flex items-center -space-x-1 rtl:space-x-reverse">
        {shown.map((student: any) => (
          <li key={student.id} className="relative shrink-0">
            <button
              type="button"
              aria-label={`${t("إزالة")} ${student.user.firstName}`}
              className="absolute z-10 flex-center w-4 h-4 text-white bg-red-500 border border-white rounded-full -top-1 -end-1"
              onClick={() => onRemove(student.id)}
            >
              <FaTimes className="text-[8px]" aria-hidden="true" />
            </button>
            <div className="w-9 h-9 overflow-hidden bg-gray-50 border-2 border-white rounded-full">
              <GetAvatar userAvatarData={student.user.profileImg} />
            </div>
            <span className="sr-only">
              {student.user.firstName}
            </span>
          </li>
        ))}
        {overflow > 0 && (
          <li className="shrink-0">
            <span className="flex-center w-9 h-9 text-[11px] font-bold text-gray-600 bg-gray-100 border-2 border-white rounded-full">
              {`+${overflow}`}
            </span>
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={onChangeStudents}
        className="px-2 py-1 text-xs font-semibold whitespace-nowrap text-blueprimary"
      >
        {t("تغيير الطلاب")}
      </button>
    </section>
  );
};

const CATEGORY_ACCENTS = [
  { title: "text-blueprimary", ring: "ring-blueprimary", tint: "bg-blue-50", art: "bg-blue-50" },
  { title: "text-redprimary", ring: "ring-redprimary", tint: "bg-red-50", art: "bg-red-50" },
  { title: "text-yellowprimary", ring: "ring-yellowprimary", tint: "bg-amber-50", art: "bg-amber-50" },
  { title: "text-greenprimary", ring: "ring-greenprimary", tint: "bg-emerald-50", art: "bg-emerald-50" },
];

const CategoryCard = ({
  title,
  image,
  accentIndex,
  selected,
  onSelect,
}: {
  title: string;
  image: string;
  accentIndex: number;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { t } = useTranslation();
  const accent = CATEGORY_ACCENTS[accentIndex % CATEGORY_ACCENTS.length];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex flex-col items-center w-full h-full gap-2 p-3 transition-all rounded-xl border active:scale-[0.98] ${
        selected
          ? `${accent.tint} border-transparent ring-2 ${accent.ring}`
          : "bg-white border-gray-200"
      }`}
    >
      {/* Selection is marked by a tick as well as colour, so it does not rely
          on colour perception alone. */}
      {selected && (
        <span className={`absolute flex-center w-5 h-5 text-white rounded-full top-2 end-2 ${accent.title.replace("text-", "bg-")}`}>
          <FaCheck size={11} aria-hidden="true" />
        </span>
      )}
      <span className={`flex-center w-14 h-14 rounded-xl ${selected ? "bg-white/70" : accent.art}`}>
        <img src={image} alt="" aria-hidden="true" className="object-contain w-12 h-12" loading="lazy" />
      </span>
      <h3 className={`${accent.title} text-sm font-bold text-center leading-5`}>
        {t(title)}
      </h3>
    </button>
  );
};

const ActionModeSelector = ({
  value,
  onChange,
}: {
  value: "assign" | "complete";
  onChange: (mode: "assign" | "complete") => void;
}) => {
  const { t } = useTranslation();
  const modes = [
    {
      key: "assign" as const,
      label: "Assign Mission",
      icon: <FaClipboardList aria-hidden="true" />,
    },
    {
      key: "complete" as const,
      label: "Register Completed Mission",
      icon: <FaCheck aria-hidden="true" />,
    },
  ];

  return (
    <fieldset className="w-full">
      <legend className="mb-2 text-sm font-bold text-black">
        {t("نوع الإجراء")}
      </legend>
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
        {modes.map((mode) => {
          const selected = value === mode.key;
          return (
            // Both modes share one visual weight. Direct completion grants
            // rewards, so it must not look like the recommended default.
            <button
              key={mode.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(mode.key)}
              className={`flex items-center justify-center w-full gap-2 px-2 py-2.5 text-center transition-all rounded-lg active:scale-[0.99] ${
                selected
                  ? "text-blueprimary bg-white shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <span className="flex-center text-sm shrink-0">
                {mode.icon}
              </span>
              <span className="text-xs font-bold leading-4">
                {t(mode.label)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
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
  // Holds the card the user has tapped but not yet confirmed. `selectedCategoryId`
  // itself drives the step, so writing to it on tap would leave the step before
  // any selected state could be seen. The value committed on Continue is the
  // same category id the old tap-to-advance flow sent.
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showDuplicateTask, setShowDuplicateTask] = useState(false);
  const [existingStudentIds, setExistingStudentIds] = useState<number[]>([]);
  const [missionAction, setMissionAction] = useState<"assign" | "complete">("complete");

  const role = localStorage.getItem("role");
  useAutoStartGuide("teacher-register", true);
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
    if (!selectedType || !selectedCategoryId) return;
    const authToken = localStorage.getItem("token");
    const rolePath = role == "Teacher" ? "teachers" : "parents";
    void fetch(`${API_BASE_URL}/${rolePath}/appear-Taskes-Type-Category/${selectedCategoryId}/${encodeURIComponent(selectedType)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((response) => response.json())
      .then((body) => setFilteredTasks(Array.isArray(body.data) ? body.data : []))
      .catch((error) => { console.error("Error loading mission catalog", error); setFilteredTasks([]); });
    setSelectedTaskId(null);
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

  // Adds every student currently visible under the search, without dropping
  // anyone selected under a previous search term.
  const selectAllVisible = () => {
    setSelectedStudentIds((prev) =>
      Array.from(new Set([...prev, ...filteredStudents.map((student) => student.id)])),
    );
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
      // `taskdata` (a static local copy of the catalog, not the database)
      // carries no real task id, so the id is inferred from its position in
      // that same static array. This only matches the database's real task
      // id if both lists are kept in the exact same order with no gaps — a
      // silent-drift risk (see the code audit notes), guarded here so a
      // mismatch is at least caught rather than submitting a wrong/garbage id.
      const authoritativeTaskId = Number(selectedTask.id);
      if (!Number.isSafeInteger(authoritativeTaskId) || authoritativeTaskId <= 0) {
        toast.error(t("تعذر تحديد هذه المهمة. حاول اختيارها من جديد."));
        return;
      }
      // Using fetch instead of axios
      const rolePath = role == "Teacher" ? "teachers" : "parents";
      const endpoint = missionAction === "assign" ? "assign-mission" : "add-pros";
      const response = await fetch(
        `${API_BASE_URL}/${rolePath}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            taskId: authoritativeTaskId,
            studentIds: selectedStudentIds.map((id) => id),
            comment: "Great job!",
            time: getCurrentTime(),
          }),
        },
      );

      const responseData = await response.json().catch(() => ({}));
      if (response.ok) {
        setShowConfirmation(false);
        if (missionAction === "assign") {
          const created = responseData.summary?.created || 0;
          const existing = responseData.summary?.existing || 0;
          const completed = responseData.summary?.already_completed || 0;
          // Lead with the outcome that matters, and mention the skipped
          // students only when there actually were some.
          toast.success(
            [
              t("mission.assign.created", { count: created }),
              existing ? t("mission.assign.existing", { count: existing }) : null,
              completed ? t("mission.assign.completedToday", { count: completed }) : null,
            ]
              .filter(Boolean)
              .join(" · "),
          );
          handleCongratsClose();
        } else {
          const completed = responseData.summary?.completed || 0;
          const already = responseData.summary?.already_completed || 0;
          const failed = (responseData.summary?.failed || 0) + (responseData.summary?.unauthorized || 0) + (responseData.summary?.not_found || 0);
          if (already || failed) {
            toast.warning(
              [
                t("mission.complete.completed", { count: completed }),
                already ? t("mission.complete.already", { count: already }) : null,
                failed ? t("mission.complete.failed", { count: failed }) : null,
              ]
                .filter(Boolean)
                .join(" · "),
            );
          }
          setShowCongrats(true);
        }
      } else {
        const errorData = responseData;
        if (
          errorData.message ===
            "Some students have already completed this task today" &&
          errorData.existingStudents
        ) {
          setExistingStudentIds(errorData.existingStudents);
          setShowDuplicateTask(true);
          setShowConfirmation(false);
        } else {
          // This previously failed completely silently (console.error only)
          // — the teacher/parent had no way to know the tap did nothing.
          console.error("Error adding progress:", errorData.message);
          toast.error(
            errorData.message ||
              t("حدث خطأ أثناء تسجيل المهمة. حاول مرة أخرى."),
          );
        }
      }
    } catch (error) {
      console.error("Error adding progress:", error);
      toast.error(t("تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى."));
    }
  };

  // Handles the continuation after showing duplicate task warning
  const handleContinueAfterDuplicate = () => {
    // Remove existing student IDs from the selected IDs
    const filteredStudentIds = selectedStudentIds.filter(
      (id) => !existingStudentIds.includes(id),
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

    // Also remove from selectedStudentIds, which holds real student ids.
    removeSelectedStudent(studentId);
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

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedStudentIds.includes(student.id));

  // Get selected student data. Match on the student's real id: these are
  // database ids, not positions, so a positional lookup silently resolves to
  // nothing and the confirmation list renders empty.
  const selectedStudents = selectedStudentIds
    .map((id) => studentsData.find((student) => student.id === id))
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

  const handleTaskRegister = () => {
    setShowConfirmation(true);
  };

  // Single back path for the whole wizard, so the header button and the old
  // full-width "رجوع" button no longer offer two competing ways back.
  const handleStepBack = () => {
    if (!isStudentsSelected) {
      window.history.back();
      return;
    }
    if (selectedTaskId !== null) {
      setSelectedTaskId(null);
    } else if (selectedType !== null) {
      setSelectedType(null);
    } else if (selectedCategoryId !== null) {
      setSelectedCategoryId(null);
      setPendingCategoryId(null);
    } else {
      setIsStudentsSelected(false);
    }
  };

  const getSelectedTask = () => {
    return selectedTaskId !== null ? filteredTasks[selectedTaskId] : null;
  };

  return (
    // The page itself owns scrolling. Keeping every section in normal flow
    // prevents the detached header/progress strip and nested mobile scrollbars.
    <div
      className="flex flex-col items-center gap-3 px-4 pt-3 pb-4 overflow-x-hidden overflow-y-auto overscroll-contain"
      id="page-height"
    >
      <div className="flex-col w-full gap-3 flex-center">
        <div className="flex items-center w-full gap-3">
          <GoBackButton onClick={handleStepBack} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-black text-start">
              {getCurrentStepTitle()}
            </h1>
          </div>
        </div>
        {!isStudentsSelected && (
          <>
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
              {searchQuery && (
                <button
                  type="button"
                  aria-label={t("مسح البحث")}
                  className="px-2 text-gray-400"
                  onClick={() => setSearchQuery("")}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="flex flex-row-reverse items-center justify-between w-full">
              <span className="text-sm text-gray-500">
                {t("students.selectedOfTotal", {
                  selected: selectedStudentIds.length,
                  total: filteredStudents.length,
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  disabled={allVisibleSelected || filteredStudents.length === 0}
                  className="px-3 py-1 text-xs font-semibold rounded-full text-blueprimary bg-blue-50 disabled:opacity-40"
                >
                  {t("تحديد الكل")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  disabled={selectedStudentIds.length === 0}
                  className="px-3 py-1 text-xs font-semibold text-gray-600 rounded-full bg-gray-100 disabled:opacity-40"
                >
                  {t("مسح الكل")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isStudentsSelected && (
        <SelectedStudentsSummary
          students={selectedStudents}
          onRemove={removeSelectedStudent}
          onChangeStudents={() => {
            setPendingCategoryId(null);
            setIsStudentsSelected(false);
          }}
        />
      )}

      {/* Main Content Area */}
      {!isStudentsSelected ? (
        // Student List View
        <div className="flex flex-col justify-start w-full gap-2">
          {filteredStudents.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <p>{t("لا يوجد طالب بهذا الاسم")}</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 mt-3 text-sm border rounded-lg text-blueprimary border-blueprimary"
                >
                  {t("مسح البحث")}
                </button>
              )}
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              const grade = student.Class?.grade || student.class?.grade;
              const className = student.Class?.classname || student.class?.classname;
              return (
                // The whole row toggles: a 10px checkbox was the only hit
                // target before, which is hard to tap and easy to miss.
                <button
                  type="button"
                  key={student.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleStudentSelection(student.id)}
                  className={`flex flex-row-reverse items-center justify-between w-full p-3 text-end transition-colors border-2 rounded-xl ${
                    isSelected
                      ? "border-blueprimary bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Empty when unselected. Previously the tick was always
                      drawn, so every row read as already selected. */}
                  <span
                    className={`w-7 h-7 flex-center rounded-lg flex-shrink-0 ${
                      isSelected
                        ? "bg-blueprimary border-0 text-white"
                        : "bg-white border-2 border-gray-300 text-transparent"
                    }`}
                  >
                    {isSelected && <FaCheck size={14} />}
                  </span>

                  <div className="flex flex-row-reverse items-center min-w-0 gap-3">
                    <div className="flex flex-col min-w-0">
                      <h1 className="font-semibold text-black truncate">
                        {`${student.user.firstName} ${student.user.lastName || ""}`.trim()}
                      </h1>
                      <p className="text-xs text-[#B3B3B3] capitalize truncate">
                        {[grade ? t(grade) : null, className]
                          .filter(Boolean)
                          .join(" · ") || t("لا يوجد فصل")}
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-12 h-12">
                      <GetAvatar userAvatarData={student.user.profileImg} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        // Task Selection Views
        <div className="w-full pb-1">
          {selectedCategoryId === null ? (
            // Category Selection View
            <div className="flex flex-col w-full gap-3">
              <div
                role="radiogroup"
                aria-label={t("اختر فئة المهمة")}
                className="grid grid-cols-2 gap-2"
              >
                {taskCategories.map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    title={category.title}
                    image={sanabelTypeImg[index]}
                    accentIndex={index}
                    selected={pendingCategoryId === category.id}
                    onSelect={() => setPendingCategoryId(category.id)}
                  />
                ))}
              </div>

              <ActionModeSelector value={missionAction} onChange={setMissionAction} />
            </div>
          ) : selectedType === null ? (
            // Type Selection View
            <div className="w-full">
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
            <div className="w-full">
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

      <div className="w-full bg-white">
        {!isStudentsSelected && selectedStudentIds.length > 0 && (
          <div className="w-full pt-3 border-t border-gray-100">
            <PrimaryButton
              style=""
              text={`${t("متابعة")} (${selectedStudentIds.length})`}
              arrow="none"
              onClick={handleContinueClick}
            />
          </div>
        )}

        {/* Category step: one primary action, disabled until a category is
            chosen. Its label states what happens next for the chosen mode. */}
        {isStudentsSelected && selectedCategoryId === null && (
          <div className="w-full pt-3 border-t border-gray-100">
            <PrimaryButton
              style=""
              text={t(
                missionAction === "assign"
                  ? "متابعة لاختيار المهمة"
                  : "متابعة لتسجيل المهمة",
              )}
              arrow="none"
              disabled={pendingCategoryId === null}
              onClick={() => {
                if (pendingCategoryId === null) return;
                setSelectedCategoryId(pendingCategoryId);
              }}
            />
          </div>
        )}

        {/* Later steps keep their own register action; going back is the
            header button, so there is no second full-width back control. */}
        {isStudentsSelected && selectedCategoryId !== null && selectedTaskId !== null && (
          <div className="w-full pt-3 border-t border-gray-100">
            <PrimaryButton
              style=""
              text={t("تسجيل")}
              arrow="none"
              disabled={showConfirmation}
              onClick={handleTaskRegister}
            />
          </div>
        )}
      </div>

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
        onRemoveStudent={(studentId: number) => removeSelectedStudent(studentId)}
        action={missionAction}
      />

      {/* Congratulations Popup */}
      <CongratsPopup
        isOpen={showCongrats}
        onClose={handleCongratsClose}
        selectedTask={getSelectedTask()}
        selectedStudents={selectedStudents}
      />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
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
