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
} from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

type Tab = "users" | "students" | "teachers" | "parents" | "admins";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "users", label: "كل المستخدمين", icon: <FaUsers /> },
  { key: "students", label: "الطلاب", icon: <FaChild /> },
  { key: "teachers", label: "المعلمون", icon: <FaChalkboardTeacher /> },
  { key: "parents", label: "أولياء الأمور", icon: <FaUserFriends /> },
  { key: "admins", label: "المشرفون", icon: <FaUserShield /> },
];

const ENDPOINTS: Record<Tab, string> = {
  users: `${API_BASE_URL}/admin/users`,
  students: `${API_BASE_URL}/admin/students`,
  teachers: `${API_BASE_URL}/admin/teachers`,
  parents: `${API_BASE_URL}/admin/parents`,
  admins: `${API_BASE_URL}/admin/users`,
};

const getUserId = (tab: Tab, row: any): number => {
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
    const userId = getUserId(activeTab, row);
    const name = getName(activeTab, row) || "-";
    const email = getEmail(activeTab, row);

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
          {confirmResetId === userId ? (
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600"
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
            </div>
          ) : (
            <button
              className="flex items-center gap-1 px-3 py-1 text-xs text-blue-700 rounded-lg bg-blue-50 hover:bg-blue-100"
              onClick={() => setConfirmResetId(userId)}
            >
              <FaKey /> إعادة تعيين كلمة المرور
            </button>
          )}
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
            className="px-4 py-2 border-2 border-gray-200 outline-none w-80 rounded-xl focus:border-blueprimary"
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
    </div>
  );
};

export default UserData;
