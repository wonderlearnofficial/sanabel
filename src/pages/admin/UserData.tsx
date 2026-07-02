import { API_BASE_URL } from "../../config/api";
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
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
  FaCheckCircle,
  FaTimesCircle,
  FaGlobe,
  FaExclamationTriangle,
  FaInbox,
} from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { getErrorMessage } from "../../config/getErrorMessage";
import i18n from "../../i18n";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

type Tab = "users" | "students" | "teachers" | "parents" | "admins" | "classes" | "organizations";
type UserLikeTab = "users" | "students" | "teachers" | "parents" | "admins";

const USER_LIKE_TABS: UserLikeTab[] = ["users", "students", "teachers", "parents", "admins"];
const isUserLikeTab = (tab: Tab): tab is UserLikeTab =>
  (USER_LIKE_TABS as Tab[]).includes(tab);

// ────────────────────────────────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────────────────────────────────

const TAB_KEYS: Tab[] = ["users", "students", "teachers", "parents", "admins", "classes", "organizations"];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  users: <FaUsers size={18} />,
  students: <FaChild size={18} />,
  teachers: <FaChalkboardTeacher size={18} />,
  parents: <FaUserFriends size={18} />,
  admins: <FaUserShield size={18} />,
  classes: <FaSchool size={18} />,
  organizations: <FaBuilding size={18} />,
};

const TAB_I18N: Record<Tab, string> = {
  users: "admin.tab.users",
  students: "admin.tab.students",
  teachers: "admin.tab.teachers",
  parents: "admin.tab.parents",
  admins: "admin.tab.admins",
  classes: "admin.tab.classes",
  organizations: "admin.tab.organizations",
};

const TAB_COLORS: Record<Tab, string> = {
  users: "from-blue-500 to-blue-600",
  students: "from-cyan-500 to-cyan-600",
  teachers: "from-emerald-500 to-emerald-600",
  parents: "from-amber-500 to-amber-600",
  admins: "from-purple-500 to-purple-600",
  classes: "from-rose-500 to-rose-600",
  organizations: "from-indigo-500 to-indigo-600",
};

const TAB_BG_COLORS: Record<Tab, string> = {
  users: "bg-blue-50 text-blue-600",
  students: "bg-cyan-50 text-cyan-600",
  teachers: "bg-emerald-50 text-emerald-600",
  parents: "bg-amber-50 text-amber-600",
  admins: "bg-purple-50 text-purple-600",
  classes: "bg-rose-50 text-rose-600",
  organizations: "bg-indigo-50 text-indigo-600",
};

const ENDPOINTS: Record<Tab, string> = {
  users: `${API_BASE_URL}/admin/users`,
  students: `${API_BASE_URL}/admin/students`,
  teachers: `${API_BASE_URL}/admin/teachers`,
  parents: `${API_BASE_URL}/admin/parents`,
  admins: `${API_BASE_URL}/admin/users`,
  classes: `${API_BASE_URL}/admin/classes`,
  organizations: `${API_BASE_URL}/admin/organizations`,
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

const getUserId = (tab: UserLikeTab, row: any): number => {
  if (tab === "users" || tab === "admins") return row.id;
  return row.userId;
};

const getName = (tab: Tab, row: any): string => {
  if (tab === "users" || tab === "admins")
    return `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
  return `${row.user?.firstName ?? row.User?.firstName ?? ""} ${
    row.user?.lastName ?? row.User?.lastName ?? ""
  }`.trim();
};

const getEmail = (tab: Tab, row: any): string => {
  if (tab === "users" || tab === "admins") return row.email;
  return row.user?.email ?? row.User?.email ?? "";
};

const getDeleteId = (tab: Tab, row: any): number =>
  isUserLikeTab(tab) ? getUserId(tab, row) : row.id;

// ────────────────────────────────────────────────────────────────────
// Role badge component
// ────────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  Student: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Teacher: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Parent: "bg-amber-50 text-amber-700 border-amber-200",
  Admin: "bg-purple-50 text-purple-700 border-purple-200",
};

const RoleBadge: React.FC<{ role: string; t: (k: string) => string }> = ({ role, t }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLES[role] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
    {t(`admin.role.${role}`)}
  </span>
);

// ────────────────────────────────────────────────────────────────────
// Skeleton rows for loading state
// ────────────────────────────────────────────────────────────────────

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className="w-full h-4 rounded-md bg-gray-200 animate-pulse" style={{ maxWidth: i === 0 ? 40 : i === cols - 1 ? 80 : 120 }} />
      </td>
    ))}
  </tr>
);

// ────────────────────────────────────────────────────────────────────
// Confirmation Modal
// ────────────────────────────────────────────────────────────────────

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
  open, title, message, confirmLabel, cancelLabel, confirmColor = "bg-red-500 hover:bg-red-600", icon, onConfirm, onCancel,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
            {icon && <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-500 text-2xl">{icon}</div>}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={onCancel} className="flex-1 py-2.5 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                {cancelLabel}
              </button>
              <button onClick={onConfirm} className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold transition-all ${confirmColor}`}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────

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
    } else {
      setAuthorized(true);
    }
  }, []);

  // ── Data state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const limit = 25;

  // ── Stats state ─────────────────────────────────────────────────
  const [stats, setStats] = useState<Record<string, number>>({});

  // ── Create user modal ───────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState<"Student" | "Teacher" | "Parent" | "Admin">("Student");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createGrade, setCreateGrade] = useState("");
  const [createOrgId, setCreateOrgId] = useState("");
  const [createClassId, setCreateClassId] = useState("");
  const [createOrganizations, setCreateOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [createClasses, setCreateClasses] = useState<{ id: number; classname: string; category: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // ── Edit modal ──────────────────────────────────────────────────
  const [editingRow, setEditingRow] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editOrgId, setEditOrgId] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgType, setEditOrgType] = useState("School");
  const [editClassesOptions, setEditClassesOptions] = useState<{ id: number; classname: string; category: string }[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // ── Confirmation dialogs ────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string; tab: Tab; row: any } | null>(null);
  const [confirmReset, setConfirmReset] = useState<{ userId: number; name: string } | null>(null);

  // ── Refs for keyboard handling ──────────────────────────────────
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Language toggle ─────────────────────────────────────────────
  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    const dir = newLang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("dir", dir);
    document.documentElement.setAttribute("dir", dir);
  };

  // ── Fetch data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (activeTab === "admins") params.role = "Admin";

      const response = await axios.get(ENDPOINTS[activeTab], {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setRows(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error(t("admin.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, t]);

  // ── Fetch stats ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const [usersRes, studentsRes, teachersRes, parentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1 } }),
        axios.get(`${API_BASE_URL}/admin/students`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1 } }),
        axios.get(`${API_BASE_URL}/admin/teachers`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1 } }),
        axios.get(`${API_BASE_URL}/admin/parents`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1 } }),
      ]);
      setStats({
        users: usersRes.data.total ?? 0,
        students: studentsRes.data.total ?? 0,
        teachers: teachersRes.data.total ?? 0,
        parents: parentsRes.data.total ?? 0,
      });
    } catch {
      /* silently ignore stats errors */
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [authorized, fetchData]);

  useEffect(() => {
    if (authorized) fetchStats();
  }, [authorized, fetchStats]);

  // ── Tab change ──────────────────────────────────────────────────
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch("");
    setPage(1);
  };

  // ── Open edit modal ─────────────────────────────────────────────
  const openEditModal = (row: any) => {
    setEditingRow(row);
    setEditFirstName(row.firstName ?? row.user?.firstName ?? row.User?.firstName ?? "");
    setEditLastName(row.lastName ?? row.user?.lastName ?? row.User?.lastName ?? "");
    setEditEmail(row.email ?? row.user?.email ?? row.User?.email ?? "");
    setEditGrade(row.grade ?? "");
    setEditOrgId(String(row.organizationId ?? row.Organization?.id ?? ""));
    setEditClassId(String(row.classId ?? ""));
    setEditClassName(row.classname ?? "");
    setEditCategory(row.category ?? "");
    setEditOrgName(row.name ?? "");
    setEditOrgType(row.type ?? "School");
  };

  const openCreateClassModal = () => {
    setEditingRow({ isNew: true });
    setEditClassName("");
    setEditCategory("");
    setEditOrgId("");
  };

  const openCreateOrgModal = () => {
    setEditingRow({ isNew: true });
    setEditOrgName("");
    setEditOrgType("School");
  };

  // ── Fetch edit classes ──────────────────────────────────────────
  useEffect(() => {
    if (!editingRow || activeTab !== "students") {
      setEditClassesOptions([]);
      return;
    }
    if (!editOrgId) {
      setEditClassesOptions([]);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/admin/organizations/${editOrgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setEditClassesOptions(response.data.data.Classes || []))
      .catch((error) => console.error("Error fetching classes:", error));
  }, [editingRow, editOrgId, activeTab]);

  // ── Save edit ───────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    const isNew = !!editingRow?.isNew;

    if (activeTab === "classes" && (!editClassName || !editCategory || !editOrgId)) {
      toast.error(t("admin.toast.classNameCategoryOrgRequired"));
      return;
    }
    if (activeTab === "organizations" && !editOrgName) {
      toast.error(t("admin.toast.orgNameRequired"));
      return;
    }

    const token = localStorage.getItem("token");
    setIsSavingEdit(true);
    try {
      if (activeTab === "classes") {
        const body = { classname: editClassName, category: editCategory, organizationId: editOrgId ? Number(editOrgId) : undefined };
        if (isNew) {
          await axios.post(`${API_BASE_URL}/admin/classes`, body, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          await axios.patch(`${API_BASE_URL}/admin/classes/${editingRow.id}`, body, { headers: { Authorization: `Bearer ${token}` } });
        }
      } else if (activeTab === "organizations") {
        const body = { name: editOrgName, type: editOrgType };
        if (isNew) {
          await axios.post(`${API_BASE_URL}/admin/organizations`, body, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          await axios.patch(`${API_BASE_URL}/admin/organizations/${editingRow.id}`, body, { headers: { Authorization: `Bearer ${token}` } });
        }
      } else {
        const userId = getUserId(activeTab, editingRow);
        await axios.patch(
          `${API_BASE_URL}/admin/users/${userId}`,
          {
            firstName: editFirstName,
            lastName: editLastName,
            email: editEmail,
            grade: activeTab === "students" ? editGrade : undefined,
            organizationId:
              activeTab === "students" || activeTab === "teachers"
                ? (editOrgId ? Number(editOrgId) : undefined)
                : undefined,
            classId: activeTab === "students" ? (editClassId ? Number(editClassId) : null) : undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toast.success(isNew ? t("admin.toast.createSuccess") : t("admin.toast.saveSuccess"));
      setEditingRow(null);
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error(getErrorMessage(error, t("admin.toast.saveFailed")));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (tab: Tab, row: any) => {
    const token = localStorage.getItem("token");
    const id = getDeleteId(tab, row);
    try {
      const endpoint =
        tab === "classes"
          ? `${API_BASE_URL}/admin/classes/${id}`
          : tab === "organizations"
          ? `${API_BASE_URL}/admin/organizations/${id}`
          : `${API_BASE_URL}/admin/users/${id}`;

      await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t("admin.toast.deleteSuccess"));
      fetchData();
      fetchStats();
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.studentCount !== undefined || data?.teacherCount !== undefined) {
        toast.error(
          `${t("admin.toast.deleteHasRelated")} ${data.studentCount ?? 0} ${t("admin.toast.students")}, ${data.teacherCount ?? 0} ${t("admin.toast.teachers")}, ${data.classCount ?? 0} ${t("admin.toast.classes")}`
        );
      } else {
        toast.error(getErrorMessage(error, t("admin.toast.deleteFailed")));
      }
    } finally {
      setConfirmDelete(null);
    }
  };

  // ── Create user ─────────────────────────────────────────────────
  const openCreateModal = () => {
    setCreateRole("Student");
    setCreateFirstName("");
    setCreateLastName("");
    setCreateEmail("");
    setCreateGrade("");
    setCreateOrgId("");
    setCreateClassId("");
    setCreatedCredentials(null);
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (!showCreateModal && !editingRow) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 },
      })
      .then((response) => setCreateOrganizations(response.data.data))
      .catch((error) => console.error("Error fetching organizations:", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal, editingRow]);

  useEffect(() => {
    if (!createOrgId) {
      setCreateClasses([]);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/admin/organizations/${createOrgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setCreateClasses(response.data.data.Classes || []))
      .catch((error) => console.error("Error fetching classes:", error));
  }, [createOrgId]);

  const handleCreateUser = async () => {
    if (!createFirstName || !createEmail) {
      toast.error(t("admin.toast.firstNameEmailRequired"));
      return;
    }
    if ((createRole === "Student" || createRole === "Teacher") && !createOrgId) {
      toast.error(t("admin.toast.selectOrg"));
      return;
    }

    const token = localStorage.getItem("token");
    setIsCreating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/users`,
        {
          firstName: createFirstName,
          lastName: createLastName,
          email: createEmail,
          role: createRole,
          organizationId: createOrgId ? Number(createOrgId) : undefined,
          classId: createClassId ? Number(createClassId) : undefined,
          grade: createGrade || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedCredentials({
        email: response.data.data.email,
        password: response.data.password,
      });
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error(getErrorMessage(error, t("admin.toast.saveFailed")));
    } finally {
      setIsCreating(false);
    }
  };

  // ── Reset password ──────────────────────────────────────────────
  const handleResetPassword = async (userId: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/admin/users/${userId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        `${t("admin.toast.resetSuccess")} ${response.data.newPassword}`,
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(t("admin.toast.resetFailed"));
    } finally {
      setConfirmReset(null);
    }
  };

  // ── Escape key handler ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(null);
        else if (confirmReset) setConfirmReset(null);
        else if (editingRow) setEditingRow(null);
        else if (showCreateModal) setShowCreateModal(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirmDelete, confirmReset, editingRow, showCreateModal]);

  if (!authorized) return null;

  // ── Derived values ──────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // ── Table headers per tab ───────────────────────────────────────
  const getHeaders = (): string[] => {
    switch (activeTab) {
      case "students":
        return ["admin.th.id", "admin.th.name", "admin.th.email", "admin.th.grade", "admin.th.organization", "admin.th.class", "admin.th.xp", "admin.th.actions"];
      case "teachers":
        return ["admin.th.id", "admin.th.name", "admin.th.email", "admin.th.organization", "admin.th.actions"];
      case "parents":
        return ["admin.th.id", "admin.th.name", "admin.th.email", "admin.th.childCount", "admin.th.actions"];
      case "classes":
        return ["admin.th.id", "admin.th.className", "admin.th.category", "admin.th.organization", "admin.th.studentCount", "admin.th.actions"];
      case "organizations":
        return ["admin.th.id", "admin.th.orgName", "admin.th.orgType", "admin.th.actions"];
      default:
        return ["admin.th.id", "admin.th.name", "admin.th.email", "admin.th.role", "admin.th.verified", "admin.th.createdAt", "admin.th.actions"];
    }
  };

  const headers = getHeaders();

  // ── Render table row ────────────────────────────────────────────
  const renderRow = (row: any) => {
    const userId = isUserLikeTab(activeTab) ? getUserId(activeTab, row) : -1;
    const name = getName(activeTab, row) || "-";
    const email = getEmail(activeTab, row);
    const deleteId = getDeleteId(activeTab, row);

    let cells: React.ReactNode[] = [];
    switch (activeTab) {
      case "students":
        cells = [
          <span className="font-mono text-gray-400 text-xs">#{row.id}</span>,
          <span className="font-medium text-gray-900">{name}</span>,
          <span className="text-gray-500" dir="ltr">{email}</span>,
          row.grade ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{t(`admin.grade.${row.grade}`)}</span> : <span className="text-gray-300">—</span>,
          row.organization?.name ?? row.Organization?.name ?? <span className="text-gray-300">—</span>,
          row.Class?.classname ?? row.class?.classname ?? <span className="text-gray-300">—</span>,
          <span className="font-semibold text-blueprimary">{row.xp ?? 0}</span>,
        ];
        break;
      case "teachers":
        cells = [
          <span className="font-mono text-gray-400 text-xs">#{row.id}</span>,
          <span className="font-medium text-gray-900">{name}</span>,
          <span className="text-gray-500" dir="ltr">{email}</span>,
          row.Organization?.name ?? row.organization?.name ?? <span className="text-gray-300">—</span>,
        ];
        break;
      case "parents":
        cells = [
          <span className="font-mono text-gray-400 text-xs">#{row.id}</span>,
          <span className="font-medium text-gray-900">{name}</span>,
          <span className="text-gray-500" dir="ltr">{email}</span>,
          <span className="font-semibold">{(row.Students ?? row.students ?? []).length}</span>,
        ];
        break;
      case "classes":
        cells = [
          <span className="font-mono text-gray-400 text-xs">#{row.id}</span>,
          <span className="font-medium text-gray-900">{row.classname}</span>,
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{row.category}</span>,
          row.Organization?.name ?? <span className="text-gray-300">—</span>,
          <span className="font-semibold">{(row.Students ?? []).length}</span>,
        ];
        break;
      case "organizations":
        cells = [
          <span className="font-mono text-gray-400 text-xs">#{row.id}</span>,
          <span className="font-medium text-gray-900">{row.name}</span>,
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{t(`admin.orgType.${row.type}`)}</span>,
        ];
        break;
      default:
        cells = [
          <span className="font-mono text-gray-400 text-xs">#{row.id}</span>,
          <span className="font-medium text-gray-900">{name}</span>,
          <span className="text-gray-500" dir="ltr">{email}</span>,
          <RoleBadge role={row.role} t={t} />,
          row.isAccess ? (
            <span className="inline-flex items-center gap-1 text-emerald-600"><FaCheckCircle size={14} /> {t("admin.verified.yes")}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-400"><FaTimesCircle size={14} /> {t("admin.verified.no")}</span>
          ),
          <span className="text-gray-500 text-xs">{row.createdAt ? new Date(row.createdAt).toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US") : "—"}</span>,
        ];
    }

    return (
      <motion.tr
        key={`${activeTab}-${row.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-b border-gray-100/80 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent transition-colors group"
      >
        {cells.map((cell, i) => (
          <td key={i} className="px-5 py-3.5 text-sm whitespace-nowrap">
            {cell}
          </td>
        ))}
        <td className="px-5 py-3.5 text-sm">
          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title={t("admin.modal.editUser")}
              onClick={() => openEditModal(row)}
            >
              <FaEdit size={14} />
            </button>

            <button
              className="p-2 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title={t("admin.delete.confirm")}
              onClick={() => setConfirmDelete({ id: deleteId, name: name, tab: activeTab, row })}
            >
              <FaTrash size={14} />
            </button>

            {isUserLikeTab(activeTab) && (
              <button
                className="p-2 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                title={t("admin.reset.title")}
                onClick={() => setConfirmReset({ userId, name })}
              >
                <FaKey size={14} />
              </button>
            )}
          </div>
        </td>
      </motion.tr>
    );
  };

  // ── Stats cards data ────────────────────────────────────────────
  const statsCards = [
    { key: "users", label: "admin.stats.totalUsers", icon: <FaUsers />, color: "from-blue-500 to-blue-600", value: stats.users },
    { key: "students", label: "admin.stats.totalStudents", icon: <FaChild />, color: "from-cyan-500 to-cyan-600", value: stats.students },
    { key: "teachers", label: "admin.stats.totalTeachers", icon: <FaChalkboardTeacher />, color: "from-emerald-500 to-emerald-600", value: stats.teachers },
    { key: "parents", label: "admin.stats.totalParents", icon: <FaUserFriends />, color: "from-amber-500 to-amber-600", value: stats.parents },
  ];

  // ── Create button label ─────────────────────────────────────────
  const createLabel =
    activeTab === "classes"
      ? t("admin.create.class")
      : activeTab === "organizations"
      ? t("admin.create.organization")
      : t("admin.create.user");

  // ── Page numbers for pagination ─────────────────────────────────
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────

  return (
    <div className={`flex w-full min-h-screen bg-gray-50/50`} dir={isRTL ? "rtl" : "ltr"}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={isRTL}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* ────────────── SIDEBAR ────────────── */}
      <aside className={`flex flex-col w-72 shrink-0 bg-white border-gray-200 shadow-sm ${isRTL ? "border-l" : "border-r"}`}>
        {/* Sidebar header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <FaUsers size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t("admin.userDataTitle")}</h1>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/admin/home")}
            className="flex items-center gap-2 mt-3 text-sm text-gray-400 hover:text-blueprimary transition-colors"
          >
            {isRTL ? <FaArrowRight size={12} /> : <FaArrowLeft size={12} />}
            {t("admin.backToDashboard")}
          </button>
        </div>

        {/* Sidebar divider */}
        <div className="mx-4 border-b border-gray-100" />

        {/* Tabs */}
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          {TAB_KEYS.map((tabKey) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => handleTabChange(tabKey)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-start transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${TAB_COLORS[tabKey]} text-white shadow-md shadow-${tabKey === "users" ? "blue" : "gray"}-200/50`
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? "bg-white/20" : TAB_BG_COLORS[tabKey]}`}>
                  {TAB_ICONS[tabKey]}
                </span>
                <span className="font-medium text-sm">{t(TAB_I18N[tabKey])}</span>
                {isActive && total > 0 && (
                  <span className="ms-auto bg-white/25 text-xs font-bold px-2 py-0.5 rounded-full">
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Create button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={
              activeTab === "classes"
                ? openCreateClassModal
                : activeTab === "organizations"
                ? openCreateOrgModal
                : openCreateModal
            }
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-200/50 transition-all duration-200 active:scale-[0.98]"
          >
            <FaPlus size={14} />
            <span className="font-semibold text-sm">{createLabel}</span>
          </button>
        </div>
      </aside>

      {/* ────────────── MAIN CONTENT ────────────── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t(TAB_I18N[activeTab])}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {t("admin.pagination.showing")} {total > 0 ? `${startItem}–${endItem}` : "0"} {t("admin.pagination.of")} {total} {t("admin.pagination.results")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className={`absolute top-1/2 -translate-y-1/2 text-gray-300 ${isRTL ? "right-3.5" : "left-3.5"}`} size={14} />
              <input
                ref={searchRef}
                type="text"
                placeholder={t("admin.search.placeholder")}
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className={`w-80 py-2.5 bg-gray-50 text-gray-800 border border-gray-200 outline-none rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 transition-all ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
              />
            </div>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FaGlobe size={14} />
              {t("admin.languageToggle")}
            </button>
          </div>
        </header>

        {/* Stats cards */}
        <div className="px-8 pt-6 pb-2">
          <div className="grid grid-cols-4 gap-4">
            {statsCards.map((card, i) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 font-medium">{t(card.label)}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {card.value !== undefined ? card.value.toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                    {card.icon}
                  </div>
                </div>
                {/* Decorative gradient line at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Data table */}
        <div className="flex-1 px-8 py-4 overflow-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-start whitespace-nowrap"
                    >
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={headers.length} />)
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="py-16">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <FaInbox size={40} />
                        <p className="text-lg font-semibold text-gray-400">{t("admin.empty")}</p>
                        <p className="text-sm text-gray-300">{t("admin.empty.description")}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map(renderRow)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4 mb-8">
              <p className="text-sm text-gray-400">
                {t("admin.pagination.page")} {page} {t("admin.pagination.of")} {totalPages}
              </p>
              <div className="flex items-center gap-1" dir="ltr">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-300">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        page === p
                          ? "bg-blueprimary text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ────────────── CREATE USER MODAL ────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                  <div className="flex items-center justify-center w-16 h-16 text-3xl text-white bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-200">
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{t("admin.created.title")}</h2>
                  <div className="w-full p-4 space-y-3 text-start bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t("admin.created.email")}</span>
                      <p className="font-medium text-gray-900 mt-0.5" dir="ltr">{createdCredentials.email}</p>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t("admin.created.tempPassword")}</span>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="font-mono font-bold text-gray-900 text-lg" dir="ltr">
                          {createdCredentials.password}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdCredentials.password);
                            toast.success(t("admin.created.copied"));
                          }}
                          className="p-2 text-gray-400 rounded-lg hover:bg-gray-200 hover:text-gray-600 transition-colors"
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
                    className="w-full py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                  >
                    {t("admin.created.done")}
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">{t("admin.modal.createUser")}</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Role selection */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-600">{t("admin.modal.accountType")}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["Student", "Teacher", "Parent", "Admin"] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setCreateRole(role);
                              setCreateOrgId("");
                              setCreateClassId("");
                            }}
                            className={`py-2.5 text-xs rounded-xl font-semibold transition-all duration-200 ${
                              createRole === role
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                : "border-2 border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            {t(`admin.role.${role}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name fields */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.firstName")}</label>
                        <input
                          type="text"
                          value={createFirstName}
                          onChange={(e) => setCreateFirstName(e.target.value)}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.lastName")}</label>
                        <input
                          type="text"
                          value={createLastName}
                          onChange={(e) => setCreateLastName(e.target.value)}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.email")}</label>
                      <input
                        type="email"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        dir="ltr"
                        className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    {/* Grade (Student only) */}
                    {createRole === "Student" && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.grade")}</label>
                        <select
                          value={createGrade}
                          onChange={(e) => setCreateGrade(e.target.value)}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="">{t("admin.modal.selectGrade")}</option>
                          <option value="primary">{t("admin.grade.primary")}</option>
                          <option value="preparatory">{t("admin.grade.preparatory")}</option>
                          <option value="secondary">{t("admin.grade.secondary")}</option>
                        </select>
                      </div>
                    )}

                    {/* Organization (Student / Teacher) */}
                    {(createRole === "Student" || createRole === "Teacher") && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.org")}</label>
                        <select
                          value={createOrgId}
                          onChange={(e) => {
                            setCreateOrgId(e.target.value);
                            setCreateClassId("");
                          }}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="">{t("admin.modal.selectOrg")}</option>
                          {createOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Class (Student only) */}
                    {createRole === "Student" && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.class")}</label>
                        <select
                          value={createClassId}
                          onChange={(e) => setCreateClassId(e.target.value)}
                          disabled={!createOrgId}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
                        >
                          <option value="">{t("admin.modal.selectClass")}</option>
                          {createClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.classname} ({cls.category})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={handleCreateUser}
                      disabled={isCreating}
                      className="w-full py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md active:scale-[0.98]"
                    >
                      {isCreating ? t("admin.modal.creating") : t("admin.modal.createBtn")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────── EDIT MODAL ────────────── */}
      <AnimatePresence>
        {editingRow && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                      : t("admin.modal.createNewBtn")
                    : activeTab === "classes"
                    ? t("admin.modal.editClass")
                    : activeTab === "organizations"
                    ? t("admin.modal.editOrg")
                    : t("admin.modal.editUser")}
                </h2>
                <button
                  onClick={() => setEditingRow(null)}
                  className="p-2 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {activeTab === "classes" ? (
                  <>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.className")}</label>
                      <input
                        type="text"
                        value={editClassName}
                        onChange={(e) => setEditClassName(e.target.value)}
                        className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.category")}</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.org")}</label>
                      <select
                        value={editOrgId}
                        onChange={(e) => setEditOrgId(e.target.value)}
                        className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      >
                        <option value="">{t("admin.modal.selectOrg")}</option>
                        {createOrganizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : activeTab === "organizations" ? (
                  <>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.orgName")}</label>
                      <input
                        type="text"
                        value={editOrgName}
                        onChange={(e) => setEditOrgName(e.target.value)}
                        className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.orgType")}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["School", "Company", "Charity"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setEditOrgType(type)}
                            className={`py-2.5 text-xs rounded-xl font-semibold transition-all duration-200 ${
                              editOrgType === type
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                : "border-2 border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            {t(`admin.orgType.${type}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.firstName")}</label>
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.lastName")}</label>
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.email")}</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        dir="ltr"
                        className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    {activeTab === "students" && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.grade")}</label>
                        <select
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="">{t("admin.modal.selectGrade")}</option>
                          <option value="primary">{t("admin.grade.primary")}</option>
                          <option value="preparatory">{t("admin.grade.preparatory")}</option>
                          <option value="secondary">{t("admin.grade.secondary")}</option>
                        </select>
                      </div>
                    )}

                    {(activeTab === "students" || activeTab === "teachers") && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.modal.org")}</label>
                        <select
                          value={editOrgId}
                          onChange={(e) => {
                            setEditOrgId(e.target.value);
                            setEditClassId("");
                          }}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="">{t("admin.modal.selectOrg")}</option>
                          {createOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeTab === "students" && (
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">{t("admin.th.class")}</label>
                        <select
                          value={editClassId}
                          onChange={(e) => setEditClassId(e.target.value)}
                          disabled={!editOrgId}
                          className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:border-blueprimary focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
                        >
                          <option value="">{t("admin.modal.noClass")}</option>
                          {editClassesOptions.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.classname} ({cls.category})
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
                  className="w-full py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md active:scale-[0.98]"
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

      {/* ────────────── DELETE CONFIRMATION ────────────── */}
      <ConfirmModal
        open={!!confirmDelete}
        title={t("admin.delete.title")}
        message={
          <>
            {t("admin.delete.message")} <strong>{confirmDelete?.name || "—"}</strong>{t("admin.delete.messageEnd")}
          </>
        }
        confirmLabel={t("admin.delete.confirm")}
        cancelLabel={t("admin.delete.cancel")}
        confirmColor="bg-red-500 hover:bg-red-600"
        icon={<FaExclamationTriangle />}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.tab, confirmDelete.row)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* ────────────── RESET PASSWORD CONFIRMATION ────────────── */}
      <ConfirmModal
        open={!!confirmReset}
        title={t("admin.reset.title")}
        message={
          <>
            {t("admin.reset.message")} <strong>{confirmReset?.name || "—"}</strong>{t("admin.reset.messageEnd")}
          </>
        }
        confirmLabel={t("admin.reset.confirm")}
        cancelLabel={t("admin.reset.cancel")}
        confirmColor="bg-amber-500 hover:bg-amber-600"
        icon={<FaKey />}
        onConfirm={() => confirmReset && handleResetPassword(confirmReset.userId)}
        onCancel={() => setConfirmReset(null)}
      />
    </div>
  );
};

export default UserData;
