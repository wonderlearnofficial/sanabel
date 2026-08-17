import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaRocket, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

interface UpdatePromptModalProps {
  open: boolean;
  latestVersion: string;
  releaseNotes: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  open,
  latestVersion,
  releaseNotes,
  onUpdate,
  onDismiss,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-3xl dark:bg-slate-900 border border-emerald-100 dark:border-slate-800"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors top-4 end-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <FaTimes size={16} />
          </button>

          {/* Decorative Gradient Header */}
          <div className="p-6 text-center bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white relative">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
              <FaRocket className="text-3xl text-emerald-100 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              {t("appUpdate.newVersionTitle", "تحديث جديد متوفر!")}
            </h3>
            <span className="inline-block px-3 py-1 mt-1 text-xs font-semibold bg-white/20 rounded-full tracking-wider">
              v{latestVersion}
            </span>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
                {t("appUpdate.whatsNew", "ما الجديد في هذا الإصدار:")}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {releaseNotes || t("appUpdate.defaultNotes", "تحسينات في الأداء وإصلاحات لمختلف المزايا.")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onDismiss}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                {t("appUpdate.remindLater", "لاحقاً")}
              </button>
              <button
                onClick={onUpdate}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all shadow-md shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
              >
                <span>{t("appUpdate.updateNow", "تحديث الآن")}</span>
                <FaExternalLinkAlt size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
