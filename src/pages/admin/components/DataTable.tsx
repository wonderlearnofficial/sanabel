import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaEdit,
  FaTrash,
  FaKey,
  FaEnvelope,
  FaLink,
  FaChevronUp,
  FaChevronDown,
  FaEllipsisV,
  FaUserGraduate,
} from "react-icons/fa";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";

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

interface DataTableProps {
  activeTab: Tab;
  rows: any[];
  loading: boolean;
  selectedIds: Set<number>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  onEditClick: (row: any) => void;
  onDeleteClick: (row: any) => void;
  onResetPasswordClick: (row: any) => void;
  onImpersonateStudent?: (row: any) => void;
  accentColor: string;
  sortField: string | null;
  sortDir: "asc" | "desc" | null;
  onSort: (field: string) => void;
  search: string;
  gradesList: { id: number; name: string }[];
  organizations: { id: number; name: string }[];
}

const ROLE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  Student: { bg: "#e0f2fe", text: "#0369a1", dot: "#0284c7" },
  Teacher: { bg: "#dcfce7", text: "#15803d", dot: "#16a34a" },
  Parent: { bg: "#fef3c7", text: "#b45309", dot: "#d97706" },
  Admin: { bg: "#f3e8ff", text: "#7e22ce", dot: "#9333ea" },
};

const GRADE_COLORS: Record<string, string> = {
  primary: "#10b981",
  preparatory: "#8b5cf6",
  secondary: "#f59e0b",
};

interface ActionMenuPosition {
  left: number;
  top?: number;
  bottom?: number;
  opensUp: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getUserId = (tab: Tab, row: any): number =>
  tab === "users" || tab === "admins" ? row.id : row.userId ?? row.id;

const getName = (tab: Tab, row: any): string => {
  if (tab === "users" || tab === "admins")
    return `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
  if (tab === "history") {
    const u = row.Student?.user ?? row.Student?.User;
    return `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim();
  }
  return `${row.user?.firstName ?? row.User?.firstName ?? ""} ${
    row.user?.lastName ?? row.User?.lastName ?? ""
  }`.trim();
};

const getEmail = (tab: Tab, row: any): string => {
  if (tab === "users" || tab === "admins") return row.email;
  if (tab === "history") return row.Student?.user?.email ?? row.Student?.User?.email ?? "";
  return row.user?.email ?? row.User?.email ?? "";
};

const getDeleteId = (tab: Tab, row: any): number =>
  tab === "users" || tab === "students" || tab === "teachers" || tab === "parents" || tab === "admins" || tab === "scores"
    ? getUserId(tab, row)
    : row.id;

// ─── Sub-badge Components ───────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string; t: any }> = ({ role, t }) => {
  const s = ROLE_BADGE[role] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: s.bg, color: s.text, borderColor: s.dot + "40" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {t(`admin.role.${role}`)}
    </span>
  );
};

const GradeBadge: React.FC<{ name: string; t: any }> = ({ name, t }) => {
  const color = GRADE_COLORS[name.toLowerCase()] ?? "#6366f1";
  const label =
    t(`admin.grade.${name}`) !== `admin.grade.${name}`
      ? t(`admin.grade.${name}`)
      : name;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{
        background: color + "15",
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
};

const Highlight: React.FC<{ text: string; query: string }> = ({
  text,
  query,
}) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200 text-yellow-900 rounded px-0.5"
          >
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  activeTab,
  rows,
  loading,
  selectedIds,
  setSelectedIds,
  onEditClick,
  onDeleteClick,
  onResetPasswordClick,
  onImpersonateStudent,
  accentColor,
  sortField,
  sortDir,
  onSort,
  search,
  gradesList,
  organizations,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [actionMenuPosition, setActionMenuPosition] =
    useState<ActionMenuPosition | null>(null);

  const getSelId = (row: any) => {
    return activeTab === "users" || activeTab === "admins"
      ? row.id
      : activeTab === "students" || activeTab === "teachers" || activeTab === "parents" || activeTab === "scores"
      ? row.userId ?? row.id
      : row.id;
  };

  const allSelected =
    rows.length > 0 &&
    rows.every((r) => selectedIds.has(getSelId(r)));

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((r) => getSelId(r))));
    } else {
      setSelectedIds(new Set());
    }
  };

  type HeaderDef = { key: string; label: string; sortable?: boolean };
  const getHeaderDefs = (): HeaderDef[] => {
    const chk: HeaderDef = { key: "_check", label: "" };
    const act: HeaderDef = { key: "_actions", label: "admin.th.actions" };
    switch (activeTab) {
      case "scores":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.name", sortable: true },
          { key: "email", label: "admin.th.email" },
          { key: "org", label: "admin.th.organization" },
          { key: "class", label: "admin.th.class" },
          { key: "grade", label: "admin.th.grade" },
          { key: "level", label: isRTL ? "المستوى" : "Level", sortable: true },
          { key: "medal", label: isRTL ? "الميدالية" : "Medal", sortable: true },
          { key: "xp", label: "XP", sortable: true },
          { key: "treeProgress", label: isRTL ? "الشجرة" : "Tree Stage", sortable: true },
          { key: "snabelYellow", label: "🌾 Yellow", sortable: true },
          { key: "snabelBlue", label: "🔹 Blue", sortable: true },
          { key: "snabelRed", label: "🔴 Red", sortable: true },
          { key: "totalSanabel", label: "✨ Total", sortable: true },
          act,
        ];
      case "history":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "createdAt", label: isRTL ? "التاريخ والوقت" : "Date & Time", sortable: true },
          { key: "studentName", label: isRTL ? "الطالب" : "Student", sortable: true },
          { key: "email", label: "admin.th.email" },
          { key: "schoolClass", label: isRTL ? "المدرسة والفصل" : "School / Class" },
          { key: "taskTitle", label: isRTL ? "المهمة" : "Task Title" },
          { key: "taskCategory", label: isRTL ? "التصنيف" : "Category" },
          { key: "rewards", label: isRTL ? "المكافآت" : "Rewards" },
          { key: "approvedBy", label: isRTL ? "الاعتماد" : "Verified By" },
        ];
      case "students":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.name", sortable: true },
          { key: "email", label: "admin.th.email", sortable: true },
          { key: "grade", label: "admin.th.grade" },
          { key: "org", label: "admin.th.organization" },
          { key: "class", label: "admin.th.class" },
          act,
        ];
      case "teachers":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.name", sortable: true },
          { key: "email", label: "admin.th.email", sortable: true },
          { key: "grade", label: "admin.th.grade" },
          { key: "org", label: "admin.th.organization" },
          { key: "class", label: "admin.th.class" },
          act,
        ];
      case "parents":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.name", sortable: true },
          { key: "email", label: "admin.th.email", sortable: true },
          { key: "children", label: "admin.th.childCount" },
          act,
        ];
      case "classes":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "classname", label: "admin.th.className", sortable: true },
          { key: "grade", label: "admin.th.grade" },
          { key: "org", label: "admin.th.organization" },
          { key: "students", label: "admin.th.studentCount", sortable: true },
          act,
        ];
      case "organizations":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.orgName", sortable: true },
          act,
        ];
      case "grades":
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.gradeName", sortable: true },
          { key: "org", label: "admin.th.organization" },
          act,
        ];
      default:
        return [
          chk,
          { key: "id", label: "admin.th.id", sortable: true },
          { key: "name", label: "admin.th.name", sortable: true },
          { key: "email", label: "admin.th.email", sortable: true },
          { key: "role", label: "admin.th.role" },
          { key: "verified", label: "admin.th.verified" },
          { key: "createdAt", label: "admin.th.createdAt", sortable: true },
          act,
        ];
    }
  };

  const headers = getHeaderDefs();

  const renderCells = (row: any) => {
    const name = activeTab === "grades" ? row.name ?? "—" : getName(activeTab, row) || "—";
    const email = getEmail(activeTab, row);
    const initials = (name[0] ?? "?").toUpperCase();
    const avatarBg = `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`;

    switch (activeTab) {
      case "scores":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-[11px] font-bold text-white rounded-full shadow-sm"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <span className="font-semibold text-slate-800">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-slate-500 font-medium text-xs" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          <span className="text-slate-600 font-medium text-xs">
            {row.organization?.name ?? row.Organization?.name ?? (
              <span className="text-slate-300">—</span>
            )}
          </span>,
          <span className="text-slate-600 font-medium text-xs">
            {row.Class?.classname ?? row.class?.classname ?? (
              <span className="text-slate-300">—</span>
            )}
          </span>,
          row.GradeEntity?.name ? (
            <GradeBadge name={row.GradeEntity.name} t={t} />
          ) : row.grade ? (
            <GradeBadge name={row.grade} t={t} />
          ) : (
            <span className="text-slate-300">—</span>
          ),
          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-xs border border-purple-100/80">
            Lvl {row.level || 1}
          </span>,
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100/80">
            🏅 #{row.medal || 1}
          </span>,
          <span className="font-extrabold text-indigo-600 text-xs">
            {row.xp || 0} XP
          </span>,
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-100/80">
            🌳 {t("admin.treeStage")} {row.treeProgress || row.Tree?.stage || 1}
          </span>,
          <span className="font-bold text-amber-600 text-xs">
            🌾 {row.snabelYellow || 0}
          </span>,
          <span className="font-bold text-blue-600 text-xs">
            🔹 {row.snabelBlue || 0}
          </span>,
          <span className="font-bold text-rose-600 text-xs">
            🔴 {row.snabelRed || 0}
          </span>,
          <span className="font-black text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
            ✨ {(row.snabelYellow || 0) + (row.snabelBlue || 0) + (row.snabelRed || 0)}
          </span>,
        ];
      case "history":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            {row.updatedAt || row.createdAt || row.date
              ? new Date(row.updatedAt || row.createdAt || row.date).toLocaleString(
                  isRTL ? "ar-EG" : "en-US",
                  { dateStyle: "short", timeStyle: "short" }
                )
              : "—"}
          </span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-[11px] font-bold text-white rounded-full shadow-sm"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <span className="font-semibold text-slate-800">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-slate-500 font-medium text-xs" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-700">
              {row.Student?.organization?.name || row.Student?.Organization?.name || "—"}
            </span>
            <span className="text-slate-400 font-normal">
              {row.Student?.Class?.classname || "—"}
            </span>
          </div>,
          <span className="font-bold text-slate-800 text-xs">
            <Highlight text={row.Task?.title || "Task"} query={search} />
          </span>,
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
            {row.Task?.category?.title || row.Task?.type || "General"}
          </span>,
          <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
            {row.Task?.xp > 0 && <span className="text-indigo-600">+{row.Task.xp} XP</span>}
            {row.Task?.snabelYellow > 0 && <span className="text-amber-600">+{row.Task.snabelYellow} 🌾</span>}
            {row.Task?.snabelBlue > 0 && <span className="text-blue-600">+{row.Task.snabelBlue} 🔹</span>}
            {row.Task?.snabelRed > 0 && <span className="text-rose-600">+{row.Task.snabelRed} 🔴</span>}
            {!(row.Task?.xp || row.Task?.snabelYellow || row.Task?.snabelBlue || row.Task?.snabelRed) && (
              <span className="text-slate-400 font-normal">—</span>
            )}
          </div>,
          row.Parent?.User || row.Parent?.user ? (
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              👨‍👩‍👧 {(row.Parent.User || row.Parent.user).firstName}
            </span>
          ) : row.Teacher?.User || row.Teacher?.user ? (
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              👨‍🏫 {(row.Teacher.User || row.Teacher.user).firstName}
            </span>
          ) : (
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              ✓ {t("admin.completed")}
            </span>
          ),
        ];
      case "students":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-[11px] font-bold text-white rounded-full"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <span className="font-semibold text-slate-700">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-slate-500 font-medium" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          row.GradeEntity?.name ? (
            <GradeBadge name={row.GradeEntity.name} t={t} />
          ) : row.grade ? (
            <GradeBadge name={row.grade} t={t} />
          ) : (
            <span className="text-slate-300">—</span>
          ),
          <span className="text-slate-500 font-medium">
            {row.organization?.name ?? row.Organization?.name ?? (
              <span className="text-slate-300">—</span>
            )}
          </span>,
          <span className="text-slate-500 font-medium">
            {row.Class?.classname ?? row.class?.classname ?? (
              <span className="text-slate-300">—</span>
            )}
          </span>,
        ];
      case "teachers":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-[11px] font-bold text-white rounded-full"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <span className="font-semibold text-slate-700">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-slate-500 font-medium" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          row.Classes && row.Classes.length > 0 ? (
            <div className="flex flex-col gap-1">
              {Array.from(
                new Set(
                  row.Classes.map((c: any) => c.GradeEntity?.name || c.grade),
                ),
              ).map((grade: any, i) => (
                <GradeBadge key={i} name={grade} t={t} />
              ))}
            </div>
          ) : (
            <span className="text-slate-300">—</span>
          ),
          <span className="text-slate-500 font-medium">
            {row.Organization?.name ?? row.organization?.name ?? (
              <span className="text-slate-300">—</span>
            )}
          </span>,
          row.Classes && row.Classes.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {row.Classes.map((c: any, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-100 rounded-lg"
                >
                  {c.classname}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-300">—</span>
          ),
        ];
      case "parents":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-[11px] font-bold text-white rounded-full"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <span className="font-semibold text-slate-700">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-slate-500 font-medium" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          <span className="font-bold text-slate-700">
            {(row.Students ?? row.students ?? []).length}
          </span>,
        ];
      case "classes":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="font-semibold text-slate-700">{row.classname}</span>,
          row.GradeEntity?.name ? (
            <GradeBadge name={row.GradeEntity.name} t={t} />
          ) : row.grade ? (
            <GradeBadge name={row.grade} t={t} />
          ) : (
            <span className="text-slate-300">—</span>
          ),
          <span className="text-slate-500 font-medium">
            {row.Organization?.name ?? <span className="text-slate-300">—</span>}
          </span>,
          <span className="font-bold text-slate-700">
            {(row.Students ?? []).length}
          </span>,
        ];
      case "organizations":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="font-semibold text-slate-700">{row.name}</span>,
        ];
      case "grades":
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="font-semibold text-slate-700">{row.name}</span>,
          <span className="text-slate-500 font-medium">
            {row.Organization?.name ?? <span className="text-slate-300">—</span>}
          </span>,
        ];
      default:
        return [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-[11px] font-bold text-white rounded-full"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
            <span className="font-semibold text-slate-700">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-slate-500 font-medium" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          <RoleBadge role={row.role} t={t} />,
          row.isAccess ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              {t("Yes")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <span className="w-1 h-1 rounded-full bg-red-400" />
              {t("No")}
            </span>
          ),
          <span className="text-xs text-slate-400 font-medium">
            {row.createdAt
              ? new Date(row.createdAt).toLocaleDateString(
                  i18n.language === "ar" ? "ar-EG" : "en-US",
                )
              : "—"}
          </span>,
        ];
    }
  };

  const getDeleteIdVal = (row: any): number => {
    return getDeleteId(activeTab, row);
  };

  const handleRowSelect = (e: React.ChangeEvent<HTMLInputElement>, selId: number) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (e.target.checked) next.add(selId);
      else next.delete(selId);
      return next;
    });
  };

  const toggleActionMenu = (e: React.MouseEvent, rowId: number) => {
    e.stopPropagation();
    if (activeMenuId === rowId) {
      setActiveMenuId(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 176; // Tailwind w-44
    const estimatedMenuHeight = 230;
    const viewportPadding = 8;
    const preferredLeft = isRTL ? rect.left : rect.right - menuWidth;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      window.innerWidth - menuWidth - viewportPadding,
    );
    const opensUp =
      rect.bottom + estimatedMenuHeight > window.innerHeight &&
      rect.top > estimatedMenuHeight;

    setActionMenuPosition({
      left,
      opensUp,
      ...(opensUp
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
    setActiveMenuId(rowId);
  };

  const closeActionMenu = () => {
    setActiveMenuId(null);
    setActionMenuPosition(null);
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right" dir={isRTL ? "rtl" : "ltr"}>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer border-slate-300 accent-blueprimary focus:ring-blueprimary/20"
                />
              </th>
              {headers.slice(1).map((h, idx) => (
                <th
                  key={idx}
                  onClick={h.sortable ? () => onSort(h.key) : undefined}
                  className={`px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider ${
                    isRTL ? "text-right" : "text-left"
                  } ${h.sortable ? "cursor-pointer hover:text-slate-600 select-none" : ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{h.label ? t(h.label) : ""}</span>
                    {h.sortable && (
                      <span className="flex flex-col gap-0">
                        <FaChevronUp
                          size={7}
                          style={{
                            color: sortField === h.key && sortDir === "asc" ? accentColor : "#cbd5e1",
                          }}
                        />
                        <FaChevronDown
                          size={7}
                          style={{
                            color: sortField === h.key && sortDir === "desc" ? accentColor : "#cbd5e1",
                          }}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {loading ? (
              <SkeletonLoader cols={headers.length} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-12">
                  <EmptyState
                    title={t("admin.empty")}
                    description={t("admin.empty.description")}
                    accentColor={accentColor}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const selId = getSelId(row);
                const isSelected = selectedIds.has(selId);
                const name = activeTab === "grades" ? row.name ?? "—" : getName(activeTab, row) || "—";
                const email = getEmail(activeTab, row);
                const isUserType =
                  activeTab === "users" ||
                  activeTab === "students" ||
                  activeTab === "teachers" ||
                  activeTab === "parents" ||
                  activeTab === "admins";

                return (
                  <motion.tr
                    key={`${activeTab}-${row.id}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.015 }}
                    onClick={() => onEditClick(row)}
                    className={`group hover:bg-slate-50/50 cursor-pointer transition-all ${
                      isSelected ? "bg-blueprimary/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(e, selId)}
                        className="w-4 h-4 rounded cursor-pointer border-slate-300 accent-blueprimary focus:ring-blueprimary/20"
                      />
                    </td>

                    {/* Data Cells */}
                    {renderCells(row).map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-4 py-3.5 text-sm ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}

                    {/* Row Actions Dropdown */}
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => toggleActionMenu(e, row.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <FaEllipsisV size={12} />
                        </button>

                        {activeMenuId === row.id &&
                          actionMenuPosition &&
                          createPortal(
                            <>
                              {/* Backdrop to close dropdown */}
                              <div
                                className="fixed inset-0 z-[90]"
                                onClick={closeActionMenu}
                              />
                              <motion.div
                                initial={{
                                  opacity: 0,
                                  scale: 0.96,
                                  y: actionMenuPosition.opensUp ? 8 : -8,
                                }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.14 }}
                                style={{
                                  left: actionMenuPosition.left,
                                  top: actionMenuPosition.top,
                                  bottom: actionMenuPosition.bottom,
                                  backgroundColor: "#ffffff",
                                }}
                                className={`fixed z-[100] isolate w-44 bg-white opacity-100 border border-slate-200 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 ${
                                  actionMenuPosition.opensUp
                                    ? "origin-bottom"
                                    : "origin-top"
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    onEditClick(row);
                                    closeActionMenu();
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors text-right w-full"
                                >
                                  <FaEdit size={12} className="text-slate-400" />
                                  <span>{t("تعديل")}</span>
                                </button>

                                {Boolean((activeTab === "students" || activeTab === "scores" || (activeTab === "users" && row.role === "Student")) && onImpersonateStudent) && (
                                  <button
                                    onClick={() => {
                                      onImpersonateStudent!(row);
                                      closeActionMenu();
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors text-right w-full"
                                  >
                                    <FaUserGraduate size={12} className="text-cyan-600" />
                                    <span>{t("admin.impersonate.button")}</span>
                                  </button>
                                )}

                                {isUserType && (
                                  <button
                                    onClick={() => {
                                      onResetPasswordClick(row);
                                      closeActionMenu();
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors text-right w-full"
                                  >
                                    <FaKey size={12} />
                                    <span>{t("admin.reset.title")}</span>
                                  </button>
                                )}

                                {email && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(email);
                                      toast.success(t("admin.action.copied"));
                                      closeActionMenu();
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors text-right w-full"
                                  >
                                    <FaEnvelope size={12} className="text-slate-400" />
                                    <span>{t("admin.action.copyEmail")}</span>
                                  </button>
                                )}

                                {activeTab === "students" && row.connectCode && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(row.connectCode);
                                      toast.success(t("admin.action.copied"));
                                      closeActionMenu();
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition-colors text-right w-full"
                                  >
                                    <FaLink size={12} />
                                    <span>{t("admin.action.copyCode")}</span>
                                  </button>
                                )}

                                <div className="h-px bg-slate-100 my-1" />

                                <button
                                  onClick={() => {
                                    onDeleteClick(row);
                                    closeActionMenu();
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-right w-full"
                                >
                                  <FaTrash size={12} />
                                  <span>{t("admin.delete.confirm")}</span>
                                </button>
                              </motion.div>
                            </>,
                            document.body,
                          )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
