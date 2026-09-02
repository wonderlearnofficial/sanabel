import { API_BASE_URL } from "../../config/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { FaChild, FaChalkboardTeacher, FaUserFriends, FaUserShield } from "react-icons/fa";
import { useUserContext } from "../../context/StudentUserProvider";
import { useTranslation } from "react-i18next";

interface DevUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "Student" | "Teacher" | "Parent" | "Admin";
}

type Grouped = Record<"Student" | "Teacher" | "Parent" | "Admin", DevUser[]>;

const ROLE_SECTIONS: { role: keyof Grouped; label: string; icon: React.ReactNode; color: string }[] = [
  { role: "Student", label: "الطلاب", icon: <FaChild size={16} />, color: "bg-cyan-50 text-cyan-700" },
  { role: "Teacher", label: "المعلمون", icon: <FaChalkboardTeacher size={16} />, color: "bg-emerald-50 text-emerald-700" },
  { role: "Parent", label: "أولياء الأمور", icon: <FaUserFriends size={16} />, color: "bg-amber-50 text-amber-700" },
  { role: "Admin", label: "المشرفون", icon: <FaUserShield size={16} />, color: "bg-purple-50 text-purple-700" },
];

const DevLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { refreshUserData } = useUserContext();
  const [grouped, setGrouped] = useState<Grouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingInId, setLoggingInId] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/dev/users`)
      .then((response) => setGrouped(response.data.data))
      .catch((error) => {
        console.error("Error fetching dev users:", error);
        toast.error(t("تعذر تحميل قائمة المستخدمين — تأكد أن السيرفر يعمل في وضع التطوير"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const loginAs = async (devUser: DevUser) => {
    setLoggingInId(devUser.id);
    try {
      const response = await axios.post(`${API_BASE_URL}/dev/login-as/${devUser.id}`);
      const { token, role, email } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("keepLoggedIn", "true");

      const hasCompletedTutorial = localStorage.getItem(`tutorialComplete-${email}`);
      localStorage.setItem("firstTimer", hasCompletedTutorial ? "false" : "true");

      await refreshUserData(token);

      window.location.href = "/";
    } catch (error) {
      console.error("Error logging in as user:", error);
      toast.error(t("تعذر تسجيل الدخول بهذا الحساب"));
      setLoggingInId(null);
    }
  };

  const openAppNormally = () => {
    window.location.href = "/";
  };

  return (
    <div className="h-screen h-[100dvh] w-full overflow-y-auto bg-gray-50 p-6" dir={i18n.dir()}>
      <ToastContainer position="top-center" autoClose={3000} rtl={i18n.dir() === "rtl"} />

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("تسجيل دخول سريع (وضع التطوير)")}</h1>
            <p className="text-sm text-gray-500">
              {t("اختر حسابًا لتسجيل الدخول به مباشرة بدون كلمة مرور — متاح فقط أثناء التطوير المحلي.")}
            </p>
          </div>
          <button
            onClick={openAppNormally}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t("فتح التطبيق بشكل طبيعي")}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">{t("جاري التحميل...")}</div>
        ) : !grouped ? (
          <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 text-center text-red-600">
            {t("تعذر تحميل المستخدمين. تأكد أن السيرفر يعمل محليًا (NODE_ENV غير production).")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ROLE_SECTIONS.map((section) => {
              const users = grouped[section.role] || [];
              return (
                <div key={section.role} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.color}`}>
                      {section.icon}
                    </span>
                    <h2 className="font-bold text-gray-800">{t(section.label)}</h2>
                    <span className="text-sm text-gray-400">({users.length})</span>
                  </div>

                  {users.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-300">{t("لا يوجد حسابات")}</p>
                  ) : (
                    <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
                      {users.map((devUser) => (
                        <button
                          key={devUser.id}
                          onClick={() => loginAs(devUser)}
                          disabled={loggingInId !== null}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-start transition-colors hover:border-blueprimary hover:bg-blue-50 disabled:opacity-50"
                        >
                          <span>
                            <span className="block font-medium text-gray-900">
                              {devUser.firstName} {devUser.lastName}
                            </span>
                            <span className="block text-xs text-gray-400" dir="ltr">
                              {devUser.email}
                            </span>
                          </span>
                          <span className="text-xs font-semibold text-blueprimary">
                            {loggingInId === devUser.id ? "..." : t("دخول")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevLogin;
