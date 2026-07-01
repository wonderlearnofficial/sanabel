import { API_BASE_URL } from "../../config/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

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
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddMission: (task: Task) => void;
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
      const response = await axios.get(
        `${API_BASE_URL}/students/tasks-category`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      const response = await axios.get(
        `${API_BASE_URL}/students/appear-Taskes-Type/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        // Extract unique types
        const uniqueTypes: string[] = [];
        response.data.data.forEach((task: { type: string }) => {
          if (!uniqueTypes.includes(task.type)) {
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
      }
    } catch (error) {
      console.error("Error fetching types:", error);
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
      const response = await axios.get(
        `${API_BASE_URL}/students/appear-Taskes-Type-Category/${categoryId}/${type}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        setFilteredTasks(response.data.tasks);
        setSelectedTaskId(null);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeImage = (type: any) => {
    // You'll need to implement this based on your sanabelImgs structure
    // This is a placeholder - replace with your actual image mapping logic
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
        <h1 className="text-xs text-black">{resource.value}</h1>
      </div>
    ));

  const handleAddMission = () => {
    const selectedTask = filteredTasks.find(
      (task) => task.id === selectedTaskId,
    );

    if (selectedTask) {
      if (typeof selectedTask.id !== "number") {
        console.error("Task missing valid ID:", selectedTask);
        alert(t("خطأ: المهمة لا تحتوي على معرف صحيح"));
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
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl p-5">
        <h2 className="mb-4 text-xl font-bold text-center text-black">
          {t("إضافة مهمة جديدة")}
        </h2>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">{t("جاري التحميل...")}</div>
          </div>
        )}

        {/* Category Selection */}
        {!loading && selectedCategoryId === null && (
          <div className="mb-4">
            <h3 className="mb-3 text-lg font-semibold text-right text-black">
              {t("اختر الفئة")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex flex-col items-center p-3 overflow-y-auto border-2 cursor-pointer rounded-xl hover:border-blueprimary"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <img
                    src={sanabelTypeImg[index]}
                    alt={category.category}
                    className="object-contain w-16 h-16"
                  />
                  <h3
                    className={`${colors[index]} text-black font-bold text-center mt-2 text-sm`}
                  >
                    {t(category.title)}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type Selection */}
        {!loading && selectedCategoryId !== null && selectedType === null && (
          <div className="mb-4">
            <h3 className="mb-3 text-lg font-semibold text-right text-black">
              {t("اختر النوع")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableTypes.map((typeObj, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-3 border-2 cursor-pointer rounded-xl hover:border-blueprimary"
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
        {!loading && selectedType !== null && (
          <div className="mb-4">
            <h3 className="mb-3 text-lg font-semibold text-black">
              {t("اختر المهمة")}
            </h3>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
              {filteredTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className={`border-2 rounded-xl p-3 cursor-pointer ${
                    selectedTaskId === task.id
                      ? "border-blueprimary bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex w-3/4 gap-2">
                      {renderResources(task)}
                    </div>
                    <h3 className="text-sm font-medium text-right text-black">
                      {t(task.title)}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full gap-3 mt-4">
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
  const { user, refreshUserData } = useUserContext();
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
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

  const grade = String(user?.grade);

  const canAssignTask = user?.canAssignTask;

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("todoList");
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodoItems(parsedTodos);
      } catch (error) {
        console.error("Error parsing saved todos:", error);
        localStorage.removeItem("todoList");
      }
    }
  }, []);

  // Save todos to localStorage whenever todoItems changes
  useEffect(() => {
    if (todoItems.length > 0) {
      localStorage.setItem("todoList", JSON.stringify(todoItems));
    } else {
      localStorage.removeItem("todoList");
    }
  }, [todoItems]);

  const addMission = (task: Task) => {
    const newTodoItem: TodoItem = {
      id: task.id,
      task: task,
      completed: false,
      addedDate: new Date().toISOString(),
    };
    setTodoItems((prev) => {
      const updated = [...prev, newTodoItem];
      return updated;
    });
  };

  const handleToggleCompleteClick = (todoItemId: number) => {
    const selectedItem = todoItems.find((item) => item.id === todoItemId);
    if (selectedItem?.completed) return; // Don't do anything if already completed

    setSelectedMissionId(todoItemId);
    setShowConfirmPopup(true);
  };

  useEffect(() => {
    const savedTodos = localStorage.getItem("todoList");
    const lastReset = localStorage.getItem("lastResetDate");

    const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

    if (lastReset !== today && savedTodos) {
      try {
        const parsedTodos: TodoItem[] = JSON.parse(savedTodos);

        // Reset all tasks to uncompleted
        const resetTodos = parsedTodos.map((item) => ({
          ...item,
          completed: false,
        }));

        setTodoItems(resetTodos);
        localStorage.setItem("todoList", JSON.stringify(resetTodos));
        localStorage.setItem("lastResetDate", today);
      } catch (error) {
        console.error("Error parsing/resetting todos:", error);
        localStorage.removeItem("todoList");
      }
    } else if (savedTodos) {
      try {
        setTodoItems(JSON.parse(savedTodos));
      } catch (error) {
        console.error("Error parsing todos:", error);
        localStorage.removeItem("todoList");
      }
    } else {
      localStorage.setItem("lastResetDate", today);
    }
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toISOString();
  };

  const confirmMarkComplete = async () => {
    if (selectedMissionId === null) return;

    setIsLoading(true);
    const authToken = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/students/add-pros`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            taskId: selectedMissionId,
            studentIds: [user?.id],
            time: getCurrentTime(),
          }),
        },
      );

      if (response.ok) {
        setTodoItems((prev) =>
          prev.map((item) =>
            item.id === selectedMissionId ? { ...item, completed: true } : item,
          ),
        );

        // Refresh the user context so inventory/xp reflect the new totals
        await refreshUserData();

        setShowConfirmPopup(false);
        setShowCongratsPopup(true);
      } else {
        const errorData = await response.json();
        console.error("Failed to mark mission complete:", errorData);
        alert(
          t(
            `فشل في تحديد المهمة كمكتملة: ${
              errorData.message || response.statusText
            }`,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking mission complete:", error);
      alert(t("حدث خطأ أثناء تحديد المهمة كمكتملة."));
    } finally {
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
              <div className="flex items-start justify-between w-full overflow-y-auto">
                <div className="flex-1">
                  <div className="flex items-center justify-between w-full">
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

                    {item.task.completionStatus !== "Completed" &&
                      (!grade || canAssignTask) && (
                        <div
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
                        </div>
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
