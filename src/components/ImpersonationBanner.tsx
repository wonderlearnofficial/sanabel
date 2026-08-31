import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserShield, FaSignOutAlt } from "react-icons/fa";

export const ImpersonationBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const checkState = () => {
      const returnToken = localStorage.getItem("adminReturnToken");
      const currentRole = localStorage.getItem("role");
      if (returnToken && currentRole === "Student") {
        setIsImpersonating(true);
        setStudentName(localStorage.getItem("adminImpersonatedStudentName") || "Student");
      } else {
        setIsImpersonating(false);
      }
    };

    checkState();
    window.addEventListener("storage", checkState);
    return () => window.removeEventListener("storage", checkState);
  }, []);

  if (!isImpersonating) return null;

  const handleReturnToAdmin = () => {
    const adminToken = localStorage.getItem("adminReturnToken");
    const adminRole = localStorage.getItem("adminReturnRole") || "Admin";
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.setItem("role", adminRole);
      localStorage.removeItem("adminReturnToken");
      localStorage.removeItem("adminReturnRole");
      localStorage.removeItem("adminReturnEmail");
      localStorage.removeItem("adminImpersonatedStudentName");
      window.location.href = "/admin/userdata";
    }
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-[99999] bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 text-white px-4 py-2 shadow-lg flex items-center justify-between gap-3 text-xs md:text-sm font-medium animate-fadeIn"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="p-1 rounded-full bg-white/20 text-white flex-shrink-0">
          <FaUserShield size={14} />
        </span>
        <span>
          {t("admin.impersonate.banner", { name: studentName })}
        </span>
      </div>

      <button
        onClick={handleReturnToAdmin}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-900 font-bold text-xs rounded-full shadow-sm hover:bg-amber-50 active:scale-95 transition-all flex-shrink-0"
      >
        <FaSignOutAlt size={12} className={isRTL ? "rotate-180" : ""} />
        <span>{t("admin.impersonate.return")}</span>
      </button>
    </div>
  );
};

export default ImpersonationBanner;
