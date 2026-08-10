import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaDownload,
  FaUpload,
  FaGlobe,
} from "react-icons/fa";

type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades"
  | "scores"
  | "history";

interface AdminHeaderProps {
  activeTab: Tab;
  total: number;
  createLabel: string;
  onCreateClick: () => void;
  onExportClick: () => void;
  onImportClick: () => void;
  onLanguageToggle: () => void;
  exporting: boolean;
  accentColor: string;
  isImportable?: boolean;
}

const TAB_I18N: Record<Tab, string> = {
  users: "admin.tab.users",
  students: "admin.tab.students",
  teachers: "admin.tab.teachers",
  parents: "admin.tab.parents",
  admins: "admin.tab.admins",
  classes: "admin.tab.classes",
  organizations: "admin.tab.organizations",
  grades: "admin.tab.grades",
  scores: "admin.tab.scores",
  history: "admin.tab.history",
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  total,
  createLabel,
  onCreateClick,
  onExportClick,
  onImportClick,
  onLanguageToggle,
  exporting,
  accentColor,
  isImportable = false,
}) => {
  const { t } = useTranslation();

  const getSubDescription = (): string => {
    switch (activeTab) {
      case "scores":
        return t("Monitor student scores, XP, level, medal, tree progress, and sanabel counts.");
      case "history":
        return t("View recent student task completion history and rewards granted.");
      case "users":
        return t("Manage every user inside your platform.");
      case "students":
        return t("Monitor student records and credentials.");
      case "teachers":
        return t("Assign and manage classrooms for teachers.");
      case "parents":
        return t("Review parent link codes and family links.");
      case "admins":
        return t("Manage system administrator level access.");
      case "classes":
        return t("Create and modify classes and grades.");
      case "organizations":
        return t("Configure schools and organizations.");
      case "grades":
        return t("Manage learning grades and academic streams.");
      default:
        return "";
    }
  };

  return (
    <header className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-5 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {t(TAB_I18N[activeTab])}
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          {getSubDescription()}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Language Toggle */}
        <button
          onClick={onLanguageToggle}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
        >
          <FaGlobe size={12} className="text-slate-400" />
          <span>{t("admin.languageToggle")}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExportClick}
          disabled={exporting}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
        >
          <FaDownload size={12} className="text-slate-400" />
          <span>{t("admin.export.button")}</span>
        </button>

        {/* Import Button */}
        <button
          data-guide-id="admin-import"
          onClick={onImportClick}
          disabled={!isImportable}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaUpload size={12} className="text-slate-400" />
          <span>{t("admin.import.button")}</span>
        </button>

        {/* Create Primary Button */}
        {createLabel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 12px ${accentColor}25`,
            }}
          >
            <FaPlus size={10} />
            <span>{createLabel}</span>
          </motion.button>
        )}
      </div>
    </header>
  );
};
