import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaExternalLinkAlt, FaGooglePlay, FaAppStoreIos } from "react-icons/fa";

interface ForceUpdateScreenProps {
  latestVersion: string;
  minRequiredVersion: string;
  releaseNotes: string;
  platform: "android" | "ios" | "web";
  onUpdate: () => void;
}

export const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({
  latestVersion,
  minRequiredVersion,
  releaseNotes,
  platform,
  onUpdate,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <motion.div
        className="relative w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-3xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
      >
        {/* Top visual banner */}
        <div className="p-8 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white relative">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white/20 backdrop-blur-md rounded-3xl shadow-xl">
            <FaShieldAlt className="text-4xl text-amber-100" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("appUpdate.forceUpdateTitle", "تحديث إلزامي مطلوب")}
          </h2>
          <p className="mt-1 text-sm text-orange-100 font-medium">
            {t(
              "appUpdate.forceUpdateSubtitle",
              "يتطلب الاستمرار في استخدام التطبيق التحديث إلى أحدث إصدار متاح."
            )}
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="px-3 py-1 text-xs font-bold bg-white/20 rounded-full">
              {t("appUpdate.requiredVersion", "الحد الأدنى:")} v{minRequiredVersion}
            </span>
            <span className="px-3 py-1 text-xs font-bold bg-black/20 rounded-full">
              {t("appUpdate.targetVersion", "الإصدار المتاح:")} v{latestVersion}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="p-5 text-start bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t("appUpdate.whatsNew", "ما الجديد:")}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {releaseNotes ||
                t(
                  "appUpdate.defaultForceNotes",
                  "يتضمن هذا التحديث تغييرات مهمة لضمان أمان واستقرار الخدمة وتوافقها مع خوادمنا."
                )}
            </p>
          </div>

          <button
            onClick={onUpdate}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-3 cursor-pointer active:scale-95"
          >
            {platform === "android" ? (
              <FaGooglePlay size={20} />
            ) : platform === "ios" ? (
              <FaAppStoreIos size={20} />
            ) : (
              <FaExternalLinkAlt size={18} />
            )}
            <span>
              {platform === "android"
                ? t("appUpdate.updateGooglePlay", "تحديث من متجر Google Play")
                : platform === "ios"
                ? t("appUpdate.updateAppStore", "تحديث من متجر App Store")
                : t("appUpdate.updateNow", "تحديث الآن")}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
