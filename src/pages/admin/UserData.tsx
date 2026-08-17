import { API_BASE_URL } from "../../config/api";
import { logoutSession } from "../../utils/session";
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
import { FaExclamationTriangle } from "react-icons/fa";
import { describeApiError } from "../../utils/apiError";
import i18n from "../../i18n";

// ─── Sub-components Imports ───────────────────────────────────────────────────
import { Sidebar } from "./components/Sidebar";
import { AdminHeader } from "./components/AdminHeader";
import { StatsCards } from "./components/StatsCards";
import { FilterBar } from "./components/FilterBar";
import { DataTable } from "./components/DataTable";
import { EditDrawer } from "./components/EditDrawer";
import { CreateWizard } from "./components/CreateWizard";
import { Pagination } from "./components/Pagination";

// ─── Types ────────────────────────────────────────────────────────────────────
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

const TAB_ACCENT: Record<Tab, { from: string; to: string; glow: string; light: string }> = {
  users: { from: "#3b82f6", to: "#2563eb", glow: "rgba(59,130,246,0.35)", light: "#dbeafe" },
  students: { from: "#06b6d4", to: "#0891b2", glow: "rgba(6,182,212,0.35)", light: "#cffafe" },
  teachers: { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.35)", light: "#d1fae5" },
  parents: { from: "#f59e0b", to: "#d97706", glow: "rgba(245,158,11,0.35)", light: "#fef3c7" },
  admins: { from: "#a855f7", to: "#9333ea", glow: "rgba(168,85,247,0.35)", light: "#f3e8ff" },
  classes: { from: "#f43f5e", to: "#e11d48", glow: "rgba(244,63,94,0.35)", light: "#ffe4e6" },
  organizations: { from: "#6366f1", to: "#4f46e5", glow: "rgba(99,102,241,0.35)", light: "#e0e7ff" },
  grades: { from: "#8b5cf6", to: "#7c3aed", glow: "rgba(139,92,246,0.35)", light: "#ede9fe" },
  scores: { from: "#f59e0b", to: "#d97706", glow: "rgba(245,158,11,0.35)", light: "#fef3c7" },
  history: { from: "#10b981", to: "#059669", glow: "rgba(16,185,129,0.35)", light: "#d1fae5" },
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
  scores: `${API_BASE_URL}/admin/scores`,
  history: `${API_BASE_URL}/admin/history`,
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
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Confirm Modal Component
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
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{message}</p>
            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold transition-all shadow-sm ${confirmColor}`}
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

  const handleLogout = async () => {
    await logoutSession();
    window.location.href = "/login";
  };

  const token = localStorage.getItem("token");

  // State Variables
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

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [gradesList, setGradesList] = useState<{ id: number; name: string; organizationId?: number | null }[]>([]);
  const [createOrganizations, setCreateOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [createClasses, setCreateClasses] = useState<{ id: number; classname: string; grade: string; organizationId?: number; gradeId?: number | null }[]>([]);

  // Create Modal Wizard
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Edit Drawer Slide-in
  const [editingRow, setEditingRow] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editOrgId, setEditOrgId] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editClassIds, setEditClassIds] = useState<string[]>([]);
  const [addClassGradeFilter, setAddClassGradeFilter] = useState("");
  const [classToAdd, setClassToAdd] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editGradeName, setEditGradeName] = useState("");
  const [editClassesOptions, setEditClassesOptions] = useState<{ id: number; classname: string; grade: string; organizationId?: number; gradeId?: number | null }[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Confirms
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string; tab: Tab; row: any } | null>(null);
  const [confirmReset, setConfirmReset] = useState<{ userId: number; name: string } | null>(null);

  // Import / Export
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      if (sortField && activeTab === "scores") {
        params.sortBy = sortField;
        if (sortDir) params.sortDir = sortDir;
      }
      const res = await axios.get(ENDPOINTS[activeTab], {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setRows(res.data.data);
      setTotal(res.data.total);
      if (res.data.stats) {
        setStats((prev) => ({ ...prev, ...res.data.stats }));
      }
      loadedTabRef.current = activeTab;
    } catch (err: any) {
      console.error(`[Admin UserData] fetchData failed for tab ${activeTab}:`, err?.response?.data || err?.message || err);
      toast.error(describeApiError(err, (key, options) => t(key, options)));
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
    sortField,
    sortDir,
    t,
    token,
  ]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      // One round trip for all dashboard counters (GET /admin/stats) —
      // previously four limit=1 list requests.
      const res = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats((prev) => ({ ...prev, ...res.data.data }));
    } catch (err) {
      console.error("[Admin UserData] fetchStats failed:", err);
      toast.error(describeApiError(err, (key, options) => t(key, options)));
    } finally {
      setStatsLoading(false);
    }
  }, [token, t]);

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

  // Edit Drawer triggers
  const openEditDrawer = (row: any) => {
    setEditingRow(row);
    setEditFirstName(row.firstName ?? row.user?.firstName ?? row.User?.firstName ?? "");
    setEditLastName(row.lastName ?? row.user?.lastName ?? row.User?.lastName ?? "");
    setEditEmail(row.email ?? row.user?.email ?? row.User?.email ?? "");
    setEditGrade(row.gradeId ? String(row.gradeId) : row.grade ?? "");
    setEditOrgId(String(row.organizationId ?? row.Organization?.id ?? ""));
    setEditClassId(String(row.classId ?? ""));
    setEditClassIds(row.Classes ? row.Classes.map((c: any) => String(c.id)) : []);
    setAddClassGradeFilter("");
    setClassToAdd("");
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
    setEditOrgId("");
  };

  useEffect(() => {
    const resolvedRole =
      activeTab === "students"
        ? "Student"
        : activeTab === "teachers"
        ? "Teacher"
        : activeTab === "parents"
        ? "Parent"
        : activeTab === "admins"
        ? "Admin"
        : editingRow?.role;
    const isStudentOrTeacher = resolvedRole === "Student" || resolvedRole === "Teacher";

    if (!editingRow || !isStudentOrTeacher) {
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
  }, [showCreateModal, editingRow, token, showImport]);

  const fetchClassesForOrg = async (orgId: string) => {
    if (!orgId) {
      setCreateClasses([]);
      return;
    }
    try {
      const r = await axios.get(`${API_BASE_URL}/admin/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCreateClasses(r.data.data.Classes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async () => {
    const isNew = !!editingRow?.isNew;
    if (activeTab === "classes" && (!editClassName || !editGrade || !editOrgId)) {
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
          : await axios.patch(`${API_BASE_URL}/admin/classes/${editingRow.id}`, body, {
              headers: { Authorization: `Bearer ${token}` },
            });
      } else if (activeTab === "organizations") {
        const body = { name: editOrgName };
        isNew
          ? await axios.post(`${API_BASE_URL}/admin/organizations`, body, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.patch(`${API_BASE_URL}/admin/organizations/${editingRow.id}`, body, {
              headers: { Authorization: `Bearer ${token}` },
            });
      } else if (activeTab === "grades") {
        const body = {
          name: editGradeName,
          organizationId: editOrgId ? Number(editOrgId) : undefined,
        };
        isNew
          ? await axios.post(`${API_BASE_URL}/admin/grades`, body, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.patch(`${API_BASE_URL}/admin/grades/${editingRow.id}`, body, {
              headers: { Authorization: `Bearer ${token}` },
            });
      } else {
        const userId = getUserId(activeTab as UserLikeTab, editingRow);
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
            classId: activeTab === "students" ? (editClassId ? Number(editClassId) : null) : undefined,
            classIds: activeTab === "teachers" ? editClassIds.map(Number) : undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      toast.success(isNew ? t("admin.toast.createSuccess") : t("admin.toast.saveSuccess"));
      setEditingRow(null);
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error(describeApiError(error, (key, options) => t(key, options)));
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
      if (data?.studentCount !== undefined || data?.teacherCount !== undefined) {
        toast.error(
          `${t("admin.toast.deleteHasRelated")} ${data.studentCount ?? 0} ${t("admin.toast.students")}, ${
            data.teacherCount ?? 0
          } ${t("admin.toast.teachers")}, ${data.classCount ?? 0} ${t("admin.toast.classes")}`,
        );
      } else {
        toast.error(describeApiError(error, (key, options) => t(key, options)));
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
        const r = rows.find((row) => getUserId(activeTab as UserLikeTab, row) === id);
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

  const handleCreateUser = async (userData: any) => {
    setIsCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/users`,
        userData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCreatedCredentials({
        email: res.data.data.email,
        password: res.data.password,
      });
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error(describeApiError(error, (key, options) => t(key, options)));
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
      toast.success(`${t("admin.toast.resetSuccess")} \u200E${res.data.newPassword}\u200E`);
    } catch (error) {
      toast.error(describeApiError(error, (key, options) => t(key, options)));
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
      if (activeTab === "scores") {
        csvHeaders = [
          "id",
          "firstName",
          "lastName",
          "email",
          "school",
          "class",
          "grade",
          "level",
          "medal",
          "xp",
          "treeProgress",
          "snabelYellow",
          "snabelBlue",
          "snabelRed",
          "totalSanabel",
        ];
        mapped = data.map((r) => ({
          id: r.id,
          firstName: r.user?.firstName,
          lastName: r.user?.lastName,
          email: r.user?.email,
          school: r.organization?.name,
          class: r.Class?.classname,
          grade: r.GradeEntity?.name ?? r.grade,
          level: r.level || 1,
          medal: r.medal || 1,
          xp: r.xp || 0,
          treeProgress: r.treeProgress || 1,
          snabelYellow: r.snabelYellow || 0,
          snabelBlue: r.snabelBlue || 0,
          snabelRed: r.snabelRed || 0,
          totalSanabel: (r.snabelYellow || 0) + (r.snabelBlue || 0) + (r.snabelRed || 0),
        }));
      } else if (activeTab === "history") {
        csvHeaders = [
          "id",
          "date",
          "studentFirstName",
          "studentLastName",
          "studentEmail",
          "school",
          "class",
          "taskTitle",
          "taskCategory",
          "xp",
          "snabelYellow",
          "snabelBlue",
          "snabelRed",
        ];
        mapped = data.map((r) => ({
          id: r.id,
          date: r.updatedAt || r.createdAt || r.date,
          studentFirstName: r.Student?.user?.firstName,
          studentLastName: r.Student?.user?.lastName,
          studentEmail: r.Student?.user?.email,
          school: r.Student?.organization?.name,
          class: r.Student?.Class?.classname,
          taskTitle: r.Task?.title,
          taskCategory: r.Task?.category?.title || r.Task?.type,
          xp: r.Task?.xp || 0,
          snabelYellow: r.Task?.snabelYellow || 0,
          snabelBlue: r.Task?.snabelBlue || 0,
          snabelRed: r.Task?.snabelRed || 0,
        }));
      } else if (activeTab === "students") {
        csvHeaders = ["id", "firstName", "lastName", "email", "grade", "school", "class"];
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
      } else if (activeTab === "teachers") {
        csvHeaders = ["id", "firstName", "lastName", "email", "grades", "classes", "school"];
        mapped = data.map((r) => ({
          id: r.id,
          firstName: r.user?.firstName ?? r.User?.firstName,
          lastName: r.user?.lastName ?? r.User?.lastName,
          email: r.user?.email ?? r.User?.email,
          grades: r.Classes
            ? Array.from(new Set(r.Classes.map((c: any) => c.GradeEntity?.name || c.grade))).join(" | ")
            : "",
          classes: r.Classes ? r.Classes.map((c: any) => c.classname).join(" | ") : "",
          school: r.Organization?.name ?? r.organization?.name,
        }));
      } else if (activeTab === "parents") {
        csvHeaders = ["id", "firstName", "lastName", "email", "createdAt"];
        mapped = data.map((r) => ({
          id: r.id,
          firstName: r.user?.firstName ?? r.User?.firstName,
          lastName: r.user?.lastName ?? r.User?.lastName,
          email: r.user?.email ?? r.User?.email,
          createdAt: r.createdAt,
        }));
      } else {
        csvHeaders = ["id", "firstName", "lastName", "email", "role", "createdAt"];
        mapped = data.map((r) => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          role: r.role,
          createdAt: r.createdAt,
        }));
      }
      downloadCSV(arrayToCSV(mapped, csvHeaders), `${activeTab}_export_${Date.now()}.csv`);
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

  const accent = TAB_ACCENT[activeTab];

  const createLabel =
    activeTab === "classes"
      ? t("admin.create.class")
      : activeTab === "organizations"
      ? t("admin.create.organization")
      : activeTab === "grades"
      ? t("admin.create.grade")
      : t("admin.create.user");

  return (
    <div
      className="flex w-full min-h-screen font-sans"
      style={{ background: "#f8fafc" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
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
        toastStyle={{ borderRadius: 16 }}
      />

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        totalCounts={
          {
            users: stats.users ?? 0,
            students: stats.students ?? 0,
            teachers: stats.teachers ?? 0,
            parents: stats.parents ?? 0,
            admins: 0,
            classes: 0,
            organizations: 0,
            grades: 0,
            scores: 0,
            history: 0,
          }
        }
        accentColor={accent.from}
      />

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main className="flex flex-col flex-1 min-h-screen overflow-hidden">
        {/* Header */}
        <AdminHeader
          activeTab={activeTab}
          total={total}
          createLabel={createLabel}
          onCreateClick={
            activeTab === "classes"
              ? openCreateClassModal
              : activeTab === "organizations"
              ? openCreateOrgModal
              : activeTab === "grades"
              ? openCreateGradeModal
              : () => setShowCreateModal(true)
          }
          onExportClick={handleExportCSV}
          onImportClick={() => setShowImport(true)}
          onLanguageToggle={toggleLanguage}
          exporting={exporting}
          accentColor={accent.from}
          isImportable={activeTab !== "users" && activeTab !== "admins"}
        />

        {/* Dash Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          {/* Lightweight KPI Cards & Analytics drawer */}
          <StatsCards stats={stats} rows={rows} activeTab={activeTab} accentColor={accent.from} loading={statsLoading} />

          {/* Filter, Search bar */}
          <FilterBar
            search={search}
            onSearchChange={(val) => {
              setPage(1);
              setSearch(val);
            }}
            activeTab={activeTab}
            filterGradeId={filterGradeId}
            setFilterGradeId={(v) => {
              setPage(1);
              setFilterGradeId(v);
            }}
            filterOrgId={filterOrgId}
            setFilterOrgId={(v) => {
              setPage(1);
              setFilterOrgId(v);
            }}
            filterRole={filterRole}
            setFilterRole={(v) => {
              setPage(1);
              setFilterRole(v);
            }}
            filterVerified={filterVerified}
            setFilterVerified={(v) => {
              setPage(1);
              setFilterVerified(v);
            }}
            gradesList={gradesList}
            organizations={createOrganizations}
            accentColor={accent.from}
          />

          {/* Core Management Table */}
          <DataTable
            activeTab={activeTab}
            rows={sortedRows}
            loading={loading}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEditClick={openEditDrawer}
            onDeleteClick={(row) =>
              setConfirmDelete({ id: getDeleteId(activeTab, row), name: getName(activeTab, row), tab: activeTab, row })
            }
            onResetPasswordClick={(row) =>
              setConfirmReset({ userId: getUserId(activeTab as UserLikeTab, row), name: getName(activeTab, row) })
            }
            accentColor={accent.from}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            search={search}
            gradesList={gradesList}
            organizations={createOrganizations}
          />

          {/* Styled SaaS Pagination */}
          {total > limit && (
            <Pagination page={page} setPage={setPage} total={total} limit={limit} accentColor={accent.from} />
          )}
        </div>
      </main>

      {/* ══════════════════ EDIT DRAWER ══════════════════ */}
      <AnimatePresence>
        {editingRow && (
          <EditDrawer
            activeTab={activeTab}
            editingRow={editingRow}
            onClose={() => setEditingRow(null)}
            onSave={handleSaveEdit}
            isSaving={isSavingEdit}
            accentColor={accent.from}
            editFirstName={editFirstName}
            setEditFirstName={setEditFirstName}
            editLastName={editLastName}
            setEditLastName={setEditLastName}
            editEmail={editEmail}
            setEditEmail={setEditEmail}
            editGrade={editGrade}
            setEditGrade={setEditGrade}
            editOrgId={editOrgId}
            setEditOrgId={setEditOrgId}
            editClassId={editClassId}
            setEditClassId={setEditClassId}
            editClassIds={editClassIds}
            setEditClassIds={setEditClassIds}
            addClassGradeFilter={addClassGradeFilter}
            setAddClassGradeFilter={setAddClassGradeFilter}
            classToAdd={classToAdd}
            setClassToAdd={setClassToAdd}
            editClassName={editClassName}
            setEditClassName={setEditClassName}
            editOrgName={editOrgName}
            setEditOrgName={setEditOrgName}
            editGradeName={editGradeName}
            setEditGradeName={setEditGradeName}
            gradesList={gradesList}
            organizations={createOrganizations}
            classesOptions={editClassesOptions}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ CREATE USER WIZARD ══════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateWizard
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateUser}
            isCreating={isCreating}
            createdCredentials={createdCredentials}
            onDone={() => setCreatedCredentials(null)}
            accentColor={accent.from}
            gradesList={gradesList}
            organizations={createOrganizations}
            classes={createClasses}
            fetchClassesForOrg={fetchClassesForOrg}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ BULK ACTIONS DOCK ══════════════════ */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl bg-slate-900 border border-slate-800"
          >
            <span className="text-sm font-semibold text-white">
              {selectedIds.size} {t("admin.bulk.selected")}
            </span>
            <div className="w-px h-5 bg-slate-800" />
            <button
              onClick={() => setBulkConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
            >
              <span>{t("admin.bulk.delete")}</span>
            </button>
            {isUserLikeTab(activeTab) && (
              <button
                onClick={handleBulkReset}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
              >
                <span>{t("admin.bulk.resetPasswords")}</span>
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {t("admin.bulk.deselectAll")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ IMPORT EXCEL MODAL ══════════════════ */}
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
        token={token ?? ""}
        t={t}
      />

      {/* ══════════════════ CONFIRM MODALS ══════════════════ */}
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
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.tab, confirmDelete.row)}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmModal
        open={bulkConfirmOpen}
        title={t("admin.bulk.confirmDelete")}
        message={
          <>
            Delete <strong>{selectedIds.size}</strong> items? This cannot be undone.
          </>
        }
        confirmLabel={t("admin.bulk.delete")}
        cancelLabel={t("إلغاء")}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
      <ConfirmModal
        open={!!confirmReset}
        title={t("admin.reset.title")}
        message={
          <>
            Reset password for <strong>{confirmReset?.name || "—"}</strong>?
          </>
        }
        confirmLabel={t("admin.reset.confirm")}
        cancelLabel={t("إلغاء")}
        confirmColor="bg-amber-500 hover:bg-amber-600"
        onConfirm={() => confirmReset && handleResetPassword(confirmReset.userId)}
        onCancel={() => setConfirmReset(null)}
      />
    </div>
  );
};

export default UserData;
