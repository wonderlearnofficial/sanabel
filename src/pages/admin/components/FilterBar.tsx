import React from "react";
import { useTranslation } from "react-i18next";
import { FaSearch, FaTimes } from "react-icons/fa";

type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades";

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeTab: Tab;
  filterGradeId: string;
  setFilterGradeId: (val: string) => void;
  filterOrgId: string;
  setFilterOrgId: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  filterVerified: boolean;
  setFilterVerified: (val: boolean) => void;
  gradesList: { id: number; name: string }[];
  organizations: { id: number; name: string }[];
  accentColor: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  activeTab,
  filterGradeId,
  setFilterGradeId,
  filterOrgId,
  setFilterOrgId,
  filterRole,
  setFilterRole,
  filterVerified,
  setFilterVerified,
  gradesList,
  organizations,
  accentColor,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const showGrade = activeTab === "students" || activeTab === "classes";
  const showOrg =
    activeTab === "students" ||
    activeTab === "teachers" ||
    activeTab === "classes" ||
    activeTab === "grades";
  const showRole = activeTab === "users";
  const showVerified = activeTab === "users";

  const hasActiveFilters =
    filterGradeId || filterOrgId || filterRole || filterVerified;

  const handleClearAll = () => {
    setFilterGradeId("");
    setFilterOrgId("");
    setFilterRole("");
    setFilterVerified(false);
  };

  const getActiveChips = () => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (filterGradeId) {
      const g = gradesList.find((x) => String(x.id) === filterGradeId);
      chips.push({
        key: "grade",
        label: `${t("admin.filter.grade")}: ${g ? g.name : filterGradeId}`,
        onClear: () => setFilterGradeId(""),
      });
    }

    if (filterOrgId) {
      const o = organizations.find((x) => String(x.id) === filterOrgId);
      chips.push({
        key: "org",
        label: `${t("admin.filter.school")}: ${o ? o.name : filterOrgId}`,
        onClear: () => setFilterOrgId(""),
      });
    }

    if (filterRole) {
      chips.push({
        key: "role",
        label: `${t("admin.filter.role")}: ${t(`admin.role.${filterRole}`)}`,
        onClear: () => setFilterRole(""),
      });
    }

    if (filterVerified) {
      chips.push({
        key: "verified",
        label: t("admin.th.verified"),
        onClear: () => setFilterVerified(false),
      });
    }

    return chips;
  };

  const chips = getActiveChips();

  return (
    <div className="flex flex-col gap-4 mb-5">
      {/* Inputs Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${
              isRTL ? "right-4" : "left-4"
            }`}
          >
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            placeholder={t("Search users, emails, IDs...")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full py-2.5 bg-white border border-slate-200 text-slate-800 outline-none rounded-2xl focus:border-blueprimary focus:ring-4 focus:ring-blueprimary/10 transition-all text-sm ${
              isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
            }`}
          />
        </div>

        {/* Dropdown Selects */}
        <div className="flex flex-wrap items-center gap-2">
          {showGrade && (
            <select
              value={filterGradeId}
              onChange={(e) => setFilterGradeId(e.target.value)}
              className="px-4 py-2.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-100"
            >
              <option value="">{t("Grade: All")}</option>
              {gradesList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {showOrg && (
            <select
              value={filterOrgId}
              onChange={(e) => setFilterOrgId(e.target.value)}
              className="px-4 py-2.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-100"
            >
              <option value="">{t("School: All")}</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}

          {showRole && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-100"
            >
              <option value="">{t("Role: All")}</option>
              {["Student", "Teacher", "Parent", "Admin"].map((r) => (
                <option key={r} value={r}>
                  {t(`admin.role.${r}`)}
                </option>
              ))}
            </select>
          )}

          {showVerified && (
            <button
              onClick={() => setFilterVerified(!filterVerified)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                filterVerified
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t("Verified Only")}
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
            >
              <span>{chip.label}</span>
              <button
                onClick={chip.onClear}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes size={10} />
              </button>
            </span>
          ))}

          <button
            onClick={handleClearAll}
            className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline transition-colors px-2 py-1"
          >
            {t("Clear Filters")}
          </button>
        </div>
      )}
    </div>
  );
};
