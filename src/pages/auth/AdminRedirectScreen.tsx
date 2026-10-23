import React from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { localStore } from "../../utils/safeStorage";

export const AdminRedirectScreen: React.FC = () => {
  const history = useHistory();
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");

  // In accordance with Sanabel Cutover Policy:
  // VITE_ADMIN_APP_URL is supplied via build-time or runtime environment.
  // When missing, do NOT fall back to /admin or any hardcoded staging URL.
  const rawAdminUrl = import.meta.env.VITE_ADMIN_APP_URL;
  const adminAppUrl =
    typeof rawAdminUrl === "string" && rawAdminUrl.trim().length > 0
      ? rawAdminUrl.trim()
      : "";

  const handleOpenAdmin = () => {
    if (!adminAppUrl) return;

    try {
      if (typeof window.open === "function") {
        window.open(adminAppUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(adminAppUrl);
      }
    } catch {
      window.location.href = adminAppUrl;
    }
  };

  const handleSignOut = () => {
    localStore.removeItem("token");
    localStore.removeItem("refreshToken");
    localStore.removeItem("role");
    localStore.removeItem("user");
    localStore.setItem("keepLoggedIn", "false");
    window.dispatchEvent(new Event("storage"));
    history.replace("/login");
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-50 px-6 py-12"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center flex flex-col items-center gap-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">
            {isArabic
              ? "هذا الحساب يستخدم لوحة الإدارة"
              : "This account uses the Admin Console"}
          </h2>
          <p className="text-sm text-slate-500">
            {isArabic
              ? "يمكنك إدارة المدرسة أو المنصة من خلال لوحة الإدارة المخصصة."
              : "Manage your school or the platform from the dedicated Admin Console."}
          </p>
        </div>

        {!adminAppUrl && (
          <div
            data-testid="admin-config-warning"
            className="w-full p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs text-start"
          >
            {isArabic
              ? "تنبيه: رابط لوحة الإدارة غير مهيأ (VITE_ADMIN_APP_URL). يرجى مراجعة إعدادات النظام."
              : "Notice: The Admin Console URL is not configured (VITE_ADMIN_APP_URL). Please verify environment configuration."}
          </div>
        )}

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            data-testid={adminAppUrl ? "open-admin-button" : "open-admin-button-disabled"}
            disabled={!adminAppUrl}
            onClick={handleOpenAdmin}
            className={`w-full py-3 px-4 font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 ${
              adminAppUrl
                ? "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white focus:ring-sky-500/30"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isArabic ? "فتح لوحة الإدارة" : "Open Admin Console"}
          </button>

          <button
            type="button"
            data-testid="sign-out-button"
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {isArabic ? "تسجيل الخروج" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRedirectScreen;
