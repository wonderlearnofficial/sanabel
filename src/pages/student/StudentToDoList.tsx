import { API_BASE_URL } from "../../config/api";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { AudioManager } from "../../utils/AudioManager";

import TeacherNavbar from "../../components/navbar/TeacherNavbar";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import ParentNavbar from "../../components/navbar/ParentNavbar";
import SearchIcon from "../../icons/SearchIcon";
import GoBackButton from "../../components/GoBackButton";
import PrimaryButton from "../../components/PrimaryButton";
import { FaCheck, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import Tickcircle from "../../icons/Sanabel/Tickcircle";
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
  addedDate: string;
}

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
    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    try {
      setLoading(true);
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
    const authToken = localStorage.getItem("token");
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
        // Extract unique types
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
    const authToken = localStorage.getItem("token");
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
      <div className="flex flex-col w-11/12 max-w-2xl max-h-[90vh] bg-white rounded-xl p-5 shadow-xl">
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
              <h3 className="mb-3 text-lg font-semibold text-right text-black">
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
                <h3 className="text-lg font-semibold text-right text-black">
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
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blueprimary font-bold">
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
                          <h3 className="text-sm font-bold text-right text-black" dir="rtl">
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
                      <p className="text-xs font-bold text-gray-500 text-right mb-1">
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
                            <h3 className="text-sm font-medium text-right text-gray-600" dir="rtl">
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

const TodoList = () => {
  const { t } = useTranslation();
  const { user, refreshUserData, mutateStudent } = useUserContext();
  const [storedItems, setTodoItems] = useState<TodoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

  // State to manage the confirmation popup for marking complete
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(
    null,
  );
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const role = localStorage.getItem("role");

  const grade = user?.grade;

  const canAssignTask = user?.canAssignTask;
  const isPersonal = !user?.classId;

  const submitting = useRef(false);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  // Local storage owns selection only. Completion always comes from StudentTask.
  const todoItems = storedItems.map(item => ({
    ...item,
    completed: user?.completedTasks?.taskIds.includes(Number(item.task.id)) ?? false,
  }));

  useEffect(() => {
    if (!user) return;
    try {
      const key = `sanabel:todos:${user.id}`;
      let selections = localStorage.getItem(key);
      // Adopt the legacy shared selection list once for the signed-in user.
      // Its cached completion flags are deliberately never trusted.
      if (selections === null && !localStorage.getItem("sanabel:legacy-todos-migrated")) {
        selections = localStorage.getItem("todoList");
        if (selections) localStorage.setItem(key, selections);
        localStorage.setItem("sanabel:legacy-todos-migrated", String(user.id));
      }
      const saved = JSON.parse(selections || "[]");
      setTodoItems(Array.isArray(saved) ? saved : []);
    } catch {
      setTodoItems([]);
    }
    setLoadedFor(user.id);
    void refreshUserData();
  }, [user?.id, refreshUserData]);

  useEffect(() => {
    if (!user || loadedFor !== user.id) return;
    try {
      localStorage.setItem(`sanabel:todos:${user.id}`, JSON.stringify(storedItems.map(item => ({ ...item, completed: false }))));
    } catch {
      // Selections remain usable in memory when browser storage is unavailable.
    }
  }, [storedItems, user?.id, loadedFor]);

  const addMission = (task: Task) => {
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
      const response = await mutateStudent("mission", {
        taskId: selectedMissionId, time: getCurrentTime(),
      });

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
    }
  };

  const deleteTodo = (id: number) => {
    setTodoItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      return updated;
    });
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

  // Filter todos based on search and completion status
  const filteredTodos = todoItems.filter((item) => {
    const matchesSearch =
      item.task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(item.task.title).toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "completed") return matchesSearch && item.completed;
    if (filter === "pending") return matchesSearch && !item.completed;
    return matchesSearch;
  });

  const getStats = () => {
    const total = todoItems.length;
    const completed = todoItems.filter((item) => item.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  const stats = getStats();

  return (
    <div
      className="flex flex-col items-center justify-between gap-5 p-4 overflow-y-auto"
      id="page-height"
    >
      {/* Header */}
      <div className="flex-col w-full gap-3 flex-center">
        <div className="flex flex-row-reverse items-center justify-between w-full">
          <div className="w-16 h-16"></div>
          <h1 className="text-2xl font-bold text-black" dir="ltr">
            {t("قائمة المهام")}
          </h1>
          <GoBackButton />
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
          <input
            type="text"
            placeholder={t("ابحث عن مهمة")}
            className="w-full py-3 text-black bg-transparent drop-shadow-sm text-start"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
            <SearchIcon className="text-white" size={20} />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex w-full gap-2 flex-center">
          <div
            className={`flex-center py-2 w-1/3 px-4 gap-1 rounded-xl text-sm font-medium cursor-pointer ${
              filter === "all"
                ? "bg-blueprimary text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter("all")}
          >
            {t("الكل")}
            <span className="w-4 h-4 bg-white rounded-full flex-center text-blueprimary">
              {stats.total}
            </span>
          </div>
          <div
            className={`flex-center py-2 w-1/3 px-4 gap-1 rounded-xl text-sm font-medium cursor-pointer ${
              filter === "pending"
                ? "bg-blueprimary text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter("pending")}
          >
            {t("معلقة")}
            <span className="w-4 h-4 bg-white rounded-full flex-center text-blueprimary">
              {stats.pending}
            </span>
          </div>
          <div
            className={`flex-center py-2 w-1/3 px-4 gap-1 rounded-xl text-sm font-medium cursor-pointer ${
              filter === "completed"
                ? "bg-blueprimary text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter("completed")}
          >
            {t("مكتملة")}
            <span className="w-4 h-4 bg-white rounded-full flex-center text-blueprimary">
              {stats.completed}
            </span>
          </div>
        </div>
      </div>

      {/* Todo List */}
      <div className="flex flex-col justify-start w-full h-full gap-3 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="mb-4 text-6xl">📝</div>
            <div className="text-lg font-medium">{t("لا توجد مهام")}</div>
            <div className="text-sm">
              {t("اضغط على زر الإضافة لإنشاء مهمة جديدة")}
            </div>
          </div>
        ) : (
          filteredTodos.map((item: TodoItem, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`border-2 rounded-xl p-3 ${
                item.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between w-full h-full overflow-y-auto">
                <div className="flex-1 ">
                  <div className="flex items-center justify-between w-full h-full">
                    <button
                      onClick={() => deleteTodo(item.id)}
                      className="flex items-center justify-center w-6 h-6 text-white bg-red-500 rounded-full hover:bg-red-600"
                    >
                      <FaTrash size={10} />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {t(item.task.type)}
                      </span>
                    </div>

                    {(isPersonal || !grade || canAssignTask) && (
                        <button
                          type="button"
                          aria-label={t(item.completed ? "مكتملة" : "تأكيد الإنجاز")}
                          aria-pressed={item.completed}
                          disabled={item.completed || isLoading || !user}
                          data-testid={`complete-mission-${item.task.id}`}
                          data-guide-id="mission-action"
                          onClick={() =>
                            handleToggleCompleteClick(item.task.id)
                          }
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            item.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-green-500"
                          }`}
                        >
                          {item.completed && <FaCheck size={12} />}
                        </button>
                      )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex w-1/4 gap-1">
                      {renderResources(item.task)}
                    </div>
                    <h3
                      className={`font-medium text-sm ${
                        item.completed ? "text-gray-500" : "text-black"
                      }`}
                    >
                      {t(item.task.title)}
                    </h3>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Mission Button */}
      <div className="w-full">
        <PrimaryButton
          style="w-full bg-blueprimary"
          text={t("إضافة مهمة جديدة")}
          arrow="none"
          onClick={() => setShowAddModal(true)}
        />
      </div>

      {/* Add Mission Modal */}
      <AddMissionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddMission={addMission}
        existingTaskIds={todoItems.map((item) => item.task.id)}
      />

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
              exit={{ scale: 0.5, opacity: 0 }}
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
                <p className="mb-6 text-gray-600">
                  {t("هل أنت متأكد من أنك أنجزت هذه المهمة؟")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmPopup(false)}
                    className="flex-1 px-4 py-2 font-medium text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    {t("إلغاء")}
                  </button>
                  <button
                    onClick={confirmMarkComplete}
                    disabled={isLoading}
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
        {showCongratsPopup && (
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

export default TodoList;
