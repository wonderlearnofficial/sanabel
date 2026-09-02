import { API_BASE_URL } from "../../config/api";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { AudioManager } from "../../utils/AudioManager";

import TeacherNavbar from "../../components/navbar/TeacherNavbar";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import ParentNavbar from "../../components/navbar/ParentNavbar";
import SearchIcon from "../../icons/SearchIcon";
import GoBackButton from "../../components/GoBackButton";
import PrimaryButton from "../../components/PrimaryButton";
import { FaCheck, FaTimes, FaPlus, FaTrash, FaRegClock, FaEllipsisV, FaGripVertical, FaChevronDown, FaSortAmountDown, FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";
import { getCategoryVisual, getSourceVisual, getStatusVisual } from "../../utils/todoVisuals";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import Tickcircle from "../../icons/Sanabel/Tickcircle";
import GetAvatar from "./tutorial/GetAvatar";
import { useUserContext } from "../../context/StudentUserProvider";

// Import resource images
import blueSanabel from "../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../assets/resources/اكس بي.png";

// Import category type images
import sanabelType1Img from "../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";
import sanabelType2Img from "../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType4Img from "../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";
import { sanabelImgs } from "../../data/SanabelDictionary";
import { toFiniteNumber } from "../../utils/numericData";
import { describeApiError } from "../../utils/apiError";
import { ToastContainer, toast } from "react-toastify";
import { localStore } from "../../utils/safeStorage";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./StudentToDoList.css";

// Define types
interface Task {
  id: number;
  type: string;
  title: string;
  description: string;
  categoryId: number;
  xp: number;
  kind?: string;
  snabelRed: number;
  snabelYellow: number;
  snabelBlue: number;
  completionStatus: any;
}

interface TodoItem {
  id: any;
  task: Task;
  completed: boolean;
  addedDate?: string;
  status?: "todo" | "pending_approval" | "completed";
  sources?: Array<{ sourceType: "student" | "teacher" | "parent"; sourceId: number; name?: string }>;
  approvalRequests?: Array<{ id: number; status: string; approvedByType?: string; approvedById?: number }>;
  completionSource?: string | null;
  completedByName?: string | null;
  position?: number | null;
  missionDate?: string;
  dayId?: number;
  completedAt?: string | null;
}

export type TodoSourceKind = "self" | "teacher" | "parent" | "multi" | "none";

// Which single identity a card belongs to for filtering/grouping. An item
// assigned by more than one actor is its own bucket — never silently
// collapsed onto whichever source happened to come first.
export const todoSourceKind = (item: TodoItem, isPersonal: boolean): TodoSourceKind => {
  if (isPersonal) return "self";
  const sources = item.sources || [];
  if (sources.length === 0) return "none";
  const kinds = new Set(sources.map((source) => source.sourceType));
  if (kinds.size > 1) return "multi";
  const only = [...kinds][0];
  return only === "student" ? "self" : (only as TodoSourceKind);
};

// Pure reorder step, unit-testable without pointer events: the moved ids of
// the actionable block plus the API payload the server expects.
export const computeReorder = (
  actionableIds: number[],
  activeId: number,
  overId: number,
): { ids: number[]; payload: Array<{ id: number; position: number }> } | null => {
  const from = actionableIds.indexOf(activeId);
  const to = actionableIds.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return null;
  const ids = arrayMove(actionableIds, from, to);
  return { ids, payload: ids.map((id, index) => ({ id, position: index })) };
};

// ISO in, locale-formatted out. Backend always sends ISO timestamps, so no
// engine-specific date-string guessing is involved.
export const formatTodoDate = (iso: string | undefined, language: string, withTime = false): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const locale = language === "en" ? "en-US" : "ar-EG";
  const day = date.toLocaleDateString(locale, { day: "numeric", month: "long" });
  if (!withTime) return day;
  return `${day} · ${date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}`;
};

const dateKeyToLocalDate = (value: string) => new Date(`${value}T12:00:00`);
const localDateToDateKey = (value: Date) => [
  value.getFullYear(),
  String(value.getMonth() + 1).padStart(2, "0"),
  String(value.getDate()).padStart(2, "0"),
].join("-");

const SOURCE_OPTIONS = [
  { key: "all", label: "todo.source.all" },
  { key: "self", label: "todo.source.self" },
  { key: "teacher", label: "todo.source.teacher" },
  { key: "parent", label: "todo.source.parent" },
  { key: "multi", label: "todo.source.multiple" },
] as const;

const SORT_LABELS = {
  manual: "todo.sort.manual",
  newest: "todo.sort.newest",
  oldest: "todo.sort.oldest",
  source: "todo.sort.bySource",
} as const;

const isTodoItemArray = (value: unknown): value is TodoItem[] =>
  Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<TodoItem>;
    return Boolean(
      candidate.task
      && typeof candidate.task === "object"
      && typeof candidate.task.title === "string"
      && typeof candidate.completed === "boolean"
      && (candidate.addedDate === undefined || typeof candidate.addedDate === "string"),
    );
  });

interface TaskCategory {
  id: number;
  title: string;
  description: string;
  category: string;
}

interface TaskType {
  type: string;
  categoryId: number;
}

// Someone who can approve this student's mission. Teachers carry the class
// they teach the student in, which is how a student actually recognises them.
interface Approver {
  id: number;
  type: "parent" | "teacher";
  name: string;
  profileImg?: any;
  subject?: string | null;
  className?: string | null;
  grade?: string | null;
}

const renderTaskResources = (task: Task) =>
  [
    { icon: blueSanabel, value: task.snabelBlue, label: "سنبلة زرقاء" },
    { icon: redSanabel, value: task.snabelRed, label: "سنبلة حمراء" },
    { icon: yellowSanabel, value: task.snabelYellow, label: "سنبلة صفراء" },
    { icon: xpIcon, value: task.xp, label: "نقاط الخبرة" },
  ].map((resource, index) => (
    <div key={index} className="flex flex-col items-center min-w-[18px]">
      <span className="flex items-end justify-center h-4">
        <img src={resource.icon} alt={resource.label} className="w-auto max-h-4" loading="lazy" />
      </span>
      <h1 className="text-xs font-semibold leading-4 text-black">{resource.value}</h1>
    </div>
  ));

// One mission card. Sortable when the list is in manual order; the drag
// listeners are attached ONLY to the grip, so scrolling a finger anywhere else
// on the card can never start a drag.
const TodoCard = ({
  item,
  isPersonal,
  dragEnabled,
  busy,
  language,
  onToggleComplete,
  onMenu,
  isHistorical = false,
}: {
  item: TodoItem;
  isPersonal: boolean;
  dragEnabled: boolean;
  busy: boolean;
  language: string;
  onToggleComplete: (id: number) => void;
  onMenu: (item: TodoItem) => void;
  isHistorical?: boolean;
}) => {
  const { t } = useTranslation();
  const sortable = useSortable({ id: Number(item.id), disabled: !dragEnabled || item.completed });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition ?? undefined,
  };

  const sources = item.sources || [];
  const kind = todoSourceKind(item, isPersonal);
  const taskTypeIcon = sanabelImgs[item.task.type];
  const pending = (item.approvalRequests || []).find((request) => request.status === "pending") as any;
  const pendingNames = (pending?.pendingWith || []).map((target: any) => target.name).filter(Boolean);

  // The date must survive any width: the metadata line wraps to a second
  // line instead of ellipsizing, and name/date live in separate bidi
  // isolates so an English name cannot scramble the Arabic date.
  const metadata = (() => {
    if (isPersonal || kind === "self") {
      return <>{t("todo.source.self")} · {formatTodoDate((sources[0] as any)?.createdAt || item.addedDate, language, true)}</>;
    }
    if (kind === "multi") {
      const latest = sources.reduce((max, source: any) =>
        (source.createdAt && source.createdAt > max ? source.createdAt : max), item.addedDate || "");
      return <>{t("todo.multiSourceLine", { count: sources.length, date: formatTodoDate(latest, language) })}</>;
    }
    const source = sources[0] as any;
    if (!source) return <>{formatTodoDate(item.addedDate, language, true)}</>;
    return <><bdi>{source.name || t(source.sourceType)}</bdi> · {formatTodoDate(source.createdAt || item.addedDate, language, true)}</>;
  })();

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      data-testid={`todo-card-${item.task.id}`}
      className={`border rounded-[20px] px-4 py-3 shadow-sm ${
        sortable.isDragging ? "shadow-lg ring-2 ring-blueprimary z-10 relative" : ""
      } ${
        item.completed
          ? "bg-green-50/50 border-green-100 opacity-90"
          : item.status === "pending_approval"
            ? "bg-amber-50/40 border-amber-200"
            : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 pt-1">
          <span
            data-testid={`category-chip-${item.task.id}`}
            className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full ${getCategoryVisual(item.task.categoryId).chip}`}
          >
            {taskTypeIcon && (
              <img
                src={taskTypeIcon}
                alt=""
                aria-hidden="true"
                className="object-contain w-3 h-3 shrink-0"
              />
            )}
            {t(item.task.type)}
          </span>
          {item.status === "pending_approval" && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full text-amber-700 bg-amber-50">
              <FaRegClock size={10} aria-hidden="true" />
              {pendingNames.length > 0
                ? <>{t("todo.approval.waitingForPrefix")} <bdi>{pendingNames.join("، ")}</bdi></>
                : t("todo.approval.waiting")}
            </span>
          )}
          {item.status === "completed" && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-green-700 rounded-full bg-green-50">
              <FaCheck size={9} aria-hidden="true" />
              {t("todo.status.completed")}
            </span>
          )}
          {isHistorical && item.status === "todo" && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-gray-600 rounded-full bg-gray-100">
              <FaTimes size={9} aria-hidden="true" />{t("todo.status.notCompleted")}
            </span>
          )}
        </div>

        <div className="flex items-center shrink-0">
          {dragEnabled && !item.completed && (
            <button
              type="button"
              aria-label={t("اسحب لإعادة الترتيب")}
              data-testid={`todo-drag-${item.task.id}`}
              className="flex-center w-8 h-10 text-gray-300 cursor-grab active:cursor-grabbing touch-none"
              {...sortable.attributes}
              {...sortable.listeners}
            >
              <FaGripVertical size={13} />
            </button>
          )}
          <button
            type="button"
            aria-label={t("خيارات المهمة")}
            aria-haspopup="menu"
            data-testid={`todo-menu-${item.task.id}`}
            onClick={() => onMenu(item)}
            className="flex-center w-10 h-10 text-gray-400 rounded-full hover:bg-gray-100"
          >
            <FaEllipsisV size={15} />
          </button>
        </div>
      </div>

      <h3 dir="auto" className={`mt-1 text-[16px] font-bold leading-6 line-clamp-2 text-start ${item.completed ? "text-gray-500" : "text-gray-900"}`}>
        <bdi>{t(item.task.title)}</bdi>
      </h3>

      <p className="mt-1 text-xs leading-5 text-gray-500 text-start line-clamp-2">
        <span className={`inline-flex align-middle me-1 ${getSourceVisual(kind === "none" ? "all" : kind).iconClass}`}>
          {getSourceVisual(kind === "none" ? "all" : kind).icon}
        </span>
        {metadata}
        {item.status === "completed" && item.completedByName && (
          <> · {t("todo.approval.approvedBy")}: <bdi className="font-medium text-green-700">{item.completedByName}</bdi></>
        )}
        {isHistorical && item.status === "completed" && item.completedAt && (
          <> · {t("تم الاعتماد")}: {formatTodoDate(item.completedAt, language, true)}</>
        )}
      </p>

      <div className="flex items-end justify-between gap-3 mt-2">
        <div className="flex gap-2.5">{renderTaskResources(item.task)}</div>
        <button
          type="button"
          aria-label={t(item.completed ? "todo.status.completed" : isHistorical ? "todo.status.notCompleted" : "تأكيد الإنجاز")}
          aria-pressed={item.completed}
          disabled={isHistorical || item.completed || item.status === "pending_approval" || busy}
          data-testid={`complete-mission-${item.task.id}`}
          data-guide-id="mission-action"
          onClick={() => onToggleComplete(item.id)}
          className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
            item.completed
              ? "bg-green-500 border border-green-500 text-white"
              : item.status === "pending_approval"
                ? "bg-amber-50 border border-amber-300 text-amber-500"
                : "bg-white border-2 border-blue-300 hover:border-blueprimary"
          }`}
        >
          {item.completed && <FaCheck size={14} />}
          {!item.completed && item.status === "pending_approval" && <FaRegClock size={16} />}
          {!item.completed && item.status !== "pending_approval" && isHistorical && <FaTimes size={14} className="text-gray-400" />}
        </button>
      </div>
    </div>
  );
};

// Reusable bottom sheet: slides from the bottom edge, dark scrim, safe-area
// padding, closes on scrim tap.
const BottomSheet = ({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          role="dialog"
          aria-label={label}
          className="w-full max-w-md bg-white rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-10 h-1 mx-auto mb-3 bg-gray-200 rounded-full" />
          <h2 className="mb-3 text-base font-bold text-black text-start">{label}</h2>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Add Mission Modal Component
const AddMissionModal = ({
  isOpen,
  onClose,
  onAddMission,
  existingTaskIds = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddMission: (task: Task) => void;
  existingTaskIds?: number[];
}) => {
  const { t } = useTranslation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [availableTypes, setAvailableTypes] = useState<TaskType[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sanabelTypeImg = [
    sanabelType1Img,
    sanabelType2Img,
    sanabelType3Img,
    sanabelType4Img,
  ];

  const colors = [
    "text-blueprimary",
    "text-redprimary",
    "text-yellowprimary",
    "text-greenprimary",
  ];

  // Fetch categories on modal open
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    const authToken = localStore.getItem("token");
    if (!authToken) return;

    try {
      setLoading(true)
      setLoadError(null);
      const response = await axios.get(
        `${API_BASE_URL}/students/tasks-category`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 15000,
        },
      );

      if (response.status === 200) {
        const categoryData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCategories(categoryData);
        if (categoryData.length === 0) {
          setLoadError(t("لا توجد فئات مهام متاحة حاليًا"));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      setLoadError(t("تعذر تحميل فئات المهام. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  // Fetch available types when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchAvailableTypes(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const fetchAvailableTypes = async (categoryId: number) => {
    const authToken = localStore.getItem("token");
    if (!authToken) return;

    try {
      setLoading(true);
      setLoadError(null);
      const response = await axios.get(
        `${API_BASE_URL}/students/appear-Taskes-Type/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 15000,
        },
      );

      if (response.status === 200) {
        const uniqueTypes: string[] = [];
        const taskTypes = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        taskTypes.forEach((task: { type?: string }) => {
          if (task.type && !uniqueTypes.includes(task.type)) {
            uniqueTypes.push(task.type);
          }
        });

        const typesWithCategory = uniqueTypes.map((type) => ({
          type,
          categoryId,
        }));

        setAvailableTypes(typesWithCategory);
        setSelectedType(null);
        setFilteredTasks([]);
        setSelectedTaskId(null);
        if (typesWithCategory.length === 0) {
          setLoadError(t("لا توجد أنواع مهام متاحة في هذه الفئة"));
        }
      }
    } catch (error) {
      console.error("Error fetching types:", error);
      setAvailableTypes([]);
      setLoadError(t("تعذر تحميل أنواع المهام. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when type changes
  useEffect(() => {
    if (selectedType && selectedCategoryId) {
      fetchTasksForType(selectedCategoryId, selectedType);
    }
  }, [selectedType, selectedCategoryId]);

  const fetchTasksForType = async (categoryId: number, type: string) => {
    const authToken = localStore.getItem("token");
    if (!authToken) return;

    try {
      setLoading(true);
      setLoadError(null);
      const response = await axios.get(
        `${API_BASE_URL}/students/appear-Taskes-Type-Category/${categoryId}/${type}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 15000,
        },
      );

      if (response.status === 200) {
        const tasks = Array.isArray(response.data.tasks)
          ? response.data.tasks
              .map((task: Task) => ({
                ...task,
                id: toFiniteNumber(task.id, -1),
                categoryId: toFiniteNumber(task.categoryId),
                xp: toFiniteNumber(task.xp),
                snabelRed: toFiniteNumber(task.snabelRed),
                snabelYellow: toFiniteNumber(task.snabelYellow),
                snabelBlue: toFiniteNumber(task.snabelBlue),
              }))
              .filter((task: Task) => task.id > 0)
          : [];
        setFilteredTasks(tasks);
        setSelectedTaskId(null);
        if (tasks.length === 0) {
          setLoadError(t("لا توجد مهام متاحة لهذا النوع"));
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setFilteredTasks([]);
      setLoadError(t("تعذر تحميل المهام. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeImage = (type: any) => {
    return sanabelImgs[type] || null;
  };

  const renderResources = (task: Task) =>
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
          className="w-auto h-4"
          loading="lazy"
        />
        <h1 className="text-xs text-black font-semibold">{resource.value}</h1>
      </div>
    ));

  const isTaskAlreadyAdded = (taskId: number) => existingTaskIds.includes(taskId);

  const handleAddMission = () => {
    const selectedTask = filteredTasks.find(
      (task) => task.id === selectedTaskId,
    );

    if (selectedTask) {
      if (typeof selectedTask.id !== "number" || selectedTask.id <= 0) {
        console.error("Task missing valid ID:", selectedTask);
        alert(t("خطأ: المهمة لا تحتوي على معرف صحيح"));
        return;
      }
      if (isTaskAlreadyAdded(selectedTask.id)) {
        alert(t("هذه المهمة مضافة بالفعل إلى قائمتك اليومية"));
        return;
      }
      onAddMission(selectedTask);
      resetModal();
      onClose();
    } else {
      console.error("No task selected or task not found.");
      alert(t("الرجاء اختيار مهمة أولاً."));
    }
  };

  const resetModal = () => {
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedTaskId(null);
    setAvailableTypes([]);
    setFilteredTasks([]);
    setLoadError(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  // Separate tasks into unadded and already-added
  const unaddedTasks = filteredTasks.filter((t) => !isTaskAlreadyAdded(t.id));
  const alreadyAddedTasks = filteredTasks.filter((t) => isTaskAlreadyAdded(t.id));
  const allTasksAdded = filteredTasks.length > 0 && unaddedTasks.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="flex flex-col w-11/12 max-w-2xl max-h-[90vh] max-h-[90dvh] bg-white rounded-xl p-5 shadow-xl">
        <h2 className="flex-shrink-0 mb-3 text-xl font-bold text-center text-black">
          {t("إضافة مهمة جديدة")}
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg font-medium text-gray-600">{t("جاري التحميل...")}</div>
            </div>
          )}

          {!loading && loadError && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-gray-600">{loadError}</p>
              {selectedCategoryId === null ? (
                <button
                  type="button"
                  onClick={fetchCategories}
                  className="px-4 py-2 text-sm text-white rounded-lg bg-blueprimary hover:bg-blue-600 transition-colors"
                >
                  {t("إعادة المحاولة")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSelectedType(null);
                    setLoadError(null);
                  }}
                  className="px-4 py-2 text-sm border rounded-lg text-blueprimary border-blueprimary hover:bg-blue-50 transition-colors"
                >
                  {t("العودة للفئات")}
                </button>
              )}
            </div>
          )}

          {/* Category Selection */}
          {!loading && !loadError && selectedCategoryId === null && (
            <div className="mb-4">
              <h3 className="mb-3 text-lg font-semibold text-end text-black">
                {t("اختر الفئة")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex flex-col items-center p-3 border-2 cursor-pointer rounded-xl hover:border-blueprimary hover:shadow-sm transition-all"
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <img
                      src={sanabelTypeImg[index]}
                      alt={category.category}
                      className="object-contain w-16 h-16"
                    />
                    <h3
                      className={`${colors[index]} font-bold text-center mt-2 text-sm`}
                    >
                      {t(category.title)}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type Selection */}
          {!loading && !loadError && selectedCategoryId !== null && selectedType === null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSelectedType(null);
                  }}
                  className="flex items-center gap-1 text-xs text-blueprimary font-semibold hover:underline"
                >
                  ← {t("العودة للفئات")}
                </button>
                <h3 className="text-lg font-semibold text-end text-black">
                  {t("اختر النوع")}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {availableTypes.map((typeObj, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3 border-2 cursor-pointer rounded-xl hover:border-blueprimary hover:shadow-sm transition-all"
                    onClick={() => setSelectedType(typeObj.type)}
                  >
                    <img
                      src={getTaskTypeImage(typeObj.type)}
                      alt={typeObj.type}
                      className="object-contain w-16 h-16"
                    />
                    <h3 className="mt-2 text-sm font-bold text-center text-black">
                      {t(typeObj.type)}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Selection */}
          {!loading && !loadError && selectedType !== null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType(null);
                    setSelectedTaskId(null);
                  }}
                  className="flex items-center gap-1 text-xs text-blueprimary font-semibold hover:underline"
                >
                  ← {t("العودة للأنواع")}
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blueprimary font-bold">
                    {getTaskTypeImage(selectedType) && (
                      <img
                        src={getTaskTypeImage(selectedType)}
                        alt=""
                        aria-hidden="true"
                        className="object-contain w-5 h-5"
                      />
                    )}
                    {t(selectedType)}
                  </span>
                </div>
              </div>

              {/* Success celebration banner when all tasks are already added */}
              {allTasksAdded && (
                <div className="flex flex-col items-center justify-center p-6 mb-4 text-center bg-green-50 border border-green-200 rounded-2xl gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                    <FaCheck size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-green-800">
                    {t("جميع مهام هذا القسم مضافة بالفعل إلى قائمتك اليومية")}
                  </h4>
                  <p className="text-xs text-green-700 max-w-sm">
                    {t("يمكنك اختيار نوع آخر أو العودة إلى قائمة مهامك اليومية لإنجازها")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType(null);
                      setSelectedTaskId(null);
                    }}
                    className="mt-1 px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                  >
                    {t("اختر نوعاً آخر")}
                  </button>
                </div>
              )}

              {/* Task list with available tasks first and already-added tasks clearly badged */}
              <div className="flex flex-col gap-2.5">
                {/* Available Tasks */}
                {unaddedTasks.map((task: Task) => {
                  const isSelected = selectedTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blueprimary bg-blue-50 ring-2 ring-blue-300 shadow-sm"
                          : "border-gray-200 hover:border-blueprimary/60 bg-white"
                      }`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex w-1/2 gap-2">
                          {renderResources(task)}
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <h3 className="text-sm font-bold text-end text-black" dir="auto">
                            {t(task.title)}
                          </h3>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Already-Added Tasks Section */}
                {alreadyAddedTasks.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                    {!allTasksAdded && (
                      <p className="text-xs font-bold text-gray-500 text-end mb-1">
                        {t("مهام مضافة بالفعل")} ({alreadyAddedTasks.length})
                      </p>
                    )}
                    {alreadyAddedTasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="border rounded-xl p-3 bg-gray-50/80 border-gray-200 opacity-75 cursor-not-allowed select-none"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex w-1/2 gap-2">
                            {renderResources(task)}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <FaCheck size={10} />
                              <span>{t("مضافة بالفعل في قائمتك")}</span>
                            </div>
                            <h3 className="text-sm font-medium text-end text-gray-600" dir="auto">
                              {t(task.title)}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex w-full gap-3 mt-4 pt-2 border-t border-gray-100">
          <PrimaryButton
            style="stroke"
            text={t("إلغاء")}
            arrow="none"
            onClick={handleClose}
          />
          {selectedTaskId !== null && (
            <PrimaryButton
              style="flex-1"
              text={t("إضافة")}
              arrow="none"
              onClick={handleAddMission}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const LegacyTodoList = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUserData, mutateStudent } = useUserContext();
  const [storedItems, setTodoItems] = useState<TodoItem[]>([]);
  const [soloHistoryItems, setSoloHistoryItems] = useState<TodoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [serverToday, setServerToday] = useState(() => new Date().toISOString().slice(0, 10));
  const [earliestDate, setEarliestDate] = useState<string | undefined>();
  const [historyBoundaryAttempted, setHistoryBoundaryAttempted] = useState(false);
  const [historyBoundaryAttempts, setHistoryBoundaryAttempts] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historicalPendingCount, setHistoricalPendingCount] = useState(0);
  const [oldestHistoricalPendingDate, setOldestHistoricalPendingDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "pending">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | TodoSourceKind>("all");
  const [sortMode, setSortMode] = useState<"manual" | "newest" | "oldest" | "source">("manual");
  const [menuItem, setMenuItem] = useState<TodoItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<TodoItem | null>(null);
  const [retargetItem, setRetargetItem] = useState<TodoItem | null>(null);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  // Distinguishes "still loading" from a genuine empty list, so the summary
  // never shows fake zeros and failures get a retry state instead of a blank.
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const retargetBusy = useRef(false);
  // The first School request deliberately omits a date. This ref records the
  // user for whom serverToday has been learned, so a fast/future device clock
  // can never make the bootstrap request ask the server for a future day.
  const schoolDateBootstrappedFor = useRef<number | null>(null);

  // State to manage the confirmation popup for marking complete
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TodoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(
    null,
  );
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(null);

  const role = localStore.getItem("role");

  const grade = user?.grade;

  const canAssignTask = user?.canAssignTask;
  const isPersonal = !user?.classId;
  const isHistorical = selectedDate < serverToday;

  const submitting = useRef(false);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  // Solo selection stays local. School To-Do state is populated from the
  // server below and already carries authoritative lifecycle state.
  const todoItems = isPersonal && isHistorical
    ? soloHistoryItems.filter((item) => item.missionDate === selectedDate)
    : storedItems.map(item => ({
        ...item,
        completed: isPersonal
          ? (user?.completedTasks?.taskIds.includes(Number(item.task.id)) ?? false)
          : item.status === "completed",
      }));

  const fetchSchoolTodo = async () => {
    const authToken = localStore.getItem("token");
    if (!authToken) return;
    setListError(false);
    const hasServerDate = schoolDateBootstrappedFor.current === user?.id;
    const [todoResponse, approverResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/mission/todo`, {
        ...(hasServerDate ? { params: { date: selectedDate } } : {}),
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      axios.get(`${API_BASE_URL}/mission/myApprovers`, { headers: { Authorization: `Bearer ${authToken}` } }),
    ]);
    const payload = todoResponse.data.data;
    const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
    if (!Array.isArray(payload)) {
      const authoritativeToday = typeof payload?.serverToday === "string" ? payload.serverToday : null;
      if (authoritativeToday) {
        const wasViewingToday = !hasServerDate || selectedDate === serverToday;
        schoolDateBootstrappedFor.current = user?.id ?? null;
        if (wasViewingToday && authoritativeToday !== selectedDate) setSelectedDate(authoritativeToday);
        setServerToday(authoritativeToday);
      }
      setEarliestDate(payload?.earliestDate || undefined);
      setHistoricalPendingCount(Number(payload?.historicalPendingCount) || 0);
      setOldestHistoricalPendingDate(payload?.oldestHistoricalPendingDate || null);
    }
    setTodoItems(items.map((item: any) => ({
      id: item.id,
      task: item.Task,
      completed: item.status === "completed",
      addedDate: item.createdAt,
      status: item.status,
      sources: item.Sources || [],
      approvalRequests: item.ApprovalRequests || [],
      completionSource: item.completionSource,
      completedByName: item.completedByName,
      position: item.position,
      missionDate: item.missionDate,
      dayId: item.dayId,
      completedAt: item.completedAt,
    })));
    setApprovers(approverResponse.data?.data?.approvers || []);
  };

  useEffect(() => {
    if (!user) return;
    if (!isPersonal) {
      setIsListLoading(true);
      void fetchSchoolTodo()
        .catch((error) => {
          console.error("Error loading School Student To-Do:", error);
          setTodoItems([]);
          setListError(true);
        })
        .finally(() => setIsListLoading(false));
      setLoadedFor(user.id);
      return;
    }
    setIsListLoading(false);
    const authoritativeToday = user.completedTasks?.date || new Date().toISOString().slice(0, 10);
    setServerToday(authoritativeToday);
    if (loadedFor !== user.id) setSelectedDate(authoritativeToday);
    try {
      const key = `sanabel:todos:${user.id}`;
      let selections = localStore.getItem(key);
      // Adopt the legacy shared selection list once for the signed-in user.
      // Its cached completion flags are deliberately never trusted.
      if (selections === null && !localStore.getItem("sanabel:legacy-todos-migrated")) {
        selections = localStore.getItem("todoList");
        if (selections) localStore.setItem(key, selections);
        localStore.setItem("sanabel:legacy-todos-migrated", String(user.id));
      }
      const saved = selections === null
        ? []
        : localStore.getJson<TodoItem[]>(key, [], isTodoItemArray);
      setTodoItems(saved);
    } catch {
      setTodoItems([]);
    }
    setLoadedFor(user.id);
    void refreshUserData();
  }, [user?.id, isPersonal, refreshUserData, selectedDate]);

  // Solo Users keep today's chosen list locally, while the completion API is
  // the truthful source for older days. Historic dates therefore show only
  // missions that were actually completed on that day.
  useEffect(() => {
    if (!user || !isPersonal) return;
    const authToken = localStore.getItem("token");
    if (!authToken) return;
    const authoritativeToday = user.completedTasks?.date || serverToday;
    void axios.get(`${API_BASE_URL}/students/student-task-completed`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((response) => {
      const rows = Array.isArray(response.data?.completedTasks) ? response.data.completedTasks : [];
      const history: TodoItem[] = rows.map((task: any, index: number) => ({
        id: `solo-history-${task.id}-${task.missionDate || task.createdAt}-${index}`,
        task,
        completed: true,
        status: "completed" as const,
        missionDate: task.missionDate || String(task.createdAt || "").slice(0, 10),
        addedDate: task.createdAt || task.missionDate,
        completedAt: task.updatedAt || task.createdAt,
      }));
      setSoloHistoryItems(history);
      const dates = history.map((item) => item.missionDate).filter(Boolean).sort() as string[];
      setEarliestDate(dates[0] || authoritativeToday);
    }).catch(() => {
      setSoloHistoryItems([]);
      setEarliestDate(authoritativeToday);
    });
  }, [user?.id, isPersonal, user?.completedTasks?.date]);

  // Resume/focus is the reliable mobile day-boundary trigger. The next API
  // response supplies serverToday; the phone's clock never chooses reward day.
  useEffect(() => {
    if (!user || isPersonal) return;
    const refreshOnResume = () => {
      if (document.visibilityState === "visible") void fetchSchoolTodo().catch(() => setListError(true));
    };
    window.addEventListener("focus", refreshOnResume);
    document.addEventListener("visibilitychange", refreshOnResume);
    return () => {
      window.removeEventListener("focus", refreshOnResume);
      document.removeEventListener("visibilitychange", refreshOnResume);
    };
  }, [user?.id, isPersonal, selectedDate, serverToday]);

  useEffect(() => {
    if (!user || !isPersonal || loadedFor !== user.id) return;
    try {
      localStore.setItem(`sanabel:todos:${user.id}`, JSON.stringify(storedItems.map(item => ({ ...item, completed: false }))));
    } catch {
      // Selections remain usable in memory when browser storage is unavailable.
    }
  }, [storedItems, user?.id, loadedFor, isPersonal]);

  const addMission = async (task: Task) => {
    if (!isPersonal) {
      const authToken = localStore.getItem("token");
      if (!authToken || submitting.current) return;
      submitting.current = true;
      try {
        await axios.post(`${API_BASE_URL}/mission/todo`, { taskId: task.id }, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        await fetchSchoolTodo();
      } catch (error) {
        alert(t(describeApiError(error)));
      } finally {
        submitting.current = false;
      }
      return;
    }
    const newTodoItem: TodoItem = {
      id: task.id,
      task: task,
      completed: false,
      addedDate: new Date().toISOString(),
    };
    setTodoItems((prev) => {
      if (prev.some((item) => item.task.id === task.id)) {
        return prev;
      }
      return [...prev, newTodoItem];
    });
    // A newly added pending mission must be visible even if the user was
    // previously viewing the completed filter or had an active search.
    setFilter("all");
    setSearchQuery("");
  };

  const handleToggleCompleteClick = (todoItemId: number) => {
    const selectedItem = todoItems.find((item) => item.id === todoItemId);
    if (selectedItem?.completed) return; // Don't do anything if already completed

    setSelectedMissionId(todoItemId);
    setShowConfirmPopup(true);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toISOString();
  };

  const confirmMarkComplete = async () => {
    // The ref closes the gap before React renders the disabled button.
    if (selectedMissionId === null || submitting.current) return;
    submitting.current = true;

    setIsLoading(true);
    try {
      const selectedItem = todoItems.find((item) => Number(item.id) === selectedMissionId);
      if (!selectedItem) return;
      if (!isPersonal) {
        if (!selectedApprover) return;
        const authToken = localStore.getItem("token");
        await axios.post(`${API_BASE_URL}/mission/requestApproval`, {
          taskId: selectedItem.task.id,
          todoItemId: selectedItem.id,
          approverId: selectedApprover.id,
          approverType: selectedApprover.type,
        }, { headers: { Authorization: `Bearer ${authToken}` } });
        await fetchSchoolTodo();
        setShowConfirmPopup(false);
        return;
      }
      const response = await mutateStudent("mission", { taskId: selectedItem.task.id, time: getCurrentTime() });

      if (response.status === 200 || response.status === 201) {
        // mutateStudent already reconciled the authoritative daily snapshot.
        setShowConfirmPopup(false);
        setShowCongratsPopup(true);
      }
    } catch (error) {
      AudioManager.play("error");
      console.error("Error marking mission complete:", error);
      // Always show the SPECIFIC reason the request failed (timeout, offline,
      // expired session, duplicate completion, server error...) — never a
      // blank or generic message. Matches utils/apiError.ts used elsewhere
      // (e.g. the shop). The previous version alerted `errorData.message ||
      // response.statusText`, which rendered as a blank dialog whenever the
      // server's error body used a different key AND the connection was
      // HTTP/2 (Vercel/Railway both are) — response.statusText is spec-empty
      // for HTTP/2 in every browser, not just Safari.
      alert(t(describeApiError(error)));
      // A timeout can occur after the server committed. Reconcile before
      // another attempt instead of assuming the completion was rolled back.
      void refreshUserData();
    } finally {
      submitting.current = false;
      setShowConfirmPopup(false);
      setIsLoading(false);
      setSelectedMissionId(null);
      setSelectedApprover(null);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!isPersonal) {
      const authToken = localStore.getItem("token");
      try {
        await axios.delete(`${API_BASE_URL}/mission/todo/${id}`, { headers: { Authorization: `Bearer ${authToken}` } });
        await fetchSchoolTodo();
      } catch (error) {
        toast.error(t(describeApiError(error)));
      }
      return;
    }
    setTodoItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      return updated;
    });
  };

  // Deleting is destructive and the trash sits a thumb-width from the
  // completion circle, so it always passes through an explicit confirmation.
  const handleConfirmDelete = async () => {
    if (!confirmDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTodo(confirmDelete.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const getTaskTypeImage = (type: string) => {
    // Implement your image mapping logic here
    return null;
  };

  const renderResources = (task: Task) =>
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
          className="w-auto h-4"
          loading="lazy"
        />
        <h1 className="text-xs text-black">{resource.value}</h1>
      </div>
    ));

  // Filter todos: status tab + source + search all combine.
  const filteredTodos = todoItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      item.task.title.toLowerCase().includes(query) ||
      t(item.task.title).toLowerCase().includes(query) ||
      t(item.task.type).toLowerCase().includes(query) ||
      (item.sources || []).some((source) => (source.name || "").toLowerCase().includes(query));
    if (!matchesSearch) return false;

    if (sourceFilter !== "all" && todoSourceKind(item, isPersonal) !== sourceFilter) return false;

    if (filter === "completed") return item.completed;
    if (filter === "pending") return !isPersonal && item.status === "pending_approval";
    if (filter === "active") return !item.completed && item.status !== "pending_approval";
    return true;
  });

  const addedTime = (item: TodoItem) => new Date(item.addedDate || 0).getTime();

  // "My order" keeps the incoming order: the server already sorts by the
  // persisted position for school students, and the solo list's array order IS
  // the manual order. Completed history always sorts by recency — nobody
  // should have to hand-sort what is already done.
  const actionableTodos = filteredTodos.filter((item) => !item.completed);
  const completedTodos = filteredTodos
    .filter((item) => item.completed)
    .sort((a, b) => addedTime(b) - addedTime(a));

  const sortedActionable = (() => {
    if (sortMode === "newest") return [...actionableTodos].sort((a, b) => addedTime(b) - addedTime(a));
    if (sortMode === "oldest") return [...actionableTodos].sort((a, b) => addedTime(a) - addedTime(b));
    return actionableTodos;
  })();

  // Grouped view for "by source". Multi-source items form their own group.
  const SOURCE_GROUPS: Array<{ key: TodoSourceKind; label: string }> = [
    { key: "self", label: "أضفتها أنا" },
    { key: "teacher", label: "من المعلمين" },
    { key: "parent", label: "من أولياء الأمور" },
    { key: "multi", label: "مصادر متعددة" },
  ];
  const sourceGroups = SOURCE_GROUPS
    .map((group) => ({ ...group, items: sortedActionable.filter((item) => todoSourceKind(item, isPersonal) === group.key) }))
    .filter((group) => group.items.length > 0);

  // Manual drag exists only when what the student sees is the complete
  // actionable set in their own order — otherwise a drop would silently
  // rewrite the order of items that are not on screen.
  const dragEnabled =
    !isPersonal ? selectedDate === serverToday &&
    sortMode === "manual" &&
    sourceFilter === "all" &&
    searchQuery === "" &&
    (filter === "all" || filter === "active" || filter === "pending") :
    sortMode === "manual" && sourceFilter === "all" && searchQuery === "" && (filter === "all" || filter === "active" || filter === "pending");

  const sensors = useSensors(
    // Small activation distance/delay so vertical scrolling never turns into
    // an accidental drag on touch screens.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistReorder = async (payload: Array<{ id: number; position: number }>) => {
    if (isPersonal) return; // the storage effect persists the array order
    const authToken = localStore.getItem("token");
    if (!authToken) return;
    try {
      await axios.patch(`${API_BASE_URL}/mission/todo/reorder`, { items: payload }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {
      // Roll back to the authoritative order rather than leaving the client
      // and server disagreeing about positions.
      toast.error(t("تعذر حفظ ترتيب المهام"));
      await fetchSchoolTodo().catch(() => undefined);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const actionableIds = sortedActionable.map((item) => Number(item.id));
    const result = computeReorder(actionableIds, Number(active.id), Number(over.id));
    if (!result) return;
    // Optimistic: rebuild the base list with the actionable block in its new
    // order; completed rows keep their place after it.
    setTodoItems((prev) => {
      const byId = new Map(prev.map((item) => [Number(item.id), item]));
      const reordered = result.ids.map((id) => byId.get(id)).filter(Boolean) as TodoItem[];
      const rest = prev.filter((item) => !result.ids.includes(Number(item.id)));
      return [...reordered, ...rest];
    });
    void persistReorder(result.payload);
  };

  const pendingRequestOf = (item: TodoItem) =>
    (item.approvalRequests || []).find((request) => request.status === "pending");

  const retargetTo = async (approver: Approver) => {
    if (!retargetItem || retargetBusy.current) return;
    const request = pendingRequestOf(retargetItem);
    if (!request) { setRetargetItem(null); return; }
    retargetBusy.current = true;
    const authToken = localStore.getItem("token");
    try {
      await axios.post(`${API_BASE_URL}/mission/approval/${request.id}/retarget`,
        { approverType: approver.type, approverId: approver.id },
        { headers: { Authorization: `Bearer ${authToken}` } });
      toast.success(`${t("تم إرسال الطلب إلى")} ${approver.name}`);
      setRetargetItem(null);
      await fetchSchoolTodo();
    } catch (error) {
      toast.error(t(describeApiError(error)));
    } finally {
      retargetBusy.current = false;
    }
  };

  const getStats = () => {
    const total = todoItems.length;
    const completed = todoItems.filter((item) => item.completed).length;
    const pending = isPersonal ? 0 : todoItems.filter((item) => item.status === "pending_approval").length;
    const active = total - completed - pending;
    return { total, completed, pending, active };
  };

  const stats = getStats();
  const isHistorical = !isPersonal && selectedDate < serverToday;
  const shiftSelectedDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    const next = date.toISOString().slice(0, 10);
    if (earliestDate && next < earliestDate) {
      setHistoryBoundaryAttempted(true);
      return;
    }
    if (next <= serverToday) {
      setHistoryBoundaryAttempted(false);
      setSelectedDate(next);
    }
  };
  const yesterday = (() => { const date = new Date(`${serverToday}T12:00:00.000Z`); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10); })();
  const selectedDateLabel = selectedDate === serverToday
    ? t("todo.date.today")
    : selectedDate === yesterday ? t("todo.date.yesterday")
      : new Date(`${selectedDate}T12:00:00.000Z`).toLocaleDateString(i18n.language === "en" ? "en-US" : "ar-EG", { weekday: "long" });
  const selectedDateCaption = new Date(`${selectedDate}T12:00:00.000Z`).toLocaleDateString(i18n.language === "en" ? "en-US" : "ar-EG", { day: "numeric", month: "short" });
  const isRtl = (i18n.resolvedLanguage || i18n.language || "ar").startsWith("ar");

  return (
    // One natural scroll region: the page itself. No nested fixed-height list
    // with its own scrollbar.
    <div
      className="flex flex-col items-center gap-3 px-4 pt-3 pb-4 overflow-y-auto no-scrollbar"
      id="page-height"
      dir={isRtl ? "rtl" : "ltr"}
      lang={isRtl ? "ar" : "en"}
    >
      {/* Header */}
      <div className="flex-col w-full gap-2.5 flex-center">
        <div className="flex flex-row-reverse items-center justify-between w-full">
          <div className="w-16 h-16"></div>
          <h1 className="text-2xl font-bold text-black">
            {t("todo.page.title")}
          </h1>
          <GoBackButton />
        </div>

        <div className="flex items-center w-full gap-2">
              <button type="button" aria-label={t("todo.date.previous")} onClick={() => shiftSelectedDate(-1)}
                className="w-10 h-10 text-gray-600 bg-gray-100 rounded-xl flex-center">
                {isRtl ? <FaChevronRight size={13} /> : <FaChevronLeft size={13} />}
              </button>
              <button
                type="button"
                aria-label={t("todo.date.select")}
                aria-haspopup="dialog"
                aria-expanded={showDatePicker}
                onClick={() => setShowDatePicker(true)}
                className="relative flex items-center justify-center flex-1 h-10 gap-2 text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-xl cursor-pointer"
              >
                <FaCalendarAlt size={13} className="text-blueprimary" />
                <span className="flex flex-col leading-tight text-center"><span>{selectedDateLabel}</span><span className="text-[10px] font-medium text-gray-400">{selectedDateCaption}</span></span>
              </button>
              <button type="button" aria-label={t("todo.date.next")} onClick={() => shiftSelectedDate(1)}
                disabled={selectedDate >= serverToday} className="w-10 h-10 text-gray-600 bg-gray-100 rounded-xl flex-center disabled:opacity-30">
                {isRtl ? <FaChevronLeft size={13} /> : <FaChevronRight size={13} />}
              </button>
              <button type="button" aria-label={searchOpen ? t("إغلاق البحث") : t("todo.search")} onClick={() => {
                setSearchOpen((open) => !open); if (searchOpen) setSearchQuery("");
              }} className="w-10 h-10 text-white rounded-xl bg-blueprimary flex-center">
                {searchOpen ? <FaTimes size={16} /> : <SearchIcon className="text-white" size={17} />}
              </button>
            </div>
            {selectedDate !== serverToday && (
              <button type="button" onClick={() => { setHistoryBoundaryAttempted(false); setSelectedDate(serverToday); }} className="self-start text-xs font-semibold text-blueprimary">{t("todo.date.backToToday")}</button>
            )}
            {historyBoundaryAttempted && selectedDate !== serverToday && (
              <p data-testid="todo-history-boundary" className="w-full text-center text-[11px] leading-4 text-gray-400">
                {t("todo.date.firstDay")}
              </p>
            )}
        {!isPersonal && selectedDate === serverToday && historicalPendingCount > 0 && (
          <button type="button" onClick={() => { setHistoryBoundaryAttempted(false); if (oldestHistoricalPendingDate) setSelectedDate(oldestHistoricalPendingDate); }}
            className="w-full px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 rounded-xl text-start">
            {t("todo.historical.pending", { count: historicalPendingCount })}
          </button>
        )}
        {searchOpen && (
          <div className="flex items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
            <input type="text" placeholder={t("todo.searchPlaceholder")}
              className="w-full py-2.5 text-black bg-transparent drop-shadow-sm text-start" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} autoFocus={!isPersonal} />
            <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center"><SearchIcon className="text-white" size={20} /></div>
          </div>
        )}

        {/* Status summary — one compact line per tab: label + count badge. */}
        <div className={`grid w-full ${isPersonal ? "grid-cols-3" : "grid-cols-4"} gap-1.5`} role="tablist" aria-label={t("todo.status.label")}>
          {([
            { key: "all" as const, label: "todo.status.all", count: stats.total },
            { key: "active" as const, label: "todo.status.inProgress", count: stats.active },
            ...(!isPersonal ? [{ key: "pending" as const, label: "todo.status.pending", count: stats.pending }] : []),
            { key: "completed" as const, label: "todo.status.completed", count: stats.completed },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={filter === tab.key}
              data-testid={`status-tab-${tab.key}`}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center justify-center gap-1 h-11 px-1 rounded-xl text-[11px] font-bold transition-colors ${
                filter === tab.key
                  ? "bg-blueprimary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span className={filter === tab.key ? "text-white" : getStatusVisual(tab.key).iconClass}>
                {getStatusVisual(tab.key).icon}
              </span>
              {t(tab.label)}
              <span className={`flex-center min-w-[18px] h-[18px] px-1 text-[10px] rounded-full ${
                filter === tab.key ? "bg-white text-blueprimary" : "bg-white text-gray-500"
              }`}>
                {isListLoading ? "…" : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Source + sort: two compact dropdowns instead of a chip row, so the
            Parent option can never scroll out of reach on narrow screens. */}
        <div className="flex items-center justify-between w-full gap-2">
          {!isPersonal ? (
            <button
              type="button"
              data-testid="todo-source-button"
              aria-haspopup="dialog"
              onClick={() => setShowSourceSheet(true)}
              className={`flex items-center gap-1.5 px-3 h-9 text-xs font-semibold rounded-full ${getSourceVisual(sourceFilter === "none" ? "all" : sourceFilter).triggerClass}`}
            >
              <span className={getSourceVisual(sourceFilter === "none" ? "all" : sourceFilter).iconClass}>
                {getSourceVisual(sourceFilter === "none" ? "all" : sourceFilter).icon}
              </span>
              {t("todo.source.label")}: {t(SOURCE_OPTIONS.find((option) => option.key === sourceFilter)?.label || "todo.source.all")}
              <FaChevronDown size={10} aria-hidden="true" />
            </button>
          ) : <span />}
          <button
            type="button"
            data-testid="todo-sort-button"
            aria-haspopup="dialog"
            onClick={() => setShowSortSheet(true)}
            className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full shrink-0"
          >
            <FaSortAmountDown size={11} className="text-gray-500" aria-hidden="true" />
            {t(SORT_LABELS[sortMode])}
            <FaChevronDown size={10} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="flex flex-col justify-start w-full gap-3 pb-2">
        {isListLoading ? (
          <div className="flex flex-col gap-3" aria-label={t("todo.loading")}>
            {[0, 1, 2].map((skeleton) => (
              <div key={skeleton} className="p-4 bg-white border border-gray-100 shadow-sm rounded-[20px] animate-pulse">
                <div className="w-16 h-4 bg-gray-100 rounded-full" />
                <div className="w-3/4 h-5 mt-3 bg-gray-100 rounded" />
                <div className="w-1/2 h-3 mt-2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : listError ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="mb-3 text-5xl">⚠️</div>
            <p className="text-sm">{t("todo.loadError")}</p>
            <button
              type="button"
              onClick={() => {
                setIsListLoading(true);
                void fetchSchoolTodo().catch(() => setListError(true)).finally(() => setIsListLoading(false));
              }}
              className="px-5 py-2 mt-4 text-sm font-semibold border rounded-xl text-blueprimary border-blueprimary"
            >
              {t("todo.retry")}
            </button>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="mb-4 text-6xl">📝</div>
            <div className="text-lg font-medium">
              {searchQuery
                ? t("todo.empty.results")
                : filter === "active"
                  ? t("todo.empty.inProgress")
                  : filter === "pending"
                    ? t("todo.empty.pending")
                    : filter === "completed"
                      ? t("todo.empty.completed")
                      : t("todo.empty.all")}
            </div>
            <div className="text-sm">{t("اضغط على زر الإضافة لإنشاء مهمة جديدة")}</div>
          </div>
        ) : sortMode === "source" ? (
          <>
            {sourceGroups.map((group) => (
              <section key={group.key}>
                <h2 className="flex items-center justify-between mb-2 text-sm font-bold text-gray-700 text-start">
                  {t(group.label)}
                  <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full">{group.items.length}</span>
                </h2>
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <TodoCard key={item.id} item={item} isPersonal={isPersonal} isHistorical={isHistorical} dragEnabled={false}
                      busy={isLoading || !user} language={i18n.language}
                      onToggleComplete={handleToggleCompleteClick} onMenu={setMenuItem} />
                  ))}
                </div>
              </section>
            ))}
            {completedTodos.length > 0 && (filter === "all" || filter === "completed") && (
              <section>
                <h2 className="mb-2 text-sm font-bold text-gray-500 text-start">{t("todo.status.completed")}</h2>
                <div className="flex flex-col gap-3">
                  {completedTodos.map((item) => (
                    <TodoCard key={item.id} item={item} isPersonal={isPersonal} isHistorical={isHistorical} dragEnabled={false}
                      busy={isLoading || !user} language={i18n.language}
                      onToggleComplete={handleToggleCompleteClick} onMenu={setMenuItem} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedActionable.map((item) => Number(item.id))} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {sortedActionable.map((item) => (
                    <TodoCard key={item.id} item={item} isPersonal={isPersonal} isHistorical={isHistorical} dragEnabled={dragEnabled}
                      busy={isLoading || !user} language={i18n.language}
                      onToggleComplete={handleToggleCompleteClick} onMenu={setMenuItem} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {completedTodos.length > 0 && (filter === "all" || filter === "completed") && (
              <div className="flex flex-col gap-3">
                {sortedActionable.length > 0 && (
                  <h2 className="mt-1 text-sm font-bold text-gray-500 text-start">{t("todo.status.completed")}</h2>
                )}
                {completedTodos.map((item) => (
                  <TodoCard key={item.id} item={item} isPersonal={isPersonal} isHistorical={isHistorical} dragEnabled={false}
                    busy={isLoading || !user} language={i18n.language}
                    onToggleComplete={handleToggleCompleteClick} onMenu={setMenuItem} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Mission CTA — pinned above the bottom navigation, clear of the
          iOS home indicator via the shell's safe-area padding. */}
      {!isHistorical && <div className="sticky bottom-0 z-20 flex justify-center w-full pt-2 pb-1 bg-gradient-to-t from-white via-white to-transparent">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-8 h-[52px] text-lg font-bold text-white rounded-full shadow-md bg-gradient-to-r from-[#2293c7] to-blueprimary active:scale-[0.98] transition-transform"
        >
          <FaPlus size={15} aria-hidden="true" />
          {t("todo.addMission")}
        </button>
      </div>}

      {/* Add Mission Modal */}
      <AddMissionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddMission={addMission}
        existingTaskIds={todoItems.map((item) => item.task.id)}
      />

      {/* Card menu — only semantically valid actions are rendered. */}
      <BottomSheet open={!!menuItem} onClose={() => setMenuItem(null)} label={t("خيارات المهمة")}>
        {menuItem && (() => {
          const kind = todoSourceKind(menuItem, isPersonal);
          const canRemove = isPersonal || (!isHistorical && menuItem.status === "todo" && kind === "self");
          const pending = pendingRequestOf(menuItem);
          const currentTargets = ((pending as any)?.pendingWith || []).map((target: any) => `${target.type}:${target.id}`);
          const alternates = approvers.filter((approver) => !currentTargets.includes(`${approver.type}:${approver.id}`));
          return (
            <div className="flex flex-col divide-y divide-gray-100" role="menu">
              <button type="button" role="menuitem" data-testid="menu-details"
                className="flex items-center gap-3 py-3 text-sm font-medium text-gray-800 text-start"
                onClick={() => { setDetailsItem(menuItem); setMenuItem(null); }}>
                <span className="flex-center w-9 h-9 text-gray-500 bg-gray-100 rounded-full"><SearchIcon size={15} /></span>
                {t("عرض التفاصيل")}
              </button>
              {!isPersonal && pending && alternates.length > 0 && (
                <button type="button" role="menuitem" data-testid="menu-retarget"
                  className="flex items-center gap-3 py-3 text-sm font-medium text-gray-800 text-start"
                  onClick={() => { setRetargetItem(menuItem); setMenuItem(null); }}>
                  <span className="flex-center w-9 h-9 rounded-full text-amber-600 bg-amber-50"><FaRegClock size={15} /></span>
                  {t("todo.approval.retarget")}
                </button>
              )}
              {canRemove && (
                <button type="button" role="menuitem" data-testid="menu-remove"
                  className="flex items-center gap-3 py-3 text-sm font-medium text-red-600 text-start"
                  onClick={() => { setConfirmDelete(menuItem); setMenuItem(null); }}>
                  <span className="flex-center w-9 h-9 text-red-500 rounded-full bg-red-50"><FaTrash size={13} /></span>
                  {t("todo.remove")}
                </button>
              )}
            </div>
          );
        })()}
      </BottomSheet>

      {/* Read-only details: every assignment source with its own timestamp. */}
      <BottomSheet open={!!detailsItem} onClose={() => setDetailsItem(null)} label={t("تفاصيل المهمة")}>
        {detailsItem && (
          <div className="text-start">
            <h3 className="text-[15px] font-semibold text-black">{t(detailsItem.task.title)}</h3>
            <div className="flex gap-2.5 mt-2">{renderTaskResources(detailsItem.task)}</div>
            <h4 className="mt-4 mb-1 text-xs font-bold text-gray-500">{t("مصادر المهمة")}</h4>
            <ul className="flex flex-col gap-2">
              {(isPersonal || (detailsItem.sources || []).length === 0
                ? [{ sourceType: "student", name: t("أنت"), createdAt: detailsItem.addedDate } as any]
                : detailsItem.sources || []
              ).map((source: any, index: number) => (
                <li key={index} className="flex items-center justify-between p-2 text-sm rounded-lg bg-gray-50">
                  <span className="font-medium text-gray-800">
                    <bdi>{source.sourceType === "student" ? t("أنت") : source.name || t(source.sourceType)}</bdi>
                    <span className="text-xs text-gray-500"> · {source.sourceType === "teacher" ? t("المعلم") : source.sourceType === "parent" ? t("ولي الأمر") : t("أضفتها أنت")}</span>
                  </span>
                  <span className="text-xs text-gray-500">{formatTodoDate(source.createdAt || detailsItem.addedDate, i18n.language, true)}</span>
                </li>
              ))}
            </ul>
            {detailsItem.status === "completed" && (
              <p className="mt-3 text-sm text-green-700">
                {t("todo.status.completed")}
                {detailsItem.completedByName ? <> — {t("todo.approval.approvedBy")}: <bdi>{detailsItem.completedByName}</bdi></> : null}
              </p>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Retarget: pick another currently-eligible approver. Never a completion. */}
      <BottomSheet open={!!retargetItem} onClose={() => setRetargetItem(null)} label={t("todo.approval.retarget")}>
        {retargetItem && (() => {
          const pending = pendingRequestOf(retargetItem);
          const currentTargets = ((pending as any)?.pendingWith || []).map((target: any) => `${target.type}:${target.id}`);
          const alternates = approvers.filter((approver) => !currentTargets.includes(`${approver.type}:${approver.id}`));
          return alternates.length === 0 ? (
            <p className="py-3 text-sm text-center text-gray-500">{t("لا يوجد ولي أمر أو معلم مرتبط بحسابك")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alternates.map((approver) => (
                <button key={`${approver.type}:${approver.id}`} type="button"
                  data-testid={`retarget-${approver.type}-${approver.id}`}
                  onClick={() => void retargetTo(approver)}
                  className="flex items-center w-full gap-3 p-2 border border-gray-200 rounded-lg text-start hover:border-blueprimary">
                  <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 rounded-full">
                    <GetAvatar userAvatarData={approver.profileImg ?? undefined} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate"><bdi>{approver.name}</bdi></p>
                    <p className="text-xs text-gray-500">{t(approver.type === "parent" ? "Parent" : "Teacher")}</p>
                  </div>
                </button>
              ))}
            </div>
          );
        })()}
      </BottomSheet>

      {/* Source filter */}
      <BottomSheet open={showSourceSheet} onClose={() => setShowSourceSheet(false)} label={t("todo.source.label")}>
        <div className="flex flex-col divide-y divide-gray-100" role="radiogroup" aria-label={t("todo.source.label")}>
          {SOURCE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={sourceFilter === option.key}
              data-testid={`source-${option.key}`}
              onClick={() => { setSourceFilter(option.key); setShowSourceSheet(false); }}
              className="flex items-center gap-3 py-3 text-sm font-medium text-gray-800 text-start"
            >
              <span className={`flex-center w-8 h-8 rounded-full ${getSourceVisual(option.key).triggerClass}`}>
                {getSourceVisual(option.key).icon}
              </span>
              <span className="flex-1">{t(option.label)}</span>
              {sourceFilter === option.key && <FaCheck className="text-blueprimary" size={14} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Sort */}
      <BottomSheet open={showSortSheet} onClose={() => setShowSortSheet(false)} label={t("todo.sort.label")}>
        <div className="flex flex-col divide-y divide-gray-100" role="radiogroup" aria-label={t("todo.sort.label")}>
          {(Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).map((mode) => (
            <button key={mode} type="button" role="radio" aria-checked={sortMode === mode}
              data-testid={`sort-${mode}`}
              onClick={() => { setSortMode(mode); setShowSortSheet(false); }}
              className="flex items-center justify-between py-3 text-sm font-medium text-gray-800 text-start">
              {t(SORT_LABELS[mode])}
              {sortMode === mode && <FaCheck className="text-blueprimary" size={14} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showDatePicker} onClose={() => setShowDatePicker(false)} label={t("todo.date.select")}>
        <Calendar
          value={dateKeyToLocalDate(selectedDate)}
          minDate={earliestDate ? dateKeyToLocalDate(earliestDate) : undefined}
          maxDate={dateKeyToLocalDate(serverToday)}
          locale={isRtl ? "ar-EG" : "en-US"}
          calendarType="gregory"
          prev2Label={null}
          next2Label={null}
          prevLabel={<span role="img" aria-label={t("todo.date.previousMonth")}>{isRtl ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}</span>}
          nextLabel={<span role="img" aria-label={t("todo.date.nextMonth")}>{isRtl ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}</span>}
          showNeighboringMonth={false}
          className="todo-calendar"
          onChange={(value) => {
            const chosenDate = Array.isArray(value) ? value[0] : value;
            if (!(chosenDate instanceof Date)) return;
            setHistoryBoundaryAttempted(false);
            setSelectedDate(localDateToDateKey(chosenDate));
            setShowDatePicker(false);
          }}
        />
      </BottomSheet>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => !isDeleting && setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 1 }}
              className="w-full max-w-sm p-6 mx-4 bg-white shadow-2xl rounded-xl"
              onClick={(event) => event.stopPropagation()}
              role="alertdialog"
              aria-label={t("حذف المهمة")}
            >
              <div className="text-center">
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-red-50">
                  <FaTrash className="text-xl text-red-500" />
                </div>
                <h2 className="mb-1 text-lg font-bold text-gray-800">
                  {t("إزالة المهمة؟")}
                </h2>
                <p className="mb-1 text-sm font-medium text-gray-800">
                  {t(confirmDelete.task.title)}
                </p>
                <p className="mb-5 text-xs text-gray-500">
                  {t("سيتم حذفها من قائمة مهامك فقط.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 font-medium text-gray-800 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    {t("إلغاء")}
                  </button>
                  <button
                    data-testid="confirm-delete-todo"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 font-medium text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {isDeleting ? t("جاري الحذف...") : t("إزالة")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="top-center" autoClose={3000} closeOnClick pauseOnHover theme="light" />

      {/* Confirmation Popup */}
      <AnimatePresence>
        {showConfirmPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowConfirmPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 1 }}
              className="w-full max-w-sm p-6 mx-4 bg-white shadow-2xl rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full">
                  <FaCheck className="text-2xl text-white" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-800">
                  {t("تأكيد الإنجاز")}
                </h2>
                <p className={`text-gray-600 ${isPersonal ? "mb-6" : "mb-4"}`}>
                  {t("هل أنت متأكد من أنك أنجزت هذه المهمة؟")}
                </p>
                {!isPersonal && (
                  <div
                    className="mb-5 text-end"
                    data-testid="mission-approver-select"
                  >
                    <p className="mb-2 text-sm font-semibold text-gray-700">
                      {t("Choose a Parent or Teacher")}
                    </p>
                    {approvers.length === 0 ? (
                      <p className="py-3 text-sm text-center text-gray-500 border border-dashed rounded-lg">
                        {t("لا يوجد ولي أمر أو معلم مرتبط بحسابك")}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-56">
                        {approvers.map((approver) => {
                          const isSelected =
                            selectedApprover?.type === approver.type &&
                            selectedApprover?.id === approver.id;
                          const details = [
                            t(approver.type === "parent" ? "Parent" : "Teacher"),
                            approver.subject,
                            approver.grade ? t(approver.grade) : null,
                            approver.className,
                          ].filter(Boolean);
                          return (
                            <button
                              key={`${approver.type}:${approver.id}`}
                              type="button"
                              data-testid={`approver-option-${approver.type}:${approver.id}`}
                              aria-pressed={isSelected}
                              onClick={() => setSelectedApprover(approver)}
                              className={`flex items-center w-full gap-3 p-2 text-end transition-colors border rounded-lg ${
                                isSelected
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 rounded-full">
                                <GetAvatar userAvatarData={approver.profileImg ?? undefined} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {approver.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {details.join(" · ")}
                                </p>
                              </div>
                              {isSelected && (
                                <FaCheck className="flex-shrink-0 text-green-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmPopup(false)}
                    className="flex-1 px-4 py-2 font-medium text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    {t("إلغاء")}
                  </button>
                  <button
                    data-testid="confirm-mission-action"
                    onClick={confirmMarkComplete}
                    disabled={isLoading || (!isPersonal && !selectedApprover)}
                    className="flex-1 px-4 py-2 font-medium text-white transition-all bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {isLoading ? t("جاري التحديث...") : t("تأكيد")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Congratulations Popup */}
      <AnimatePresence>
        {showCongratsPopup && isPersonal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="w-full max-w-sm p-8 mx-4 text-center bg-white shadow-2xl rounded-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full"
              >
                <Tickcircle className="text-3xl text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-gray-800"
              >
                {t("🎉 مبروك! 🎉")}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-gray-600"
              >
                {t("لقد أنجزت المهمة بنجاح")}
                <br />
                {t("استمر في التقدم الرائع 💪")}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowCongratsPopup(false)}
                className="w-full px-6 py-3 font-medium text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
              >
                {t("رائع")}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {role === "Student" ? (
        <StudentNavbar />
      ) : role === "Teacher" ? (
        <TeacherNavbar />
      ) : (
        <ParentNavbar />
      )}
    </div>
  );
};

const TodoList = LegacyTodoList;
export default TodoList;

/* Removed superseded Solo-only draft.
type SoloFilter = "all" | "active" | "completed";

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

const changeDate = (value: string, days: number) => {
  const date = fromDateKey(value);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const formatTodoDate = (value: string | undefined, locale: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar-EG" : "en", {
    day: "numeric",
    month: "long",
  }).format(date);
};

export const todoSourceKind = (item: TodoItem, isPersonal: boolean) => {
  if (isPersonal) return "self";
  const sourceTypes = new Set((item.sources || []).map((source) => source.sourceType));
  if (sourceTypes.size > 1) return "multi";
  if (sourceTypes.has("teacher")) return "teacher";
  if (sourceTypes.has("parent")) return "parent";
  return "self";
};

export const computeReorder = (ids: number[], activeId: number, overId: number) => {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return null;
  const reordered = [...ids];
  reordered.splice(to, 0, reordered.splice(from, 1)[0]);
  return {
    ids: reordered,
    payload: reordered.map((id, position) => ({ id, position })),
  };
};

const SoloTodoList = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUserData, mutateStudent } = useUserContext();
  const role = localStorage.getItem("role");
  const locale = i18n.resolvedLanguage || i18n.language || "ar";
  const direction = locale.startsWith("ar") ? "rtl" : "ltr";
  const authoritativeToday = user?.completedTasks?.date || toDateKey(new Date());

  const [storedItems, setStoredItems] = useState<TodoItem[]>([]);
  const [historyItems, setHistoryItems] = useState<TodoItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(authoritativeToday);
  const [earliestDate, setEarliestDate] = useState(authoritativeToday);
  const [filter, setFilter] = useState<SoloFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [boundaryAttempts, setBoundaryAttempts] = useState(0);
  const [showBoundaryMessage, setShowBoundaryMessage] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!user) return;
    const today = user.completedTasks?.date || toDateKey(new Date());
    setSelectedDate(today);
    setEarliestDate(today);
    setShowBoundaryMessage(false);
    setBoundaryAttempts(0);

    try {
      const storageKey = `sanabel:todos:${user.id}`;
      let selections = localStorage.getItem(storageKey);
      if (selections === null && !localStorage.getItem("sanabel:legacy-todos-migrated")) {
        selections = localStorage.getItem("todoList");
        if (selections) localStorage.setItem(storageKey, selections);
        localStorage.setItem("sanabel:legacy-todos-migrated", String(user.id));
      }
      const parsed = JSON.parse(selections || "[]");
      setStoredItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setStoredItems([]);
    }
    setLoadedFor(user.id);
    void refreshUserData();

    const authToken = localStorage.getItem("token");
    if (!authToken) return;
    void axios.get(`${API_BASE_URL}/students/student-task-completed`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((response) => {
      const completedTasks = Array.isArray(response.data?.completedTasks)
        ? response.data.completedTasks
        : [];
      const completedHistory: TodoItem[] = completedTasks.map((task: any, index: number) => ({
        id: `solo-history-${task.id}-${task.missionDate || task.createdAt}-${index}`,
        task,
        completed: true,
        status: "completed" as const,
        missionDate: task.missionDate || String(task.createdAt || "").slice(0, 10),
        addedDate: task.createdAt || task.missionDate,
      }));
      setHistoryItems(completedHistory);
      const dates = completedHistory
        .map((item) => item.missionDate)
        .filter(Boolean)
        .sort() as string[];
      setEarliestDate(dates[0] || today);
    }).catch(() => {
      setHistoryItems([]);
      setEarliestDate(today);
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user || loadedFor !== user.id) return;
    try {
      localStorage.setItem(
        `sanabel:todos:${user.id}`,
        JSON.stringify(storedItems.map((item) => ({ ...item, completed: false }))),
      );
    } catch {
      // The current list remains usable in memory if storage is unavailable.
    }
  }, [storedItems, user?.id, loadedFor]);

  const isHistorical = selectedDate < authoritativeToday;
  const todayItems = storedItems.map((item) => ({
    ...item,
    completed: user?.completedTasks?.taskIds?.includes(Number(item.task.id)) ?? false,
  }));
  const itemsForDate = isHistorical
    ? historyItems.filter((item) => item.missionDate === selectedDate)
    : todayItems;

  const selectDate = (nextDate: string) => {
    if (nextDate > authoritativeToday) return;
    if (nextDate < earliestDate) {
      setBoundaryAttempts((current) => {
        const next = current + 1;
        if (next >= 2) setShowBoundaryMessage(true);
        return next;
      });
      return;
    }
    setBoundaryAttempts(0);
    setShowBoundaryMessage(false);
    setSelectedDate(nextDate);
    setShowCalendar(false);
    setFilter("all");
  };

  const addMission = (task: Task) => {
    setStoredItems((current) => current.some((item) => item.task.id === task.id)
      ? current
      : [...current, { id: task.id, task, completed: false, addedDate: new Date().toISOString() }]);
    setFilter("all");
    setSearchQuery("");
  };

  const confirmComplete = async () => {
    if (selectedMissionId === null || submitting.current) return;
    const selected = todayItems.find((item) => Number(item.id) === selectedMissionId);
    if (!selected) return;
    submitting.current = true;
    setIsLoading(true);
    try {
      const response = await mutateStudent("mission", {
        taskId: selected.task.id,
        time: new Date().toISOString(),
      });
      if (response.status === 200 || response.status === 201) setShowCongratsPopup(true);
    } catch (error) {
      AudioManager.play("error");
      alert(t(describeApiError(error)));
      void refreshUserData();
    } finally {
      submitting.current = false;
      setIsLoading(false);
      setSelectedMissionId(null);
      setShowConfirmPopup(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const visibleItems = itemsForDate.filter((item) => {
    const searchable = `${item.task.title} ${t(item.task.title)} ${t(item.task.type)}`.toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filter === "active") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  const stats = {
    all: itemsForDate.length,
    active: itemsForDate.filter((item) => !item.completed).length,
    completed: itemsForDate.filter((item) => item.completed).length,
  };

  const dateLabel = selectedDate === authoritativeToday
    ? t("todo.date.today")
    : selectedDate === changeDate(authoritativeToday, -1)
      ? t("todo.date.yesterday")
      : new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar-EG" : "en", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }).format(fromDateKey(selectedDate));

  const resources = (task: Task) => [
    { icon: blueSanabel, value: task.snabelBlue, label: "سنبلة زرقاء" },
    { icon: redSanabel, value: task.snabelRed, label: "سنبلة حمراء" },
    { icon: yellowSanabel, value: task.snabelYellow, label: "سنبلة صفراء" },
    { icon: xpIcon, value: task.xp, label: "نقاط الخبرة" },
  ].map((resource) => (
    <span key={resource.label} className="flex flex-col items-center text-xs text-black">
      <img src={resource.icon} alt={resource.label} className="h-4 w-auto" />
      {resource.value}
    </span>
  ));

  const tabs: Array<{ key: SoloFilter; label: string; count: number; icon: typeof FaList }> = [
    { key: "all", label: t("todo.status.all"), count: stats.all, icon: FaList },
    { key: "active", label: t("todo.status.inProgress"), count: stats.active, icon: FaClock },
    { key: "completed", label: t("todo.status.completed"), count: stats.completed, icon: FaCheckCircle },
  ];

  return (
    <div id="page-height" dir={direction} className="flex flex-col items-center gap-4 overflow-y-auto p-4 pb-24">
      <header className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <GoBackButton />
          <h1 className="text-2xl font-bold text-black">{t("todo.page.title")}</h1>
          <button
            type="button"
            aria-label={searchOpen ? t("إغلاق البحث") : t("todo.search")}
            onClick={() => {
              setSearchOpen((open) => !open);
              if (searchOpen) setSearchQuery("");
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-blueprimary text-white"
          >
            {searchOpen ? <FaTimes /> : <SearchIcon className="text-white" size={20} />}
          </button>
        </div>

        <div className="flex items-center gap-2" dir="ltr">
          <button type="button" aria-label={t("todo.date.previous")} onClick={() => selectDate(changeDate(selectedDate, -1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FaChevronLeft />
          </button>
          <button type="button" aria-label={t("todo.date.select")} aria-haspopup="dialog" onClick={() => setShowCalendar(true)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800" dir={direction}>
            <FaCalendarAlt className="text-blueprimary" />
            {dateLabel}
          </button>
          <button type="button" aria-label={t("todo.date.next")} disabled={selectedDate >= authoritativeToday} onClick={() => selectDate(changeDate(selectedDate, 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30">
            <FaChevronRight />
          </button>
        </div>

        {showBoundaryMessage && selectedDate !== authoritativeToday && (
          <p data-testid="todo-history-boundary" className="text-center text-xs text-slate-500">{t("todo.date.noEarlierHistory")}</p>
        )}

        {searchOpen && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 px-3">
            <SearchIcon className="text-slate-400" size={18} />
            <input autoFocus type="search" placeholder={t("todo.searchPlaceholder")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full bg-transparent py-3 text-start text-black outline-none" />
          </div>
        )}

        <div className="grid w-full grid-cols-3 gap-2">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button key={key} data-testid={`status-tab-${key}`} onClick={() => setFilter(key)} className={`flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium ${filter === key ? "bg-blueprimary text-white" : "bg-slate-100 text-slate-600"}`}>
              <Icon />
              <span className="truncate">{label}</span>
              <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 ${filter === key ? "bg-white text-blueprimary" : "bg-white"}`}>{count}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex min-h-[16rem] w-full flex-1 flex-col gap-3">
        {visibleItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
            <FaList className="mb-3 text-4xl" />
            <p>{t(query ? "todo.empty.results" : filter === "completed" ? "todo.empty.completed" : filter === "active" ? "todo.empty.inProgress" : "todo.empty.all")}</p>
          </div>
        ) : visibleItems.map((item, index) => {
          const typeImage = sanabelImgs[item.task.type]
            || [sanabelType1Img, sanabelType2Img, sanabelType3Img, sanabelType4Img][Math.max(0, (item.task.categoryId || 1) - 1)];
          return (
            <motion.article key={item.id} data-testid={`todo-card-${item.task.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.2) }} className={`rounded-2xl border p-4 ${item.completed ? "border-green-100 bg-green-50" : "border-slate-200 bg-white"}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                {!isHistorical ? <button type="button" aria-label={t("todo.remove")} onClick={() => setStoredItems((current) => current.filter((candidate) => candidate.id !== item.id))} className="p-2 text-slate-300 hover:text-red-500"><FaTrash /></button> : <span />}
                <span data-testid={`category-chip-${item.task.id}`} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs text-blueprimary">
                  <img src={typeImage} alt="" className="h-5 w-5 object-contain" />
                  {t(item.task.type)}
                </span>
              </div>
              <h3 className="text-start font-semibold text-slate-800">{t(item.task.title)}</h3>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="flex gap-2">{resources(item.task)}</div>
                <button type="button" data-testid={`complete-mission-${item.task.id}`} aria-label={t(item.completed ? "todo.status.completed" : "تأكيد الإنجاز")} aria-pressed={item.completed} disabled={item.completed || isHistorical || isLoading} onClick={() => { setSelectedMissionId(Number(item.id)); setShowConfirmPopup(true); }} className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${item.completed ? "bg-green-500" : "bg-blueprimary disabled:bg-slate-300"}`}>
                  <FaCheck />
                </button>
              </div>
            </motion.article>
          );
        })}
      </main>

      {!isHistorical && (
        <div className="w-full">
          <PrimaryButton style="w-full bg-blueprimary" text={t("todo.addMission")} arrow="none" onClick={() => setShowAddModal(true)} />
        </div>
      )}

      <AddMissionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAddMission={addMission} existingTaskIds={todayItems.map((item) => item.task.id)} />

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5" onClick={() => setShowCalendar(false)}>
          <div role="dialog" aria-label={t("todo.date.select")} className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <Calendar
              className="todo-calendar"
              value={fromDateKey(selectedDate)}
              minDate={fromDateKey(earliestDate)}
              maxDate={fromDateKey(authoritativeToday)}
              onChange={(value) => { if (value instanceof Date) selectDate(toDateKey(value)); }}
              prevLabel={<FaChevronLeft aria-label={t("todo.date.previousMonth")} />}
              nextLabel={<FaChevronRight aria-label={t("todo.date.nextMonth")} />}
              prev2Label={null}
              next2Label={null}
              locale={locale.startsWith("ar") ? "ar-EG" : "en-US"}
            />
            <button type="button" onClick={() => setShowCalendar(false)} className="mt-2 w-full rounded-xl bg-slate-100 py-3">{t("todo.date.cancel")}</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showConfirmPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirmPopup(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(event) => event.stopPropagation()}>
              <h2 className="mb-2 text-xl font-bold">{t("تأكيد الإنجاز")}</h2>
              <p className="mb-6 text-slate-600">{t("هل أنت متأكد من أنك أنجزت هذه المهمة؟")}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowConfirmPopup(false)} className="flex-1 rounded-xl bg-slate-100 py-3">{t("إلغاء")}</button>
                <button type="button" data-testid="confirm-mission-action" onClick={() => void confirmComplete()} disabled={isLoading} className="flex-1 rounded-xl bg-green-500 py-3 text-white disabled:opacity-50">{t("تأكيد")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCongratsPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center">
              <Tickcircle className="mx-auto mb-4 text-5xl text-green-500" />
              <h2 className="mb-5 text-2xl font-bold">{t("🎉 مبروك! 🎉")}</h2>
              <button type="button" onClick={() => setShowCongratsPopup(false)} className="w-full rounded-xl bg-green-500 py-3 text-white">{t("رائع")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {role === "Student" ? <StudentNavbar /> : role === "Teacher" ? <TeacherNavbar /> : <ParentNavbar />}
    </div>
  );
};

const TodoList = () => {
  const { user } = useUserContext();
  return user && !user.classId ? <SoloTodoList /> : <LegacyTodoList />;
};

export default TodoList;
*/
