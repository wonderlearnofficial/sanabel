import { API_BASE_URL } from "../../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
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
} from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { getErrorMessage } from "../../config/getErrorMessage";

type Tab = "users" | "students" | "teachers" | "parents" | "admins" | "classes" | "organizations";
type UserLikeTab = "users" | "students" | "teachers" | "parents" | "admins";

const USER_LIKE_TABS: UserLikeTab[] = ["users", "students", "teachers", "parents", "admins"];
const isUserLikeTab = (tab: Tab): tab is UserLikeTab =>
  (USER_LIKE_TABS as Tab[]).includes(tab);

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "users", label: "كل المستخدمين", icon: <FaUsers /> },
  { key: "students", label: "الطلاب", icon: <FaChild /> },
  { key: "teachers", label: "المعلمون", icon: <FaChalkboardTeacher /> },
  { key: "parents", label: "أولياء الأمور", icon: <FaUserFriends /> },
  { key: "admins", label: "المشرفون", icon: <FaUserShield /> },
  { key: "classes", label: "الفصول", icon: <FaSchool /> },
  { key: "organizations", label: "المدارس والمؤسسات", icon: <FaBuilding /> },
];

const ENDPOINTS: Record<Tab, string> = {
  users: `${API_BASE_URL}/admin/users`,
  students: `${API_BASE_URL}/admin/students`,
  teachers: `${API_BASE_URL}/admin/teachers`,
  parents: `${API_BASE_URL}/admin/parents`,
  admins: `${API_BASE_URL}/admin/users`,
  classes: `${API_BASE_URL}/admin/classes`,
  organizations: `${API_BASE_URL}/admin/organizations`,
};

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

const Toaster = () => (
  <ToastContainer
    position="top-center"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

const UserData: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmResetId, setConfirmResetId] = useState<number | null>(null);
  const limit = 25;

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

  // Edit modal (shared across every tab; visible fields depend on activeTab)
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

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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

  const handleSaveEdit = async () => {
    const isNew = !!editingRow?.isNew;

    if (activeTab === "classes" && (!editClassName || !editCategory || !editOrgId)) {
      toast.error("اسم الفصل والفئة والمؤسسة مطلوبة");
      return;
    }
    if (activeTab === "organizations" && !editOrgName) {
      toast.error("اسم المؤسسة مطلوب");
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
      toast.success(isNew ? "تم الإنشاء بنجاح" : "تم الحفظ بنجاح");
      setEditingRow(null);
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر حفظ التعديلات"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getDeleteId = (tab: Tab, row: any): number =>
    isUserLikeTab(tab) ? getUserId(tab, row) : row.id;

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
      toast.success("تم الحذف بنجاح");
      fetchData();
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.studentCount !== undefined || data?.teacherCount !== undefined) {
        toast.error(
          `لا يمكن الحذف، توجد بيانات مرتبطة: ${data.studentCount ?? 0} طالب, ${data.teacherCount ?? 0} معلم, ${data.classCount ?? 0} فصل`
        );
      } else {
        toast.error(getErrorMessage(error, "تعذر الحذف"));
      }
    } finally {
      setConfirmDeleteId(null);
    }
  };

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
      toast.error("الاسم الأول والبريد الإلكتروني مطلوبان");
      return;
    }
    if ((createRole === "Student" || createRole === "Teacher") && !createOrgId) {
      toast.error("يرجى اختيار المؤسسة");
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
    } catch (error) {
      toast.error(getErrorMessage(error, "تعذر إنشاء الحساب"));
    } finally {
      setIsCreating(false);
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (activeTab === "admins") params.role = "Admin";
      if (activeTab === "users") {
        // exclude admins from the generic "all users" tab to keep the two views distinct
      }

      const response = await axios.get(ENDPOINTS[activeTab], {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setRows(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error("تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, activeTab, search, page]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch("");
    setPage(1);
  };

  const handleResetPassword = async (userId: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/admin/users/${userId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        `تم إعادة تعيين كلمة المرور إلى: ${response.data.newPassword}`,
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("تعذر إعادة تعيين كلمة المرور");
    } finally {
      setConfirmResetId(null);
    }
  };

  if (!authorized) return null;

  const renderHeaders = () => {
    switch (activeTab) {
      case "students":
        return [
          "ID",
          "الاسم",
          "البريد الإلكتروني",
          "المرحلة",
          "المؤسسة",
          "الفصل",
          "XP",
          "",
        ];
      case "teachers":
        return ["ID", "الاسم", "البريد الإلكتروني", "المؤسسة", ""];
      case "parents":
        return [
          "ID",
          "الاسم",
          "البريد الإلكتروني",
          "عدد الأبناء المرتبطين",
          "",
        ];
      case "classes":
        return ["ID", "اسم الفصل", "الفئة", "المؤسسة", "عدد الطلاب", ""];
      case "organizations":
        return ["ID", "الاسم", "النوع", ""];
      default:
        return [
          "ID",
          "الاسم",
          "البريد الإلكتروني",
          "الدور",
          "تم التحقق",
          "تاريخ الإنشاء",
          "",
        ];
    }
  };

  const renderRow = (row: any) => {
    const userId = isUserLikeTab(activeTab) ? getUserId(activeTab, row) : -1;
    const name = getName(activeTab, row) || "-";
    const email = getEmail(activeTab, row);
    const deleteId = getDeleteId(activeTab, row);

    let cells: React.ReactNode[] = [];
    switch (activeTab) {
      case "students":
        cells = [
          row.id,
          name,
          email,
          row.grade || "-",
          row.organization?.name ?? row.Organization?.name ?? "-",
          row.Class?.classname ?? row.class?.classname ?? "-",
          row.xp ?? 0,
        ];
        break;
      case "teachers":
        cells = [
          row.id,
          name,
          email,
          row.Organization?.name ?? row.organization?.name ?? "-",
        ];
        break;
      case "parents":
        cells = [
          row.id,
          name,
          email,
          (row.Students ?? row.students ?? []).length,
        ];
        break;
      case "classes":
        cells = [
          row.id,
          row.classname,
          row.category,
          row.Organization?.name ?? "-",
          (row.Students ?? []).length,
        ];
        break;
      case "organizations":
        cells = [row.id, row.name, row.type];
        break;
      default:
        cells = [
          row.id,
          name,
          email,
          row.role,
          row.isAccess ? "نعم" : "لا",
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
        ];
    }

    return (
      <tr
        key={`${activeTab}-${row.id}`}
        className="border-b border-gray-100 hover:bg-gray-50"
      >
        {cells.map((cell, i) => (
          <td
            key={i}
            className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap"
          >
            {cell}
          </td>
        ))}
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100"
              title="تعديل"
              onClick={() => openEditModal(row)}
            >
              <FaEdit />
            </button>

            {confirmDeleteId === deleteId ? (
              <>
                <button
                  className="px-3 py-1 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600"
                  onClick={() => handleDelete(activeTab, row)}
                >
                  تأكيد
                </button>
                <button
                  className="px-3 py-1 text-xs bg-gray-200 rounded-lg hover:bg-gray-300"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  إلغاء
                </button>
              </>
            ) : (
              <button
                className="p-2 text-red-600 rounded-lg bg-red-50 hover:bg-red-100"
                title="حذف"
                onClick={() => setConfirmDeleteId(deleteId)}
              >
                <FaTrash />
              </button>
            )}

            {isUserLikeTab(activeTab) &&
              (confirmResetId === userId ? (
                <>
                  <button
                    className="px-3 py-1 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                    onClick={() => handleResetPassword(userId)}
                  >
                    تأكيد
                  </button>
                  <button
                    className="px-3 py-1 text-xs bg-gray-200 rounded-lg hover:bg-gray-300"
                    onClick={() => setConfirmResetId(null)}
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  className="p-2 text-orange-600 rounded-lg bg-orange-50 hover:bg-orange-100"
                  title="إعادة تعيين كلمة المرور"
                  onClick={() => setConfirmResetId(userId)}
                >
                  <FaKey />
                </button>
              ))}
          </div>
        </td>
      </tr>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex w-full min-h-screen bg-gray-50" dir="rtl">
      <Toaster />

      {/* Sidebar */}
      <aside className="flex flex-col w-64 gap-1 p-4 bg-white border-l border-gray-200 shrink-0">
        <h1 className="mb-4 text-xl font-bold text-gray-800">
          بيانات المستخدمين
        </h1>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-start transition-colors ${
              activeTab === tab.key
                ? "bg-blueprimary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}

        <button
          onClick={
            activeTab === "classes"
              ? openCreateClassModal
              : activeTab === "organizations"
              ? openCreateOrgModal
              : openCreateModal
          }
          className="flex items-center gap-3 px-4 py-3 mt-4 text-white rounded-xl bg-green-600 hover:bg-green-700"
        >
          <FaPlus />
          <span className="font-medium">
            {activeTab === "classes"
              ? "إنشاء فصل جديد"
              : activeTab === "organizations"
              ? "إنشاء مؤسسة جديدة"
              : "إنشاء حساب جديد"}
          </span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {TABS.find((t) => t.key === activeTab)?.label}
          </h2>
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="px-4 py-2 bg-white text-gray-800 border-2 border-gray-200 outline-none w-80 rounded-xl focus:border-blueprimary"
          />
        </div>

        <div className="overflow-x-auto bg-white shadow-sm rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50">
                {renderHeaders().map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-sm font-semibold text-gray-500 text-start whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={renderHeaders().length}
                    className="p-8 text-center text-gray-400"
                  >
                    جاري التحميل...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={renderHeaders().length}
                    className="p-8 text-center text-gray-400"
                  >
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                rows.map(renderRow)
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div
            className="flex items-center justify-center gap-4 mt-4"
            dir="ltr"
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-30"
            >
              <FaChevronRight />
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-30"
            >
              <FaChevronLeft />
            </button>
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            {createdCredentials ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center justify-center w-14 h-14 text-2xl text-white bg-green-500 rounded-full">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-gray-800">تم إنشاء الحساب بنجاح</h2>
                <div className="w-full p-4 space-y-2 text-start bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-xs text-gray-500">البريد الإلكتروني</span>
                    <p className="font-medium text-gray-800" dir="ltr">{createdCredentials.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">كلمة المرور المؤقتة</span>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono font-medium text-gray-800" dir="ltr">
                        {createdCredentials.password}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdCredentials.password);
                          toast.success("تم النسخ");
                        }}
                        className="p-2 text-gray-500 rounded-lg hover:bg-gray-200"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  شارك هذه البيانات مع المستخدم لتسجيل الدخول لأول مرة
                </p>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-3 font-bold text-white bg-blueprimary rounded-xl"
                >
                  تم
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">إنشاء حساب جديد</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 rounded-lg hover:bg-gray-100"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">نوع الحساب</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["Student", "Teacher", "Parent", "Admin"] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setCreateRole(role);
                            setCreateOrgId("");
                            setCreateClassId("");
                          }}
                          className={`py-2 text-xs rounded-lg border-2 ${
                            createRole === role
                              ? "bg-blueprimary text-white border-blueprimary"
                              : "border-[#EAECF0] text-gray-600"
                          }`}
                        >
                          {TABS.find((t) => t.key === role.toLowerCase() + "s")?.label ?? role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block mb-1 text-sm text-gray-600">الاسم الأول</label>
                      <input
                        type="text"
                        value={createFirstName}
                        onChange={(e) => setCreateFirstName(e.target.value)}
                        className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 text-sm text-gray-600">اسم العائلة</label>
                      <input
                        type="text"
                        value={createLastName}
                        onChange={(e) => setCreateLastName(e.target.value)}
                        className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm text-gray-600">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      dir="ltr"
                      className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                    />
                  </div>

                  {createRole === "Student" && (
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">المرحلة الدراسية</label>
                      <select
                        value={createGrade}
                        onChange={(e) => setCreateGrade(e.target.value)}
                        className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0]"
                      >
                        <option value="">اختر المرحلة</option>
                        <option value="primary">primary</option>
                        <option value="preparatory">preparatory</option>
                        <option value="secondary">secondary</option>
                      </select>
                    </div>
                  )}

                  {(createRole === "Student" || createRole === "Teacher") && (
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">المؤسسة</label>
                      <select
                        value={createOrgId}
                        onChange={(e) => {
                          setCreateOrgId(e.target.value);
                          setCreateClassId("");
                        }}
                        className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0]"
                      >
                        <option value="">اختر المؤسسة</option>
                        {createOrganizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {createRole === "Student" && (
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">الفصل (اختياري)</label>
                      <select
                        value={createClassId}
                        onChange={(e) => setCreateClassId(e.target.value)}
                        disabled={!createOrgId}
                        className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0] disabled:opacity-50"
                      >
                        <option value="">اختر الفصل</option>
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
                    className="w-full py-3 font-bold text-white bg-blueprimary rounded-xl disabled:opacity-50"
                  >
                    {isCreating ? "جاري الإنشاء..." : "إنشاء الحساب"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRow?.isNew
                  ? activeTab === "classes"
                    ? "إنشاء فصل جديد"
                    : activeTab === "organizations"
                    ? "إنشاء مؤسسة جديدة"
                    : "إنشاء"
                  : "تعديل"}
              </h2>
              <button
                onClick={() => setEditingRow(null)}
                className="p-2 text-gray-400 rounded-lg hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {activeTab === "classes" ? (
                <>
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">اسم الفصل</label>
                    <input
                      type="text"
                      value={editClassName}
                      onChange={(e) => setEditClassName(e.target.value)}
                      className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">الفئة</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">المؤسسة</label>
                    <select
                      value={editOrgId}
                      onChange={(e) => setEditOrgId(e.target.value)}
                      className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0]"
                    >
                      <option value="">اختر المؤسسة</option>
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
                    <label className="block mb-1 text-sm text-gray-600">اسم المؤسسة</label>
                    <input
                      type="text"
                      value={editOrgName}
                      onChange={(e) => setEditOrgName(e.target.value)}
                      className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">النوع</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["School", "Company", "Charity"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setEditOrgType(type)}
                          className={`py-2 text-xs rounded-lg border-2 ${
                            editOrgType === type
                              ? "bg-blueprimary text-white border-blueprimary"
                              : "border-[#EAECF0] text-gray-600"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block mb-1 text-sm text-gray-600">الاسم الأول</label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 text-sm text-gray-600">اسم العائلة</label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm text-gray-600">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      dir="ltr"
                      className="w-full p-3 bg-white text-gray-800 border-2 rounded-xl border-[#EAECF0]"
                    />
                  </div>

                  {activeTab === "students" && (
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">المرحلة الدراسية</label>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0]"
                      >
                        <option value="">اختر المرحلة</option>
                        <option value="primary">primary</option>
                        <option value="preparatory">preparatory</option>
                        <option value="secondary">secondary</option>
                      </select>
                    </div>
                  )}

                  {(activeTab === "students" || activeTab === "teachers") && (
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">المؤسسة</label>
                      <select
                        value={editOrgId}
                        onChange={(e) => {
                          setEditOrgId(e.target.value);
                          setEditClassId("");
                        }}
                        className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0]"
                      >
                        <option value="">اختر المؤسسة</option>
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
                      <label className="block mb-1 text-sm text-gray-600">الفصل</label>
                      <select
                        value={editClassId}
                        onChange={(e) => setEditClassId(e.target.value)}
                        disabled={!editOrgId}
                        className="w-full p-3 bg-white text-black border-2 rounded-xl border-[#EAECF0] disabled:opacity-50"
                      >
                        <option value="">بدون فصل</option>
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
                className="w-full py-3 font-bold text-white bg-blueprimary rounded-xl disabled:opacity-50"
              >
                {isSavingEdit
                  ? "جاري الحفظ..."
                  : editingRow?.isNew
                  ? "إنشاء"
                  : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserData;
