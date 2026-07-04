import { API_BASE_URL } from "../../config/api";
import ImportWizard from "./import/ImportWizard";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  FaUsers,
  FaChild,
  FaChalkboardTeacher,
  FaUserFriends,
  FaUserShield,
  FaKey,
  FaPlus,
  FaTimes,
  FaCopy,
  FaEdit,
  FaTrash,
  FaSchool,
  FaBuilding,
  FaSearch,
  FaArrowRight,
  FaArrowLeft,
  FaGlobe,
  FaExclamationTriangle,
  FaInbox,
  FaGraduationCap,
  FaDownload,
  FaUpload,
  FaFilter,
  FaChevronUp,
  FaChevronDown,
  FaEnvelope,
  FaLink,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { getErrorMessage } from "../../config/getErrorMessage";
import i18n from "../../i18n";

// ─── Google Fonts: Outfit ──────────────────────────────────────────────────────
if (
  typeof document !== "undefined" &&
  !document.getElementById("outfit-font")
) {
  const link = document.createElement("link");
  link.id = "outfit-font";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(link);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades";
type UserLikeTab = "users" | "students" | "teachers" | "parents" | "admins";
type SortDir = "asc" | "desc" | null;

const USER_LIKE_TABS: UserLikeTab[] = [
  "users",
  "students",
  "teachers",
  "parents",
  "admins",
];
const isUserLikeTab = (tab: Tab): tab is UserLikeTab =>
  (USER_LIKE_TABS as Tab[]).includes(tab);

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TAB_KEYS: Tab[] = [
  "users",
  "students",
  "teachers",
  "parents",
  "admins",
  "classes",
  "organizations",
  "grades",
];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  users: <FaUsers size={15} />,
  students: <FaChild size={15} />,
  teachers: <FaChalkboardTeacher size={15} />,
  parents: <FaUserFriends size={15} />,
  admins: <FaUserShield size={15} />,
  classes: <FaSchool size={15} />,
  organizations: <FaBuilding size={15} />,
  grades: <FaGraduationCap size={15} />,
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

type AccentDef = { from: string; to: string; glow: string; light: string };
const TAB_ACCENT: Record<Tab, AccentDef> = {
  users: {
    from: "#3b82f6",
    to: "#2563eb",
    glow: "rgba(59,130,246,0.35)",
    light: "#dbeafe",
  },
  students: {
    from: "#06b6d4",
    to: "#0891b2",
    glow: "rgba(6,182,212,0.35)",
    light: "#cffafe",
  },
  teachers: {
    from: "#10b981",
    to: "#059669",
    glow: "rgba(16,185,129,0.35)",
    light: "#d1fae5",
  },
  parents: {
    from: "#f59e0b",
    to: "#d97706",
    glow: "rgba(245,158,11,0.35)",
    light: "#fef3c7",
  },
  admins: {
    from: "#a855f7",
    to: "#9333ea",
    glow: "rgba(168,85,247,0.35)",
    light: "#f3e8ff",
  },
  classes: {
    from: "#f43f5e",
    to: "#e11d48",
    glow: "rgba(244,63,94,0.35)",
    light: "#ffe4e6",
  },
  organizations: {
    from: "#6366f1",
    to: "#4f46e5",
    glow: "rgba(99,102,241,0.35)",
    light: "#e0e7ff",
  },
  grades: {
    from: "#8b5cf6",
    to: "#7c3aed",
    glow: "rgba(139,92,246,0.35)",
    light: "#ede9fe",
  },
};

const GRADE_COLORS: Record<string, string> = {
  primary: "#10b981",
  preparatory: "#8b5cf6",
  secondary: "#f59e0b",
};

const ENDPOINTS: Record<Tab, string> = {
  users: `${API_BASE_URL}/admin/users`,
  students: `${API_BASE_URL}/admin/students`,
  teachers: `${API_BASE_URL}/admin/teachers`,
  parents: `${API_BASE_URL}/admin/parents`,
  admins: `${API_BASE_URL}/admin/users`,
  classes: `${API_BASE_URL}/admin/classes`,
  organizations: `${API_BASE_URL}/admin/organizations`,
  grades: `${API_BASE_URL}/admin/grades`,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getUserId = (tab: UserLikeTab, row: any): number =>
  tab === "users" || tab === "admins" ? row.id : row.userId;
const getName = (tab: Tab, row: any): string => {
  if (tab === "users" || tab === "admins")
    return `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
  return `${row.user?.firstName ?? row.User?.firstName ?? ""} ${
    row.user?.lastName ?? row.User?.lastName ?? ""
  }`.trim();
};
const getEmail = (tab: Tab, row: any): string =>
  tab === "users" || tab === "admins"
    ? row.email
    : row.user?.email ?? row.User?.email ?? "";
const getDeleteId = (tab: Tab, row: any): number =>
  isUserLikeTab(tab) ? getUserId(tab, row) : row.id;

const escapeCsvCell = (val: any): string => {
  if (val == null) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};
const arrayToCSV = (rows: Record<string, any>[], headers: string[]): string => {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows)
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  return lines.join("\n");
};
const downloadCSV = (csv: string, filename: string) => {
  // Excel on Windows ignores the Blob's charset and guesses the file's
  // encoding from its bytes, defaulting to the system ANSI codepage instead
  // of UTF-8 — which mangles Arabic text into mojibake. A leading UTF-8 BOM
  // is Excel's own signal to read the file as UTF-8 instead of guessing.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const parseCSVText = (
  text: string,
): { headers: string[]; rows: string[][] } => {
  // Strip a leading UTF-8 BOM (present on files this same page exports) so
  // it doesn't get stuck to the first header name and break field mapping.
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = withoutBom.trim().split("\n");
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines
    .slice(1)
    .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  return { headers, rows };
};

// ─── Highlight ────────────────────────────────────────────────────────────────
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

// ─── Role Badge ───────────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  Student: { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  Teacher: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  Parent: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  Admin: { bg: "#f3e8ff", text: "#6b21a8", dot: "#a855f7" },
};
const RoleBadge: React.FC<{ role: string; t: (k: string) => string }> = ({
  role,
  t,
}) => {
  const s = ROLE_BADGE[role] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
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

// ─── Grade Badge ──────────────────────────────────────────────────────────────
const GradeBadge: React.FC<{ name: string; t: (k: string) => string }> = ({
  name,
  t,
}) => {
  const color = GRADE_COLORS[name.toLowerCase()] ?? "#6366f1";
  const label =
    t(`admin.grade.${name}`) !== `admin.grade.${name}`
      ? t(`admin.grade.${name}`)
      : name;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: color + "20",
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
};

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
const ShimmerRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div
          className="h-4 rounded-lg"
          style={{
            maxWidth: i === 0 ? 32 : i === cols - 1 ? 90 : 140,
            background:
              "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </td>
    ))}
  </tr>
);

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmColor?: string;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmColor = "bg-red-500 hover:bg-red-600",
  icon,
  onConfirm,
  onCancel,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="w-full max-w-sm p-6 mx-4 bg-white shadow-2xl rounded-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            {icon && (
              <div className="flex items-center justify-center text-2xl text-red-500 rounded-full w-14 h-14 bg-red-50">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{message}</p>
            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold transition-all ${confirmColor}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Mini Analytics ────────────────────────────────────────────────────────────
interface MiniAnalyticsProps {
  stats: Record<string, number>;
  gradesList: { id: number; name: string }[];
  rows: any[];
  activeTab: Tab;
  t: (k: string) => string;
}
const MiniAnalytics: React.FC<MiniAnalyticsProps> = ({
  stats,
  rows,
  activeTab,
  t,
}) => {
  const roleData = [
    {
      name: t("admin.role.Student"),
      value: stats.students ?? 0,
      color: "#06b6d4",
    },
    {
      name: t("admin.role.Teacher"),
      value: stats.teachers ?? 0,
      color: "#10b981",
    },
    {
      name: t("admin.role.Parent"),
      value: stats.parents ?? 0,
      color: "#f59e0b",
    },
  ].filter((d) => d.value > 0);

  const gradeData = useMemo(() => {
    if (activeTab !== "students") return [];
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const n = r.GradeEntity?.name ?? r.grade ?? "Other";
      counts[n] = (counts[n] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows, activeTab]);

  const signupData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      return { label: d.toLocaleString("en-US", { month: "short" }), count: 0 };
    });
    for (const r of rows) {
      const d = new Date(r.createdAt ?? r.user?.createdAt ?? 0);
      const lbl = d.toLocaleString("en-US", { month: "short" });
      const m = months.find((m) => m.label === lbl);
      if (m) m.count++;
    }
    return months;
  }, [rows]);

  return (
    <motion.div
      className="grid grid-cols-3 gap-4 mb-5"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Role donut */}
      <div className="p-4 bg-white border shadow-sm border-slate-100 rounded-2xl">
        <p className="mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
          {t("admin.chart.distribution")}
        </p>
        <div className="flex items-center gap-3">
          <ResponsiveContainer width={80} height={80}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={36}
                paddingAngle={3}
                dataKey="value"
              >
                {roleData.map((e, i) => (
                  <Cell key={i} fill={e.color} strokeWidth={0} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 11,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col min-w-0 gap-1">
            {roleData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="text-xs truncate text-slate-500">
                  {d.name}
                </span>
                <span className="text-xs font-bold text-slate-800 ms-auto ps-1">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade bar / signup sparkline */}
      <div className="p-4 bg-white border shadow-sm border-slate-100 rounded-2xl">
        <p className="mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
          {activeTab === "students"
            ? t("admin.chart.byGrade")
            : t("admin.chart.growth")}
        </p>
        {activeTab === "students" && gradeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={gradeData} barSize={18}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 11,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={72}>
            <AreaChart data={signupData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 11,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#sg)"
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick stats grid */}
      <div className="p-4 bg-white border shadow-sm border-slate-100 rounded-2xl">
        <p className="mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
          Overview
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: t("admin.role.Student"),
              val: stats.students ?? 0,
              color: "#06b6d4",
            },
            {
              label: t("admin.role.Teacher"),
              val: stats.teachers ?? 0,
              color: "#10b981",
            },
            {
              label: t("admin.role.Parent"),
              val: stats.parents ?? 0,
              color: "#f59e0b",
            },
            {
              label: t("admin.tab.users"),
              val: stats.users ?? 0,
              color: "#3b82f6",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="p-2 rounded-xl"
              style={{ background: s.color + "15" }}
            >
              <p className="text-xs leading-tight text-slate-400">{s.label}</p>
              <p className="text-lg font-bold" style={{ color: s.color }}>
                {s.val.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UserData: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "Admin") {
      setAuthorized(false);
      window.location.href = "/login";
    } else setAuthorized(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.setItem("keepLoggedIn", "false");
    window.location.href = "/login";
  };

  const token = localStorage.getItem("token");

  // Data
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const loadedTabRef = useRef<Tab | null>(null);
  const limit = 25;

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Filters
  const [filterGradeId, setFilterGradeId] = useState("");
  const [filterOrgId, setFilterOrgId] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<Record<string, number>>({});

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState<
    "Student" | "Teacher" | "Parent" | "Admin"
  >("Student");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createGrade, setCreateGrade] = useState("");
  const [createOrgId, setCreateOrgId] = useState("");
  const [createClassId, setCreateClassId] = useState("");
  const [createClassIds, setCreateClassIds] = useState<string[]>([]);
  const [createOrganizations, setCreateOrganizations] = useState<
    { id: number; name: string }[]
  >([]);
  const [createClasses, setCreateClasses] = useState<
    { id: number; classname: string; grade: string }[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // Edit modal
  const [editingRow, setEditingRow] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editOrgId, setEditOrgId] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editClassIds, setEditClassIds] = useState<string[]>([]);
  const [editClassName, setEditClassName] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editGradeName, setEditGradeName] = useState("");
  const [editClassesOptions, setEditClassesOptions] = useState<
    { id: number; classname: string; grade: string }[]
  >([]);
  const [gradesList, setGradesList] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Confirms
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
    tab: Tab;
    row: any;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState<{
    userId: number;
    name: string;
  } | null>(null);

  // UI
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleLanguage = () => {
    const nl = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nl);
    localStorage.setItem("language", nl);
    const dir = nl === "ar" ? "rtl" : "ltr";
    localStorage.setItem("dir", dir);
    document.documentElement.setAttribute("dir", dir);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    if (loadedTabRef.current !== activeTab) setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (activeTab === "admins") params.role = "Admin";
      if (filterGradeId) params.gradeId = filterGradeId;
      if (filterOrgId) params.organizationId = filterOrgId;
      if (filterRole && activeTab !== "admins") params.role = filterRole;
      if (filterVerified) params.verified = "true";
      const res = await axios.get(ENDPOINTS[activeTab], {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setRows(res.data.data);
      setTotal(res.data.total);
      loadedTabRef.current = activeTab;
    } catch {
      toast.error(t("admin.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    page,
    search,
    filterGradeId,
    filterOrgId,
    filterRole,
    filterVerified,
    t,
    token,
  ]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const [u, s, tc, p] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1 },
        }),
        axios.get(`${API_BASE_URL}/admin/students`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1 },
        }),
        axios.get(`${API_BASE_URL}/admin/teachers`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1 },
        }),
        axios.get(`${API_BASE_URL}/admin/parents`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1 },
        }),
      ]);
      setStats({
        users: u.data.total ?? 0,
        students: s.data.total ?? 0,
        teachers: tc.data.total ?? 0,
        parents: p.data.total ?? 0,
      });
    } catch {
      /* silent */
    }
  }, [token]);

  const fetchGradesList = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/grades`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 },
      });
      setGradesList(res.data.data);
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => {
    if (!authorized) return;
    const id = setTimeout(fetchData, 300);
    return () => clearTimeout(id);
  }, [authorized, fetchData]);
  useEffect(() => {
    if (authorized) fetchStats();
  }, [authorized, fetchStats]);
  useEffect(() => {
    if (authorized) fetchGradesList();
  }, [authorized, fetchGradesList, activeTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Clear rows immediately instead of waiting for fetchData's debounce to
    // kick in — otherwise there's a window where activeTab has already
    // switched (e.g. to "grades") but rows[] still holds the previous tab's
    // differently-shaped data, and renderRow crashes trying to read fields
    // that don't exist on that shape (e.g. a student row has no `.name`).
    setRows([]);
    setSearch("");
    setPage(1);
    setSelectedIds(new Set());
    setFilterGradeId("");
    setFilterOrgId("");
    setFilterRole("");
    setFilterVerified(false);
    setSortField(null);
    setSortDir(null);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortField(null);
        setSortDir(null);
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortField || !sortDir) return rows;
    return [...rows].sort((a, b) => {
      let av: any = a[sortField] ?? getName(activeTab, a) ?? "";
      let bv: any = b[sortField] ?? getName(activeTab, b) ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDir, activeTab]);

  const activeFiltersCount = [
    filterGradeId,
    filterOrgId,
    filterRole,
    filterVerified ? "v" : "",
  ].filter(Boolean).length;

  // Edit openers
  const openEditModal = (row: any) => {
    setEditingRow(row);
    setEditFirstName(
      row.firstName ?? row.user?.firstName ?? row.User?.firstName ?? "",
    );
    setEditLastName(
      row.lastName ?? row.user?.lastName ?? row.User?.lastName ?? "",
    );
    setEditEmail(row.email ?? row.user?.email ?? row.User?.email ?? "");
    setEditGrade(row.gradeId ? String(row.gradeId) : row.grade ?? "");
    setEditOrgId(String(row.organizationId ?? row.Organization?.id ?? ""));
    setEditClassId(String(row.classId ?? ""));
    setEditClassIds(
      row.Classes ? row.Classes.map((c: any) => String(c.id)) : [],
    );
    setEditClassName(row.classname ?? "");
    setEditOrgName(row.name ?? "");
    setEditGradeName(row.name ?? "");
  };
  const openCreateClassModal = () => {
    setEditingRow({ isNew: true });
    setEditClassName("");
    setEditGrade("");
    setEditOrgId("");
  };
  const openCreateOrgModal = () => {
    setEditingRow({ isNew: true });
    setEditOrgName("");
  };
  const openCreateGradeModal = () => {
    setEditingRow({ isNew: true });
    setEditGradeName("");
  };

  useEffect(() => {
    if (!editingRow || (activeTab !== "students" && activeTab !== "teachers")) {
      setEditClassesOptions([]);
      return;
    }
    if (!editOrgId) {
      setEditClassesOptions([]);
      return;
    }
    axios
      .get(`${API_BASE_URL}/admin/organizations/${editOrgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setEditClassesOptions(r.data.data.Classes || []))
      .catch(console.error);
  }, [editingRow, editOrgId, activeTab, token]);

  useEffect(() => {
    if (!showCreateModal && !editingRow && !showImport) return;
    axios
      .get(`${API_BASE_URL}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 },
      })
      .then((r) => setCreateOrganizations(r.data.data))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal, editingRow]);

  useEffect(() => {
    if (!createOrgId) {
      setCreateClasses([]);
      return;
    }
    axios
      .get(`${API_BASE_URL}/admin/organizations/${createOrgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setCreateClasses(r.data.data.Classes || []))
      .catch(console.error);
  }, [createOrgId, token]);

  const handleSaveEdit = async () => {
    const isNew = !!editingRow?.isNew;
    if (
      activeTab === "classes" &&
      (!editClassName || !editGrade || !editOrgId)
    ) {
      toast.error(t("admin.toast.classNameGradeOrgRequired"));
      return;
    }
    if (activeTab === "organizations" && !editOrgName) {
      toast.error(t("admin.toast.orgNameRequired"));
      return;
    }
    if (activeTab === "grades" && !editGradeName) {
      toast.error(t("admin.toast.gradeNameRequired"));
      return;
    }
    setIsSavingEdit(true);
    try {
      if (activeTab === "classes") {
        const body = {
          classname: editClassName,
          gradeId: editGrade ? Number(editGrade) : undefined,
          organizationId: editOrgId ? Number(editOrgId) : undefined,
        };
        isNew
          ? await axios.post(`${API_BASE_URL}/admin/classes`, body, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.patch(
              `${API_BASE_URL}/admin/classes/${editingRow.id}`,
              body,
              { headers: { Authorization: `Bearer ${token}` } },
            );
      } else if (activeTab === "organizations") {
        const body = { name: editOrgName };
        isNew
          ? await axios.post(`${API_BASE_URL}/admin/organizations`, body, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.patch(
              `${API_BASE_URL}/admin/organizations/${editingRow.id}`,
              body,
              { headers: { Authorization: `Bearer ${token}` } },
            );
      } else if (activeTab === "grades") {
        const body = { name: editGradeName };
        isNew
          ? await axios.post(`${API_BASE_URL}/admin/grades`, body, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.patch(
              `${API_BASE_URL}/admin/grades/${editingRow.id}`,
              body,
              { headers: { Authorization: `Bearer ${token}` } },
            );
      } else {
        const userId = getUserId(activeTab, editingRow);
        await axios.patch(
          `${API_BASE_URL}/admin/users/${userId}`,
          {
            firstName: editFirstName,
            lastName: editLastName,
            email: editEmail,
            gradeId:
              activeTab === "students" || activeTab === "teachers"
                ? editGrade
                  ? Number(editGrade)
                  : null
                : undefined,
            organizationId:
              activeTab === "students" || activeTab === "teachers"
                ? editOrgId
                  ? Number(editOrgId)
                  : null
                : undefined,
            classId:
              activeTab === "students"
                ? editClassId
                  ? Number(editClassId)
                  : null
                : undefined,
            classIds:
              activeTab === "teachers" ? editClassIds.map(Number) : undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      toast.success(
        isNew ? t("admin.toast.createSuccess") : t("admin.toast.saveSuccess"),
      );
      setEditingRow(null);
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error(getErrorMessage(error, t("admin.toast.saveFailed")));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (tab: Tab, row: any) => {
    const id = getDeleteId(tab, row);
    const ep =
      tab === "classes"
        ? `${API_BASE_URL}/admin/classes/${id}`
        : tab === "organizations"
        ? `${API_BASE_URL}/admin/organizations/${id}`
        : tab === "grades"
        ? `${API_BASE_URL}/admin/grades/${id}`
        : `${API_BASE_URL}/admin/users/${id}`;
    try {
      await axios.delete(ep, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t("admin.toast.deleteSuccess"));
      fetchData();
      fetchStats();
    } catch (error: any) {
      const data = error?.response?.data;
      if (
        data?.studentCount !== undefined ||
        data?.teacherCount !== undefined
      ) {
        toast.error(
          `${t("admin.toast.deleteHasRelated")} ${data.studentCount ?? 0} ${t(
            "admin.toast.students",
          )}, ${data.teacherCount ?? 0} ${t("admin.toast.teachers")}, ${
            data.classCount ?? 0
          } ${t("admin.toast.classes")}`,
        );
      } else {
        toast.error(getErrorMessage(error, t("admin.toast.deleteFailed")));
      }
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkConfirmOpen(false);
    let deleted = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const ep = isUserLikeTab(activeTab)
          ? `${API_BASE_URL}/admin/users/${id}`
          : `${API_BASE_URL}/admin/${activeTab}/${id}`;
        await axios.delete(ep, {
          headers: { Authorization: `Bearer ${token}` },
        });
        deleted++;
      } catch {
        /* skip */
      }
    }
    toast.success(`Deleted ${deleted} items`);
    setSelectedIds(new Set());
    fetchData();
    fetchStats();
  };

  const handleBulkReset = async () => {
    const results: { email: string; newPassword: string }[] = [];
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await axios.patch(
          `${API_BASE_URL}/admin/users/${id}/reset-password`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const r = rows.find(
          (r) => getUserId(activeTab as UserLikeTab, r) === id,
        );
        results.push({
          email: getEmail(activeTab, r ?? {}),
          newPassword: res.data.newPassword,
        });
      } catch {
        /* skip */
      }
    }
    if (results.length > 0) {
      const csv = arrayToCSV(results, ["email", "newPassword"]);
      downloadCSV(csv, `passwords_reset_${Date.now()}.csv`);
      toast.success(t("admin.bulk.resetSuccess"));
    }
    setSelectedIds(new Set());
  };

  const openCreateModal = () => {
    setCreateRole("Student");
    setCreateFirstName("");
    setCreateLastName("");
    setCreateEmail("");
    setCreateGrade("");
    setCreateOrgId("");
    setCreateClassId("");
    setCreateClassIds([]);
    setCreatedCredentials(null);
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    if (!createFirstName || !createEmail) {
      toast.error(t("admin.toast.firstNameEmailRequired"));
      return;
    }
    if (
      (createRole === "Student" || createRole === "Teacher") &&
      !createOrgId
    ) {
      toast.error(t("admin.toast.selectOrg"));
      return;
    }
    setIsCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/users`,
        {
          firstName: createFirstName,
          lastName: createLastName,
          email: createEmail,
          role: createRole,
          organizationId: createOrgId ? Number(createOrgId) : undefined,
          classId:
            createRole === "Student" && createClassId
              ? Number(createClassId)
              : undefined,
          classIds:
            createRole === "Teacher" ? createClassIds.map(Number) : undefined,
          gradeId: createGrade ? Number(createGrade) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCreatedCredentials({
        email: res.data.data.email,
        password: res.data.password,
      });
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error(getErrorMessage(error, t("admin.toast.saveFailed")));
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/admin/users/${userId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        `${t("admin.toast.resetSuccess")} \u200E${res.data.newPassword}\u200E`,
      );
    } catch {
      toast.error(t("admin.toast.resetFailed"));
    } finally {
      setConfirmReset(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await axios.get(ENDPOINTS[activeTab], {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 9999,
          ...(activeTab === "admins" ? { role: "Admin" } : {}),
        },
      });
      const data: any[] = res.data.data;
      let csvHeaders: string[] = [];
      let mapped: Record<string, any>[] = [];
      if (activeTab === "students") {
        csvHeaders = [
          "id",
          "firstName",
          "lastName",
          "email",
          "grade",
          "school",
          "class",
        ];
        mapped = data.map((r) => ({
          id: r.id,
          firstName: r.user?.firstName,
          lastName: r.user?.lastName,
          email: r.user?.email,
          grade: r.GradeEntity?.name ?? r.grade,
          school: r.Organization?.name,
          class: r.Class?.classname,
        }));
      } else if (activeTab === "classes") {
        csvHeaders = ["id", "classname", "grade", "school", "students"];
        mapped = data.map((r) => ({
          id: r.id,
          classname: r.classname,
          grade: r.GradeEntity?.name ?? r.grade,
          school: r.Organization?.name,
          students: (r.Students ?? []).length,
        }));
      } else if (activeTab === "organizations" || activeTab === "grades") {
        csvHeaders = ["id", "name"];
        mapped = data.map((r) => ({ id: r.id, name: r.name }));
      } else {
        csvHeaders = [
          "id",
          "firstName",
          "lastName",
          "email",
          "role",
          "createdAt",
        ];
        mapped = data.map((r) => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          role: r.role,
          createdAt: r.createdAt,
        }));
      }
      downloadCSV(
        arrayToCSV(mapped, csvHeaders),
        `${activeTab}_export_${Date.now()}.csv`,
      );
      toast.success(t("admin.export.toast"));
    } catch {
      toast.error(t("admin.toast.loadFailed"));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmDelete) setConfirmDelete(null);
      else if (confirmReset) setConfirmReset(null);
      else if (editingRow) setEditingRow(null);
      else if (showCreateModal) setShowCreateModal(false);
      else if (showImport) setShowImport(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirmDelete, confirmReset, editingRow, showCreateModal, showImport]);

  if (!authorized) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const accent = TAB_ACCENT[activeTab];

  type HeaderDef = { key: string; label: string; sortable?: boolean };
  const getHeaderDefs = (): HeaderDef[] => {
    const chk: HeaderDef = { key: "_check", label: "" };
    const act: HeaderDef = { key: "_actions", label: "admin.th.actions" };
    switch (activeTab) {
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
  const headerDefs = getHeaderDefs();

  const renderRow = (row: any, idx: number) => {
    const userId = isUserLikeTab(activeTab) ? getUserId(activeTab, row) : -1;
    const selId = isUserLikeTab(activeTab) ? userId : row.id;
    const name =
      activeTab === "grades" ? row.name ?? "—" : getName(activeTab, row) || "—";
    const email = getEmail(activeTab, row);
    const deleteId = getDeleteId(activeTab, row);
    const isSel = selectedIds.has(selId);

    const initials = (name[0] ?? "?").toUpperCase();
    const avatarStyle = {
      background: `linear-gradient(135deg,${accent.from},${accent.to})`,
    };

    let cells: React.ReactNode[] = [];
    switch (activeTab) {
      case "students":
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white rounded-full"
              style={avatarStyle}
            >
              {initials}
            </div>
            <span className="font-medium text-gray-900">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-sm text-slate-500" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          row.GradeEntity?.name ? (
            <GradeBadge name={row.GradeEntity.name} t={t} />
          ) : row.grade ? (
            <GradeBadge name={row.grade} t={t} />
          ) : (
            <span className="text-gray-300">—</span>
          ),
          <span className="text-sm text-slate-500">
            {row.organization?.name ?? row.Organization?.name ?? (
              <span className="text-gray-300">—</span>
            )}
          </span>,
          <span className="text-sm text-slate-500">
            {row.Class?.classname ?? row.class?.classname ?? (
              <span className="text-gray-300">—</span>
            )}
          </span>,
        ];
        break;
      case "teachers":
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white rounded-full"
              style={avatarStyle}
            >
              {initials}
            </div>
            <span className="font-medium text-gray-900">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-sm text-slate-500" dir="ltr">
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
            <span className="text-gray-300">—</span>
          ),
          <span className="text-sm text-slate-500">
            {row.Organization?.name ?? row.organization?.name ?? (
              <span className="text-gray-300">—</span>
            )}
          </span>,
          row.Classes && row.Classes.length > 0 ? (
            <div className="flex flex-col gap-1">
              {row.Classes.map((c: any, i: number) => (
                <span key={i} className="text-sm text-slate-500">
                  {c.classname}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-300">—</span>
          ),
        ];
        break;
      case "parents":
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white rounded-full"
              style={avatarStyle}
            >
              {initials}
            </div>
            <span className="font-medium text-gray-900">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-sm text-slate-500" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          <span className="text-sm font-semibold text-gray-800">
            {(row.Students ?? row.students ?? []).length}
          </span>,
        ];
        break;
      case "classes":
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="font-medium text-gray-900">{row.classname}</span>,
          row.GradeEntity?.name ? (
            <GradeBadge name={row.GradeEntity.name} t={t} />
          ) : row.grade ? (
            <GradeBadge name={row.grade} t={t} />
          ) : (
            <span className="text-gray-300">—</span>
          ),
          <span className="text-sm text-slate-500">
            {row.Organization?.name ?? <span className="text-gray-300">—</span>}
          </span>,
          <span className="text-sm font-semibold text-gray-800">
            {(row.Students ?? []).length}
          </span>,
        ];
        break;
      case "organizations":
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="font-medium text-gray-900">{row.name}</span>,
        ];
        break;
      case "grades":
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <span className="font-medium text-gray-900">{row.name}</span>,
        ];
        break;
      default:
        cells = [
          <span className="font-mono text-xs text-slate-400">#{row.id}</span>,
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white rounded-full"
              style={avatarStyle}
            >
              {initials}
            </div>
            <span className="font-medium text-gray-900">
              <Highlight text={name} query={search} />
            </span>
          </div>,
          <span className="text-sm text-slate-500" dir="ltr">
            <Highlight text={email} query={search} />
          </span>,
          <RoleBadge role={row.role} t={t} />,
          row.isAccess ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              No
            </span>
          ),
          <span className="text-xs text-slate-400">
            {row.createdAt
              ? new Date(row.createdAt).toLocaleDateString(
                  i18n.language === "ar" ? "ar-EG" : "en-US",
                )
              : "—"}
          </span>,
        ];
    }

    return (
      <motion.tr
        key={`${activeTab}-${row.id}`}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.022, duration: 0.18 }}
        className={`group border-b border-slate-100/80 transition-all ${
          isSel ? "bg-blue-50/60" : "hover:bg-slate-50/60"
        }`}
        style={{
          borderLeft: isSel
            ? `3px solid ${accent.from}`
            : "3px solid transparent",
        }}
      >
        <td className="px-3 py-3.5 w-10">
          <input
            type="checkbox"
            checked={isSel}
            onChange={(e) =>
              setSelectedIds((prev) => {
                const n = new Set(prev);
                e.target.checked ? n.add(selId) : n.delete(selId);
                return n;
              })
            }
            className="w-4 h-4 rounded cursor-pointer accent-blue-500"
          />
        </td>
        {cells.map((c, i) => (
          <td key={i} className="px-4 py-3.5 text-sm whitespace-nowrap">
            {c}
          </td>
        ))}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1 transition-all duration-200 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title={t("admin.modal.editUser")}
              onClick={() => openEditModal(row)}
            >
              <FaEdit size={13} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title={t("admin.delete.confirm")}
              onClick={() =>
                setConfirmDelete({ id: deleteId, name, tab: activeTab, row })
              }
            >
              <FaTrash size={13} />
            </motion.button>
            {isUserLikeTab(activeTab) && (
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 transition-colors rounded-lg text-amber-600 hover:bg-amber-50"
                title={t("admin.reset.title")}
                onClick={() => setConfirmReset({ userId, name })}
              >
                <FaKey size={13} />
              </motion.button>
            )}
            {email && (
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 transition-colors rounded-lg text-slate-500 hover:bg-slate-100"
                title={t("admin.action.copyEmail")}
                onClick={() => {
                  navigator.clipboard.writeText(email);
                  toast.success(t("admin.action.copied"));
                }}
              >
                <FaEnvelope size={13} />
              </motion.button>
            )}
            {activeTab === "students" && row.connectCode && (
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 transition-colors rounded-lg text-violet-600 hover:bg-violet-50"
                title={t("admin.action.copyCode")}
                onClick={() => {
                  navigator.clipboard.writeText(row.connectCode);
                  toast.success(t("admin.action.copied"));
                }}
              >
                <FaLink size={13} />
              </motion.button>
            )}
          </div>
        </td>
      </motion.tr>
    );
  };

  const createLabel =
    activeTab === "classes"
      ? t("admin.create.class")
      : activeTab === "organizations"
      ? t("admin.create.organization")
      : activeTab === "grades"
      ? t("admin.create.grade")
      : t("admin.create.user");

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      )
        pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const selectAllIds = () =>
    setSelectedIds(
      new Set(
        rows.map((r) =>
          isUserLikeTab(activeTab) ? getUserId(activeTab, r) : r.id,
        ),
      ),
    );
  const allSelected =
    rows.length > 0 &&
    rows.every((r) =>
      selectedIds.has(
        isUserLikeTab(activeTab) ? getUserId(activeTab, r) : r.id,
      ),
    );

  // ─── Input class helper ───────────────────────────────────────────────────────
  const inputCls =
    "w-full p-3 text-gray-900 border border-gray-200 outline-none bg-slate-50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm";
  const selectCls =
    "w-full p-3 text-gray-900 border border-gray-200 outline-none bg-slate-50 rounded-xl focus:border-blue-400 transition-all text-sm";
  const labelCls = "block mb-1.5 text-sm font-medium text-gray-600";

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex w-full min-h-screen"
      style={{ fontFamily: "Outfit, sans-serif", background: "#f1f5f9" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        rtl={isRTL}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{ fontFamily: "Outfit, sans-serif", borderRadius: 12 }}
      />

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside
        className="flex flex-col min-h-screen w-72 shrink-0"
        style={{
          background: "linear-gradient(180deg,#0f172a 0%,#1e293b 100%)",
          borderRight: isRTL ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderLeft: isRTL ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
      >
        {/* Header */}
        <div className="px-6 pb-5 pt-7">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 text-white rounded-xl"
              style={{
                background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                boxShadow: `0 0 20px ${accent.glow}`,
              }}
            >
              <FaUsers size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-white">
                {t("admin.userDataTitle")}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Sanabel Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-400 transition-colors hover:text-red-300"
          >
            <FaSignOutAlt size={12} /> {t("تسجيل الخروج")}
          </button>
        </div>
        <div
          className="h-px mx-5"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        {/* Nav tabs */}
        <nav className="flex flex-col flex-1 gap-0.5 p-4 overflow-y-auto">
          {TAB_KEYS.map((tabKey) => {
            const isActive = activeTab === tabKey;
            const a = TAB_ACCENT[tabKey];
            return (
              <motion.button
                key={tabKey}
                onClick={() => handleTabChange(tabKey)}
                whileHover={{ x: isRTL ? -2 : 2 }}
                className="relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-start transition-all duration-200"
                style={{
                  background: isActive ? `${a.from}22` : "transparent",
                  border: `1px solid ${
                    isActive ? a.from + "40" : "transparent"
                  }`,
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bar"
                    className="absolute inset-y-0 start-0 w-0.5 rounded-full"
                    style={{
                      background: `linear-gradient(180deg,${a.from},${a.to})`,
                    }}
                  />
                )}
                <span
                  className="flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7"
                  style={{
                    background: isActive
                      ? a.from + "30"
                      : "rgba(255,255,255,0.06)",
                    color: isActive ? a.from : "#94a3b8",
                  }}
                >
                  {TAB_ICONS[tabKey]}
                </span>
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: isActive ? "#f1f5f9" : "#94a3b8" }}
                >
                  {t(TAB_I18N[tabKey])}
                </span>
                {isActive && total > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: a.from + "25", color: a.from }}
                  >
                    {total}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div
          className="h-px mx-5"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        {/* Filters */}
        <div className="px-4 py-3">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold transition-colors rounded-xl text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <FaFilter size={11} className="text-slate-400" />
              {t("admin.filter.title")}
              {activeFiltersCount > 0 && (
                <span
                  className="flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full"
                  style={{ background: accent.from, color: "#fff" }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </span>
            <motion.span
              animate={{ rotate: filtersOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-500"
            >
              <FaChevronDown size={10} />
            </motion.span>
          </button>
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2">
                  {(activeTab === "students" || activeTab === "classes") && (
                    <div>
                      <p className="px-1 mb-1 text-xs text-slate-500">
                        {t("admin.filter.grade")}
                      </p>
                      <select
                        value={filterGradeId}
                        onChange={(e) => {
                          setFilterGradeId(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 text-xs outline-none rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#e2e8f0",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <option value="">{t("admin.filter.all")}</option>
                        {gradesList.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(activeTab === "students" ||
                    activeTab === "teachers" ||
                    activeTab === "classes") && (
                    <div>
                      <p className="px-1 mb-1 text-xs text-slate-500">
                        {t("admin.filter.school")}
                      </p>
                      <select
                        value={filterOrgId}
                        onChange={(e) => {
                          setFilterOrgId(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 text-xs outline-none rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#e2e8f0",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <option value="">{t("admin.filter.all")}</option>
                        {createOrganizations.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {activeTab === "users" && (
                    <div>
                      <p className="px-1 mb-1 text-xs text-slate-500">
                        {t("admin.filter.role")}
                      </p>
                      <select
                        value={filterRole}
                        onChange={(e) => {
                          setFilterRole(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 text-xs outline-none rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#e2e8f0",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <option value="">{t("admin.filter.all")}</option>
                        {["Student", "Teacher", "Parent", "Admin"].map((r) => (
                          <option key={r} value={r}>
                            {t(`admin.role.${r}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => {
                        setFilterGradeId("");
                        setFilterOrgId("");
                        setFilterRole("");
                        setFilterVerified(false);
                        setPage(1);
                      }}
                      className="w-full text-xs py-1.5 rounded-xl transition-colors text-center"
                      style={{
                        color: accent.from,
                        border: `1px solid ${accent.from}40`,
                        background: accent.from + "15",
                      }}
                    >
                      {t("admin.filter.clear")}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create button */}
        <div className="p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={
              activeTab === "classes"
                ? openCreateClassModal
                : activeTab === "organizations"
                ? openCreateOrgModal
                : activeTab === "grades"
                ? openCreateGradeModal
                : openCreateModal
            }
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-white rounded-xl"
            style={{
              background: `linear-gradient(135deg,${accent.from},${accent.to})`,
              boxShadow: `0 4px 16px ${accent.glow}`,
            }}
          >
            <FaPlus size={12} />
            {createLabel}
          </motion.button>
        </div>
      </aside>

      {/* ══════════════════ MAIN ══════════════════ */}
      <main className="flex flex-col flex-1 min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t(TAB_I18N[activeTab])}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {t("admin.pagination.showing")}{" "}
              {total > 0 ? `${startItem}–${endItem}` : "0"}{" "}
              {t("admin.pagination.of")} {total} {t("admin.pagination.results")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <FaSearch
                className={`absolute top-1/2 -translate-y-1/2 text-slate-300 ${
                  isRTL ? "right-3.5" : "left-3.5"
                }`}
                size={13}
              />
              <input
                ref={searchRef}
                type="text"
                placeholder={t("admin.search.placeholder")}
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className={`py-2.5 bg-slate-50 text-gray-800 border border-slate-200 outline-none rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm ${
                  isRTL ? "pr-10 pl-4 w-56" : "pl-10 pr-4 w-56"
                }`}
              />
            </div>
            {/* Analytics toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAnalytics((v) => !v)}
              className="p-2.5 rounded-xl border transition-colors"
              style={
                showAnalytics
                  ? {
                      background: "#eff6ff",
                      borderColor: "#bfdbfe",
                      color: "#2563eb",
                    }
                  : {
                      background: "white",
                      borderColor: "#e2e8f0",
                      color: "#94a3b8",
                    }
              }
              title="Toggle Analytics"
            >
              <FaChartBar size={14} />
            </motion.button>
            {/* Export */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <FaDownload size={12} />
              {t("admin.export.button")}
            </motion.button>
            {/* Import */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <FaUpload size={12} />
              {t("admin.import.button")}
            </motion.button>
            {/* Language */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <FaGlobe size={12} />
              {t("admin.languageToggle")}
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-8 py-6 overflow-auto">
          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28 }}
              >
                <MiniAnalytics
                  stats={stats}
                  gradesList={gradesList}
                  rows={rows}
                  activeTab={activeTab}
                  t={t}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="overflow-hidden bg-white border shadow-sm border-slate-100/80 rounded-2xl">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b border-slate-100"
                  style={{ background: "#f8fafc" }}
                >
                  <th className="px-3 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        e.target.checked
                          ? selectAllIds()
                          : setSelectedIds(new Set())
                      }
                      className="w-4 h-4 rounded cursor-pointer accent-blue-500"
                    />
                  </th>
                  {headerDefs.slice(1).map((h, i) => (
                    <th
                      key={i}
                      onClick={h.sortable ? () => handleSort(h.key) : undefined}
                      className={`px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-start whitespace-nowrap ${
                        h.sortable
                          ? "cursor-pointer hover:text-slate-700 select-none"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {h.label ? t(h.label) : ""}
                        {h.sortable && (
                          <span className="flex flex-col gap-0">
                            <FaChevronUp
                              size={8}
                              style={{
                                color:
                                  sortField === h.key && sortDir === "asc"
                                    ? accent.from
                                    : "#cbd5e1",
                              }}
                            />
                            <FaChevronDown
                              size={8}
                              style={{
                                color:
                                  sortField === h.key && sortDir === "desc"
                                    ? accent.from
                                    : "#cbd5e1",
                              }}
                            />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <ShimmerRow key={i} cols={headerDefs.length} />
                  ))
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={headerDefs.length} className="py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="flex items-center justify-center w-16 h-16 rounded-full"
                          style={{ background: accent.from + "15" }}
                        >
                          <FaInbox size={28} style={{ color: accent.from }} />
                        </div>
                        <p className="text-base font-semibold text-slate-400">
                          {t("admin.empty")}
                        </p>
                        <p className="text-sm text-slate-300">
                          {t("admin.empty.description")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => renderRow(row, idx))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-5 mb-4">
              <p className="text-sm text-slate-400">
                {t("admin.pagination.page")} {page} {t("admin.pagination.of")}{" "}
                {totalPages}
              </p>
              <div className="flex items-center gap-1" dir="ltr">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"
                >
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`d${i}`} className="px-2 text-slate-300">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className="text-sm font-semibold transition-all w-9 h-9 rounded-xl"
                      style={
                        page === p
                          ? {
                              background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                              color: "white",
                              boxShadow: `0 2px 8px ${accent.glow}`,
                            }
                          : {
                              background: "white",
                              border: "1px solid #e2e8f0",
                              color: "#64748b",
                            }
                      }
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════ BULK ACTION BAR ══════════════════ */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-sm font-semibold text-white">
              {selectedIds.size} {t("admin.bulk.selected")}
            </span>
            <div className="w-px h-5 bg-white/20" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBulkConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl"
              style={{ background: "#ef4444" }}
            >
              <FaTrash size={12} />
              {t("admin.bulk.delete")}
            </motion.button>
            {isUserLikeTab(activeTab) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl"
                style={{ background: "#f59e0b" }}
              >
                <FaKey size={12} />
                {t("admin.bulk.resetPasswords")}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all rounded-xl text-slate-400 hover:text-white"
            >
              <FaTimes size={12} />
              {t("admin.bulk.deselectAll")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ CREATE USER MODAL ══════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !createdCredentials && setShowCreateModal(false)}
          >
            <motion.div
              className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {createdCredentials ? (
                <motion.div
                  className="flex flex-col items-center gap-4 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div
                    className="flex items-center justify-center w-16 h-16 text-3xl text-white rounded-full"
                    style={{
                      background: "linear-gradient(135deg,#10b981,#059669)",
                      boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
                    }}
                  >
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t("admin.created.title")}
                  </h2>
                  <div className="w-full p-4 space-y-3 border border-gray-100 text-start bg-slate-50 rounded-xl">
                    <div>
                      <span className="text-xs tracking-wider text-gray-400 uppercase">
                        {t("admin.created.email")}
                      </span>
                      <p className="font-medium text-gray-900 mt-0.5" dir="ltr">
                        {createdCredentials.email}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-xs tracking-wider text-gray-400 uppercase">
                        {t("admin.created.tempPassword")}
                      </span>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className="font-mono text-lg font-bold text-gray-900"
                          dir="ltr"
                        >
                          {createdCredentials.password}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              createdCredentials!.password,
                            );
                            toast.success(t("admin.created.copied"));
                          }}
                          className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-200 hover:text-gray-600"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t("admin.created.shareNote")}
                  </p>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full py-3 font-bold text-white rounded-xl"
                    style={{
                      background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                    }}
                  >
                    {t("admin.created.done")}
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      {t("admin.modal.createUser")}
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls}>
                        {t("admin.modal.accountType")}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(
                          ["Student", "Teacher", "Parent", "Admin"] as const
                        ).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setCreateRole(role);
                              setCreateOrgId("");
                              setCreateClassId("");
                            }}
                            className="py-2.5 text-xs rounded-xl font-semibold transition-all"
                            style={
                              createRole === role
                                ? {
                                    background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                                    color: "white",
                                  }
                                : {
                                    border: "2px solid #e2e8f0",
                                    color: "#64748b",
                                  }
                            }
                          >
                            {t(`admin.role.${role}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className={labelCls}>
                          {t("admin.modal.firstName")}
                        </label>
                        <input
                          type="text"
                          value={createFirstName}
                          onChange={(e) => setCreateFirstName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelCls}>
                          {t("admin.modal.lastName")}
                        </label>
                        <input
                          type="text"
                          value={createLastName}
                          onChange={(e) => setCreateLastName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>
                        {t("admin.modal.email")}
                      </label>
                      <input
                        type="email"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        dir="ltr"
                        className={inputCls}
                      />
                    </div>
                    {(createRole === "Student" || createRole === "Teacher") && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.modal.grade")}
                        </label>
                        <select
                          value={createGrade}
                          onChange={(e) => setCreateGrade(e.target.value)}
                          className={selectCls}
                        >
                          <option value="">
                            {t("admin.modal.selectGrade")}
                          </option>
                          {gradesList.map((g) => (
                            <option key={g.id} value={g.id}>
                              {t(`admin.grade.${g.name}`) !==
                              `admin.grade.${g.name}`
                                ? t(`admin.grade.${g.name}`)
                                : g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(createRole === "Student" || createRole === "Teacher") && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.modal.org")}
                        </label>
                        <select
                          value={createOrgId}
                          onChange={(e) => {
                            setCreateOrgId(e.target.value);
                            setCreateClassId("");
                          }}
                          className={selectCls}
                        >
                          <option value="">{t("admin.modal.selectOrg")}</option>
                          {createOrganizations.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {createRole === "Student" && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.modal.class")}
                        </label>
                        <select
                          value={createClassId}
                          onChange={(e) => setCreateClassId(e.target.value)}
                          disabled={!createOrgId}
                          className={`${selectCls} disabled:opacity-50`}
                        >
                          <option value="">
                            {t("admin.modal.selectClass")}
                          </option>
                          {createClasses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.classname} ({t(`admin.grade.${c.grade}`)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {createRole === "Teacher" && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.modal.class")}
                        </label>
                        <select
                          multiple
                          value={createClassIds}
                          onChange={(e) => {
                            const values = Array.from(
                              e.target.selectedOptions,
                              (option) => option.value,
                            );
                            setCreateClassIds(values);
                          }}
                          disabled={!createOrgId}
                          className={`${selectCls} disabled:opacity-50 h-32`}
                        >
                          {createClasses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.classname} ({t(`admin.grade.${c.grade}`)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={handleCreateUser}
                      disabled={isCreating}
                      className="w-full py-3 font-bold text-white rounded-xl disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                        boxShadow: `0 4px 16px ${accent.glow}`,
                      }}
                    >
                      {isCreating
                        ? t("admin.modal.creating")
                        : t("admin.modal.createBtn")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingRow && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingRow(null)}
          >
            <motion.div
              className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingRow?.isNew
                    ? activeTab === "classes"
                      ? t("admin.modal.createClass")
                      : activeTab === "organizations"
                      ? t("admin.modal.createOrg")
                      : activeTab === "grades"
                      ? t("admin.modal.createGrade")
                      : t("admin.modal.createNewBtn")
                    : activeTab === "classes"
                    ? t("admin.modal.editClass")
                    : activeTab === "organizations"
                    ? t("admin.modal.editOrg")
                    : activeTab === "grades"
                    ? t("admin.modal.editGrade")
                    : t("admin.modal.editUser")}
                </h2>
                <button
                  onClick={() => setEditingRow(null)}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {activeTab === "classes" ? (
                  <>
                    <div>
                      <label className={labelCls}>
                        {t("admin.modal.className")}
                      </label>
                      <input
                        type="text"
                        value={editClassName}
                        onChange={(e) => setEditClassName(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>
                        {t("admin.modal.grade")}
                      </label>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">{t("admin.modal.selectGrade")}</option>
                        {gradesList.map((g) => (
                          <option key={g.id} value={g.id}>
                            {t(`admin.grade.${g.name}`) !==
                            `admin.grade.${g.name}`
                              ? t(`admin.grade.${g.name}`)
                              : g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.modal.org")}</label>
                      <select
                        value={editOrgId}
                        onChange={(e) => setEditOrgId(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">{t("admin.modal.selectOrg")}</option>
                        {createOrganizations.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : activeTab === "organizations" ? (
                  <div>
                    <label className={labelCls}>
                      {t("admin.modal.orgName")}
                    </label>
                    <input
                      type="text"
                      value={editOrgName}
                      onChange={(e) => setEditOrgName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                ) : activeTab === "grades" ? (
                  <div>
                    <label className={labelCls}>
                      {t("admin.modal.gradeName")}
                    </label>
                    <input
                      type="text"
                      value={editGradeName}
                      onChange={(e) => setEditGradeName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className={labelCls}>
                          {t("admin.modal.firstName")}
                        </label>
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelCls}>
                          {t("admin.modal.lastName")}
                        </label>
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>
                        {t("admin.modal.email")}
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        dir="ltr"
                        className={inputCls}
                      />
                    </div>
                    {(activeTab === "students" || activeTab === "teachers") && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.modal.grade")}
                        </label>
                        <select
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          className={selectCls}
                        >
                          <option value="">
                            {t("admin.modal.selectGrade")}
                          </option>
                          {gradesList.map((g) => (
                            <option key={g.id} value={g.id}>
                              {t(`admin.grade.${g.name}`) !==
                              `admin.grade.${g.name}`
                                ? t(`admin.grade.${g.name}`)
                                : g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(activeTab === "students" || activeTab === "teachers") && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.modal.org")}
                        </label>
                        <select
                          value={editOrgId}
                          onChange={(e) => {
                            setEditOrgId(e.target.value);
                            setEditClassId("");
                          }}
                          className={selectCls}
                        >
                          <option value="">{t("admin.modal.selectOrg")}</option>
                          {createOrganizations.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {activeTab === "students" && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.th.class")}
                        </label>
                        <select
                          value={editClassId}
                          onChange={(e) => setEditClassId(e.target.value)}
                          disabled={!editOrgId}
                          className={`${selectCls} disabled:opacity-50`}
                        >
                          <option value="">{t("admin.modal.noClass")}</option>
                          {editClassesOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.classname} ({t(`admin.grade.${c.grade}`)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {activeTab === "teachers" && (
                      <div>
                        <label className={labelCls}>
                          {t("admin.th.class")}
                        </label>
                        <select
                          multiple
                          value={editClassIds}
                          onChange={(e) => {
                            const values = Array.from(
                              e.target.selectedOptions,
                              (option) => option.value,
                            );
                            setEditClassIds(values);
                          }}
                          disabled={!editOrgId}
                          className={`${selectCls} disabled:opacity-50 h-32`}
                        >
                          {editClassesOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.classname} ({t(`admin.grade.${c.grade}`)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="w-full py-3 font-bold text-white rounded-xl disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg,${accent.from},${accent.to})`,
                    boxShadow: `0 4px 16px ${accent.glow}`,
                  }}
                >
                  {isSavingEdit
                    ? t("admin.modal.saving")
                    : editingRow?.isNew
                    ? t("admin.modal.createNewBtn")
                    : t("admin.modal.saveBtn")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ IMPORT ══════════════════ */}
      <ImportWizard
        open={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={() => {
          fetchData();
          fetchStats();
        }}
        activeTab={activeTab}
        organizations={createOrganizations.map((o) => o.name)}
        classes={[]}
        grades={gradesList.map((g) => g.name)}
        token={token}
        t={t}
      />

      {/* ══════════════════ CONFIRMS ══════════════════ */}
      <ConfirmModal
        open={!!confirmDelete}
        title={t("admin.delete.title")}
        message={
          <>
            {t("admin.delete.message")}{" "}
            <strong>{confirmDelete?.name || "—"}</strong>
            {t("admin.delete.messageEnd")}
          </>
        }
        confirmLabel={t("admin.delete.confirm")}
        cancelLabel={t("admin.delete.cancel")}
        confirmColor="bg-red-500 hover:bg-red-600"
        icon={<FaExclamationTriangle />}
        onConfirm={() =>
          confirmDelete && handleDelete(confirmDelete.tab, confirmDelete.row)
        }
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmModal
        open={bulkConfirmOpen}
        title={t("admin.bulk.confirmDelete")}
        message={
          <>
            Delete <strong>{selectedIds.size}</strong> items? This cannot be
            undone.
          </>
        }
        confirmLabel={t("admin.bulk.delete")}
        cancelLabel={t("admin.delete.cancel")}
        confirmColor="bg-red-500 hover:bg-red-600"
        icon={<FaExclamationTriangle />}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
      <ConfirmModal
        open={!!confirmReset}
        title={t("admin.reset.title")}
        message={
          <>
            {t("admin.reset.message")}{" "}
            <strong>{confirmReset?.name || "—"}</strong>
            {t("admin.reset.messageEnd")}
          </>
        }
        confirmLabel={t("admin.reset.confirm")}
        cancelLabel={t("admin.reset.cancel")}
        confirmColor="bg-amber-500 hover:bg-amber-600"
        icon={<FaKey />}
        onConfirm={() =>
          confirmReset && handleResetPassword(confirmReset.userId)
        }
        onCancel={() => setConfirmReset(null)}
      />
    </div>
  );
};

export default UserData;
