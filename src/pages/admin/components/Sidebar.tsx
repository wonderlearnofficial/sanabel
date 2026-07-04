import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaChild,
  FaChalkboardTeacher,
  FaUserFriends,
  FaUserShield,
  FaSchool,
  FaBuilding,
  FaGraduationCap,
  FaSignOutAlt,
  FaQuestionCircle,
} from "react-icons/fa";
import { useAutoStartGuide } from "../../../guides/useAutoStartGuide";
import { useGuide } from "../../../guides/GuideProvider";

type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
  totalCounts: Record<Tab, number>;
  accentColor: string;
}

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  users: <FaUsers size={16} />,
  students: <FaChild size={16} />,
  teachers: <FaChalkboardTeacher size={16} />,
  parents: <FaUserFriends size={16} />,
  admins: <FaUserShield size={16} />,
  classes: <FaSchool size={16} />,
  organizations: <FaBuilding size={16} />,
  grades: <FaGraduationCap size={16} />,
};

const TAB_I18N: Record<Tab, string> = {
  users: "admin.tab.users",
  students: "admin.tab.students",
  teachers: "admin.tab.teachers",
  parents: "admin.tab.parents",
  admins: "admin.tab.admins",
  classes: "admin.tab.classes",
  organizations: "admin.tab.organizations",
  grades: "admin.tab.grades",
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  totalCounts,
  accentColor,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { replayGuide } = useGuide();
  useAutoStartGuide("admin-home", true);

  const renderTabButton = (tabKey: Tab) => {
    const isActive = activeTab === tabKey;
    return (
      <button
        key={tabKey}
        onClick={() => onTabChange(tabKey)}
        className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-start transition-all duration-200 w-full group ${
          isActive
            ? "bg-white/10 text-white font-medium shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute inset-y-2 start-0 w-1 rounded-full"
            style={{ backgroundColor: accentColor }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <span
          className={`flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 transition-colors ${
            isActive
              ? "bg-white/10"
              : "bg-white/5 group-hover:bg-white/10"
          }`}
          style={{ color: isActive ? accentColor : undefined }}
        >
          {TAB_ICONS[tabKey]}
        </span>
        <span className="flex-1 text-sm">{t(TAB_I18N[tabKey])}</span>
        {totalCounts[tabKey] > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
              isActive ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"
            }`}
          >
            {totalCounts[tabKey]}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className="flex flex-col min-h-screen w-64 shrink-0 bg-slate-950 border-slate-900"
      style={{
        borderRightWidth: isRTL ? 0 : "1px",
        borderLeftWidth: isRTL ? "1px" : 0,
      }}
    >
      {/* Brand Header */}
      <div className="px-6 py-6 flex flex-col gap-4 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 text-white rounded-xl shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            <FaUsers size={16} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-white">
              {t("admin.userDataTitle")}
            </h1>
            <p className="text-xs text-slate-500 font-medium">Sanabel Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Group: People */}
        <div className="space-y-1.5" data-guide-id="admin-tabs">
          <p className="px-3.5 text-[10px] font-bold tracking-wider uppercase text-slate-500">
            {t("People")}
          </p>
          <div className="space-y-1">
            {renderTabButton("users")}
            {renderTabButton("students")}
            {renderTabButton("teachers")}
            {renderTabButton("parents")}
            {renderTabButton("admins")}
          </div>
        </div>

        {/* Group: Academics */}
        <div className="space-y-1.5">
          <p className="px-3.5 text-[10px] font-bold tracking-wider uppercase text-slate-500">
            {t("Academics")}
          </p>
          <div className="space-y-1">
            {renderTabButton("organizations")}
            {renderTabButton("classes")}
            {renderTabButton("grades")}
          </div>
        </div>
      </div>

      {/* Footer System Panel */}
      <div className="p-4 space-y-2 border-t border-slate-900">
        <button
          onClick={() => replayGuide("admin-home")}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors border border-transparent"
        >
          <FaQuestionCircle size={14} />
          <span>{t("مساعدة هذه الصفحة")}</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
        >
          <FaSignOutAlt size={14} />
          <span>{t("تسجيل الخروج")}</span>
        </button>
      </div>
    </aside>
  );
};
