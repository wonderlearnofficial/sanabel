import { API_BASE_URL } from "../../../config/api";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FiChevronDown } from "react-icons/fi";

interface FilterProps {
  onFilterChange: (filters: FilterState) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface FilterState {
  grade: string;
  classId: string;
  className?: string;
  gender: string;
}

interface GradeOption {
  name: string;
  label: string;
}

interface ClassItem {
  id: number;
  classname: string;
}

const LeaderboardsFilterModal: React.FC<FilterProps> = ({
  onFilterChange,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>({
    grade: "",
    classId: "",
    gender: "",
  });

  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const fetchGrades = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      if (!authToken) return;

      interface GradeApiResponse {
        id: number | null;
        name: string;
      }

      const response = await axios.get<{ grades: GradeApiResponse[] }>(
        userRole === "Teacher"
          ? `${API_BASE_URL}/teachers/class-grades`
          : userRole === "Student"
          ? `${API_BASE_URL}/students/class-grades`
          : `${API_BASE_URL}/parents/class-grades`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200 && response.data.grades) {
        setGrades(
          response.data.grades.map((g) => ({
            name: g.name,
            label: t(g.name),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  }, [t]);

  const fetchClassesByGrade = useCallback(async (grade: string) => {
    setLoadingClasses(true);
    try {
      const authToken = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      if (!authToken) return;

      const response = await axios.get<{ classes: ClassItem[] }>(
        userRole === "Teacher"
          ? `${API_BASE_URL}/teachers/classes-by-grade?grade=${grade}`
          : userRole === "Student"
          ? `${API_BASE_URL}/students/classes-by-grade?grade=${grade}`
          : `${API_BASE_URL}/parents/classes-by-grade?grade=${grade}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200 && response.data.classes) {
        setClasses(response.data.classes);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  useEffect(() => {
    if (filters.grade) {
      fetchClassesByGrade(filters.grade);
    } else {
      setClasses([]);
    }
  }, [filters.grade, fetchClassesByGrade]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, [key]: value };
      if (key === "grade") {
        newFilters.classId = "";
      }
      return newFilters;
    });
  };

  const applyFilters = () => {
    const selectedClass = classes.find(
      (cls) => cls.id.toString() === filters.classId,
    );
    const filtersWithClassName = {
      ...filters,
      className: selectedClass ? selectedClass.classname : undefined,
    };
    onFilterChange(filtersWithClassName);
    onClose();
  };

  const resetFilters = () => {
    const resetState = {
      grade: "",
      classId: "",
      gender: "",
    };
    setFilters(resetState);
    onFilterChange(resetState);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col gap-5"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <IoMdClose size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 text-end">{t("تصفية النتائج")}</h2>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4">
          {/* Grade Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 text-end">
              {t("المرحلة الدراسية")}
            </label>
            <div className="relative">
              <select
                value={filters.grade}
                onChange={(e) => handleFilterChange("grade", e.target.value)}
                className="w-full py-3.5 ps-4 pe-10 text-base text-start capitalize border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blueprimary focus:border-blueprimary appearance-none bg-white text-gray-800 shadow-sm transition-all outline-none"
              >
                <option value="">{t("جميع المراحل")}</option>
                {grades.map((grade) => (
                  <option key={grade.name} value={grade.name}>
                    {grade.label}
                  </option>
                ))}
              </select>
              <div className="absolute top-1/2 end-3 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Class Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 text-end">
              {t("الفصل الدراسي")}
            </label>
            <div className="relative">
              <select
                value={filters.classId}
                onChange={(e) => handleFilterChange("classId", e.target.value)}
                disabled={!filters.grade || loadingClasses}
                className="w-full py-3.5 ps-4 pe-10 text-base text-start capitalize border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blueprimary focus:border-blueprimary appearance-none bg-white text-gray-800 shadow-sm transition-all outline-none disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">{t("جميع الفصول")}</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id.toString()}>
                    {classItem.classname}
                  </option>
                ))}
              </select>
              <div className="absolute top-1/2 end-3 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FiChevronDown size={20} />
              </div>
            </div>
            {loadingClasses && (
              <p className="text-xs text-end text-blueprimary animate-pulse">
                {t("جارٍ تحميل الفصول...")}
              </p>
            )}
          </div>
        </div>

        {/* Buttons Footer */}
        <div className="flex gap-3 mt-2">
          <motion.button
            onClick={resetFilters}
            className="flex-1 py-3.5 font-bold text-gray-600 bg-gray-100 rounded-2xl text-center hover:bg-gray-200 transition-colors shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t("إعادة تعيين")}
          </motion.button>
          <motion.button
            onClick={applyFilters}
            className="flex-1 py-3.5 font-bold text-white bg-blueprimary rounded-2xl text-center hover:bg-blueprimary/90 transition-colors shadow-md shadow-blueprimary/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t("تطبيق التصفية")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LeaderboardsFilterModal;
