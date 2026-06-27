import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import FilterIcon from "../../../icons/Leaderboards/FilterIcon";

interface FilterProps {
  onFilterChange: (filters: FilterState) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface FilterState {
  category: string;
  classId: string;
  className?: string; // Add this optional field
  gender: string;
}

interface Category {
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
    category: "",
    classId: "",
    gender: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const genderOptions = [
    { value: "", label: "جميع الطلاب" },
    { value: "male", label: "ذكور" },
    { value: "female", label: "إناث" },
  ];

  // Memoize the fetch functions to prevent recreation on every render
  const fetchCategories = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      if (!authToken) return;

      const response = await axios.get<{ categories: string[] }>(
        userRole === "Teacher"
          ? "https://sanabel.wonderlearn.net/teachers/class-categories"
          : userRole === "Student"
          ? "https://sanabel.wonderlearn.net/students/class-categories"
          : "https://sanabel.wonderlearn.net/parents/class-categories",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200 && response.data.categories) {
        setCategories(
          response.data.categories.map((cat) => ({
            name: cat,
            label: cat,
          })),
        );
        console.log("Fetched categories:", response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchClassesByCategory = useCallback(async (category: string) => {
    setLoadingClasses(true);
    try {
      const authToken = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      if (!authToken) return;

      const response = await axios.get<{ classes: ClassItem[] }>(
        userRole === "Teacher"
          ? `https://sanabel.wonderlearn.net/teachers/classes-by-category?category=${category}`
          : userRole === "Student"
          ? `https://sanabel.wonderlearn.net/students/classes-by-category?category=${category}`
          : `https://sanabel.wonderlearn.net/parents/classes-by-category?category=${category}`,

        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200 && response.data.classes) {
        setClasses(response.data.classes);
        console.log(
          "Fetched classes for category:",
          category,
          response.data.classes,
        );
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch classes when category changes - use the specific value, not the whole object
  useEffect(() => {
    if (filters.category) {
      fetchClassesByCategory(filters.category);
    } else {
      setClasses([]);
    }
  }, [filters.category, fetchClassesByCategory]); // Only depend on the category value

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, [key]: value };

      // Reset class when category changes
      if (key === "category") {
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
      category: "",
      classId: "",
      gender: "",
    };
    setFilters(resetState);
    onFilterChange(resetState);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black">{t("تصفية النتائج")}</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-4 overflow-y-auto">
          <label className="block mb-2 text-sm font-medium text-right text-gray-700">
            {t("المرحلة الدراسية")}
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full p-3 text-right capitalize border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t("جميع المراحل")}</option>
            {categories.map((category) => (
              <option
                key={category.name}
                value={category.name}
                className="capitalize"
              >
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div className="mb-4 overflow-y-auto">
          <label className="block mb-2 text-sm font-medium text-right text-gray-700">
            {t("الفصل الدراسي")}
          </label>
          <select
            value={filters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            disabled={!filters.category || loadingClasses}
            className="w-full p-3 text-right capitalize border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{t("جميع الفصول")}</option>
            {classes.map((classItem) => (
              <option
                key={classItem.id}
                value={classItem.id.toString()}
                className="capitalize"
              >
                {classItem.classname}
              </option>
            ))}
          </select>
          {loadingClasses && (
            <p className="mt-1 text-sm text-right text-gray-500">
              <FilterIcon className="inline mr-1" />
              {t("جارٍ تحميل الفصول...")}
            </p>
          )}
        </div>

        {/* Gender Filter */}
        {/* <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-right text-gray-700">
            {t("النوع")}
          </label>
          <select
            value={filters.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
            className="w-full p-3 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div> */}

        {/* Action Buttons */}
        <div className="flex gap-3 overflow-y-auto">
          <button
            onClick={applyFilters}
            className="flex-1 px-4 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t("تطبيق التصفية")}
          </button>
          <button
            onClick={resetFilters}
            className="flex-1 px-4 py-3 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t("إعادة تعيين")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsFilterModal;
