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
import { AdminHeader, AdminIdentity } from "./components/AdminHeader";
import { StatsCards } from "./components/StatsCards";
import { FilterBar } from "./components/FilterBar";
import { DataTable } from "./components/DataTable";
import { EditDrawer } from "./components/EditDrawer";
import { CreateWizard } from "./components/CreateWizard";
import { Pagination } from "./components/Pagination";
import { AppVersionControl } from "./components/AppVersionControl";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";
import { AdminPage } from "./components/ui/layout";
import {
  AnalyticsSection,
  NavItem,
  Tab,
  findNavGroup,
  findNavItem,
  scopedAdminHiddenTabs,
} from "./navigation";
import { BRAND, ENTITY_ACCENT, SURFACE, cx } from "./theme";
import { useAdminShell } from "./useAdminShell";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  app_version: `${API_BASE_URL}/admin/app-version`,
  analytics: `${API_BASE_URL}/admin/analytics/overview`,
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

  // Which analytics section the sidebar has selected. The analytics page reads
  // this instead of owning its own section tabs.
  const [analyticsSection, setAnalyticsSection] = useState<AnalyticsSection>("overview");

  // Sidebar collapse / drawer state, persisted where the browser allows it.
  const shell = useAdminShell();

  // Admin scope: a number = school admin locked to that organization,
  // null = super admin. Drives which tabs/filters/actions are offered.
  const [scopedOrganizationId, setScopedOrganizationId] = useState<number | null>(null);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const isScopedAdmin = scopedOrganizationId !== null;
  // Derived from the navigation tree, so a new Super-Admin-only page is hidden
  // from School Admins automatically. The server gate is still what enforces it.
  const hiddenTabs = useMemo<Tab[]>(
    () => (isScopedAdmin ? scopedAdminHiddenTabs() : []),
    [isScopedAdmin],
  );

  // Actionable sidebar badge. Sourced from the analytics overview, which is
  // Super-Admin-only, so a School Admin never requests it and never shows it.
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
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
    if (activeTab === "app_version" || activeTab === "analytics") {
      setLoading(false);
      return;
    }
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

  // Resolve this admin's own scope once, so the UI shows only what applies.
  useEffect(() => {
    if (!authorized || !token) return;
    axios
      .get(`${API_BASE_URL}/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const profile = r.data.data;
        const organizationId = profile?.organizationId ?? null;
        setScopedOrganizationId(organizationId);
        setIdentity({
          name:
            `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
            profile?.email ||
            "",
          email: profile?.email ?? "",
          isSuperAdmin: profile?.isSuperAdmin ?? organizationId === null,
        });
      })
      .catch((err) => {
        console.error("[Admin UserData] failed to resolve admin scope:", err);
        toast.error(describeApiError(err, (key, options) => t(key, options)));
      });
  }, [authorized, token, t]);

  // Pending approvals for the sidebar badge. `/admin/analytics/overview` is
  // Super-Admin-only and returns 403 to a School Admin, so it is only requested
  // once scope is known to be global.
  useEffect(() => {
    if (!authorized || !token || isScopedAdmin || !identity?.isSuperAdmin) return;
    let cancelled = false;
    axios
      .get(`${API_BASE_URL}/admin/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      })
      .then((r) => {
        if (cancelled) return;
        const pending = r.data?.data?.approvals?.pending;
        setPendingApprovals(typeof pending === "number" ? pending : null);
      })
      .catch(() => {
        // A badge is not worth a toast. Leaving it null shows no badge at all,
        // which is honest: an unknown queue length must not render as 0.
        if (!cancelled) setPendingApprovals(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authorized, token, isScopedAdmin, identity?.isSuperAdmin]);

  // A scoped admin must never sit on a tab that doesn't apply to them
  // (e.g. after their scope is assigned while the panel is open).
  useEffect(() => {
    if (hiddenTabs.includes(activeTab)) setActiveTab("students");
  }, [hiddenTabs, activeTab]);

  useEffect(() => {
    if (authorized) fetchGradesList();
  }, [authorized, fetchGradesList, activeTab]);

  const handleTabChange = (tab: Tab, nextSearch = "") => {
    setActiveTab(tab);
    setRows([]);
    setSearch(nextSearch);
    setPage(1);
    setSelectedIds(new Set());
    setFilterGradeId("");
    setFilterOrgId("");
    setFilterRole("");
    setFilterVerified(false);
    setSortField(null);
    setSortDir(null);
  };

  const handleNavigate = (item: NavItem) => {
    if (item.section) setAnalyticsSection(item.section);
    handleTabChange(item.tab);
    // In drawer layout the overlay dismisses itself once a page is chosen.
    shell.handleNavigate();
  };

  // A global-search hit opens that entity's page with the query applied as its
  // filter. The panel has no per-row detail route for organizations or classes,
  // so a filtered list is the only destination that actually exists.
  const handleSearchSelect = (tab: Tab, query: string) => {
    if (hiddenTabs.includes(tab)) return;
    handleTabChange(tab, query);
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
    // Select controls use database IDs. The legacy free-text grade is display
    // fallback only and must not become an invalid <option> value.
    setEditGrade(row.gradeId ? String(row.gradeId) : "");
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

  const handleImpersonateStudent = async (row: any) => {
    const studentId = row.id ?? row.studentId ?? row.userId;
    if (!studentId) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/students/${studentId}/impersonate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.data?.token) {
        // Preserve admin return credentials
        const currentAdminToken = localStorage.getItem("token");
        const currentAdminRole = localStorage.getItem("role") || "Admin";
        if (currentAdminToken) {
          localStorage.setItem("adminReturnToken", currentAdminToken);
          localStorage.setItem("adminReturnRole", currentAdminRole);
          const studentName = getName(activeTab, row) || res.data.data.user?.firstName || "Student";
          localStorage.setItem("adminImpersonatedStudentName", studentName);
        }

        // Set student session in storage
        localStorage.setItem("token", res.data.data.token);
        if (res.data.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.data.refreshToken);
        }
        localStorage.setItem("role", "Student");
        localStorage.setItem("keepLoggedIn", "true");
        localStorage.setItem(`tutorialComplete-${res.data.data.user?.email}`, "true");
        localStorage.setItem("firstTimer", "false");

        toast.success(t("admin.impersonate.success"));
        setTimeout(() => {
          window.location.href = "/student/home";
        }, 300);
      }
    } catch (err: any) {
      console.error("Impersonation error:", err);
      toast.error(describeApiError(err, (key, options) => t(key, options)));
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

  const accentColor = ENTITY_ACCENT[activeTab];

  const activeNavItem = findNavItem(activeTab, analyticsSection);
  const activeNavGroup = findNavGroup(activeTab, analyticsSection);
  const pageTitle = activeNavItem ? t(activeNavItem.labelKey) : "";
  // One crumb: the group. The page's own name is already the heading beside it.
  const breadcrumbs = activeNavGroup ? [t(activeNavGroup.labelKey)] : undefined;

  // `admin.header.description.*` exists for the ten record pages only; the
  // analytics sections and app settings have no such key, so they get no
  // subtitle rather than a rendered key name.
  const DESCRIBED_TABS: Tab[] = [
    "users",
    "students",
    "teachers",
    "parents",
    "admins",
    "classes",
    "organizations",
    "grades",
    "scores",
    "history",
  ];
  const pageDescription = DESCRIBED_TABS.includes(activeTab)
    ? t(`admin.header.description.${activeTab}`)
    : undefined;

  // Analytics and app settings are not record lists, so they get no create
  // button rather than a create button that does nothing.
  const createLabel =
    activeTab === "analytics" || activeTab === "app_version"
      ? undefined
      : activeTab === "classes"
      ? t("admin.create.class")
      : activeTab === "organizations"
      ? t("admin.create.organization")
      : activeTab === "grades"
      ? t("admin.create.grade")
      : t("admin.create.user");

  const onCreateClick =
    activeTab === "classes"
      ? openCreateClassModal
      : activeTab === "organizations"
      ? openCreateOrgModal
      : activeTab === "grades"
      ? openCreateGradeModal
      : () => setShowCreateModal(true);

  // A scoped admin's organizations list contains exactly their own school, so
  // its name is already loaded — no extra request to label their scope.
  const identityWithScope: AdminIdentity | null = identity
    ? {
        ...identity,
        organizationName: isScopedAdmin
          ? createOrganizations.find((org) => org.id === scopedOrganizationId)?.name ??
            null
          : null,
      }
    : null;

  return (
    <div
      className={cx("flex w-full min-h-screen font-sans", SURFACE.page)}
      // Exposed as a CSS variable so primitives can paint the brand colour
      // without importing the token at every call site.
      style={{ ["--admin-primary" as string]: BRAND.primary }}
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
      {/* Docked rail on desktop, overlay drawer below `lg`. In drawer layout it
          renders as a fixed layer, so the main column keeps its full width. */}
      <Sidebar
        activeTab={activeTab}
        activeSection={analyticsSection}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        badges={{ pendingApprovals }}
        hiddenTabs={hiddenTabs}
        isCollapsed={shell.isCollapsed}
        isDrawerLayout={shell.isDrawerLayout}
        isDrawerOpen={shell.isDrawerOpen}
        onToggle={shell.toggleSidebar}
        onCloseDrawer={shell.closeDrawer}
      />

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      {/* `min-w-0` is what stops a wide table from pushing the flex row past
          the viewport and scrolling the whole page sideways. */}
      <main className="flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Header */}
        <AdminHeader
          title={pageTitle}
          breadcrumbs={breadcrumbs}
          description={pageDescription}
          onToggleSidebar={shell.toggleSidebar}
          isDrawerLayout={shell.isDrawerLayout}
          createLabel={createLabel}
          onCreateClick={createLabel ? onCreateClick : undefined}
          onExportClick={handleExportCSV}
          onImportClick={() => setShowImport(true)}
          onLanguageToggle={toggleLanguage}
          onLogout={handleLogout}
          exporting={exporting}
          isImportable={
            activeTab !== "users" &&
            activeTab !== "admins" &&
            activeTab !== "analytics" &&
            activeTab !== "app_version"
          }
          identity={identityWithScope}
          token={token}
          onSearchSelect={handleSearchSelect}
          canSearchOrganizations={!isScopedAdmin}
        />

        {/* Dash Content */}
        {/* Analytics goes full width; record pages get a reading measure so a
            wide monitor does not stretch a table to unreadable line lengths. */}
        <AdminPage width={activeTab === "analytics" ? "full" : "content"}>
          {activeTab === "analytics" ? (
            <AnalyticsDashboard accentColor={accentColor} section={analyticsSection} />
          ) : activeTab === "app_version" ? (
            <AppVersionControl />
          ) : (
            <>
              {/* Lightweight KPI Cards & Analytics drawer */}
              <StatsCards stats={stats} rows={rows} activeTab={activeTab} accentColor={accentColor} loading={statsLoading} />

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
                accentColor={accentColor}
                hideSchoolFilter={isScopedAdmin}
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
                onImpersonateStudent={handleImpersonateStudent}
                accentColor={accentColor}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                search={search}
                gradesList={gradesList}
                organizations={createOrganizations}
              />

              {/* Styled SaaS Pagination */}
              {total > limit && (
                <Pagination page={page} setPage={setPage} total={total} limit={limit} accentColor={accentColor} />
              )}
            </>
          )}
        </AdminPage>
      </main>

      {/* ══════════════════ EDIT DRAWER ══════════════════ */}
      <AnimatePresence>
        {editingRow && (
          <EditDrawer
            activeTab={activeTab}
            editingRow={editingRow}
            onClose={() => setEditingRow(null)}
            onSave={handleSaveEdit}
            onImpersonateStudent={handleImpersonateStudent}
            isSaving={isSavingEdit}
            accentColor={accentColor}
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
            accentColor={accentColor}
            gradesList={gradesList}
            organizations={createOrganizations}
            classes={createClasses}
            fetchClassesForOrg={fetchClassesForOrg}
            scopedOrganizationId={scopedOrganizationId}
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
            {t("admin.deleteItemsConfirm", { count: selectedIds.size })}
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
            {t("admin.resetPasswordFor", { name: confirmReset?.name || "—" })}
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
