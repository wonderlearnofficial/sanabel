import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaTools, FaRedoAlt } from "react-icons/fa";

interface MaintenanceScreenProps {
  onRetry: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onRetry }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-lg"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <motion.div
        className="relative w-full max-w-md p-8 overflow-hidden bg-white shadow-2xl rounded-3xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 mb-5 bg-amber-500/10 text-amber-500 rounded-3xl">
          <FaTools className="text-4xl animate-pulse" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
          {t("appUpdate.maintenanceTitle", "صيانة مجدولة للنظام")}
        </h2>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t(
            "appUpdate.maintenanceMessage",
            "نقوم حالياً بإجراء بعض التحسينات لتقديم تجربة أفضل. سنعود للعمل قريباً جداً، نشكركم على صبركم."
          )}
        </p>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <FaRedoAlt size={14} />
            <span>{t("appUpdate.tryAgain", "إعادة المحاولة")}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
