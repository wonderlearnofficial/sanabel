import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FaAndroid,
  FaApple,
  FaTools,
  FaSave,
  FaSync,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../../config/api";

interface PlatformConfig {
  id?: number;
  platform: string;
  latestVersion: string;
  minRequiredVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  releaseNotesAr: string;
  releaseNotesEn: string;
  maintenanceMode: boolean;
}

export const AppVersionControl: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [androidConfig, setAndroidConfig] = useState<PlatformConfig>({
    platform: "android",
    latestVersion: "1.2.6",
    minRequiredVersion: "1.0.0",
    forceUpdate: false,
    storeUrl: "https://play.google.com/store/apps/details?id=com.wonderlearn.sanabel",
    releaseNotesAr: "تحديث جديد يتضمن تحسينات عامة وإصلاحات في الأداء.",
    releaseNotesEn: "New update including general improvements and bug fixes.",
    maintenanceMode: false,
  });

  const [iosConfig, setIosConfig] = useState<PlatformConfig>({
    platform: "ios",
    latestVersion: "1.0.0",
    minRequiredVersion: "1.0.0",
    forceUpdate: false,
    storeUrl: "",
    releaseNotesAr: "تحديث جديد يتضمن تحسينات عامة وإصلاحات في الأداء.",
    releaseNotesEn: "New update including general improvements and bug fixes.",
    maintenanceMode: false,
  });

  const [globalMaintenance, setGlobalMaintenance] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/app-version`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success && Array.isArray(res.data.configs)) {
        const configs: PlatformConfig[] = res.data.configs;
        const android = configs.find((c) => c.platform === "android");
        const ios = configs.find((c) => c.platform === "ios");
        const global = configs.find((c) => c.platform === "global");

        if (android) setAndroidConfig(android);
        if (ios) setIosConfig(ios);
        if (global) setGlobalMaintenance(Boolean(global.maintenanceMode));
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          t("admin.versionControl.fetchError", "فشل تحميل إعدادات إصدارات التطبيق")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = [
        androidConfig,
        iosConfig,
        {
          platform: "global",
          latestVersion: "1.0.0",
          minRequiredVersion: "1.0.0",
          forceUpdate: false,
          storeUrl: "",
          releaseNotesAr: "",
          releaseNotesEn: "",
          maintenanceMode: globalMaintenance,
        },
      ];

      const res = await axios.put(`${API_BASE_URL}/admin/app-version`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast.success(
          t("admin.versionControl.saveSuccess", "تم حفظ إعدادات الإصدارات بنجاح!")
        );
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          t("admin.versionControl.saveError", "فشل حفظ إعدادات الإصدارات")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FaSync size={20} className={loading ? "animate-spin" : ""} />
            </span>
            <span>{t("admin.versionControl.title", "إدارة إصدارات التطبيق والتحديثات")}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "admin.versionControl.subtitle",
              "التحكم في التحديثات الإلزامية والاختيارية لتطبيقات Android و iOS ورسائل الصيانة."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={t("admin.versionControl.refresh", "تحديث البيانات")}
          >
            <FaSync size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <FaSave size={16} />
            <span>{saving ? t("admin.saving", "جاري الحفظ...") : t("admin.saveChanges", "حفظ التغييرات")}</span>
          </button>
        </div>
      </div>

      {/* Global Emergency Maintenance Alert */}
      <motion.div
        className={`p-6 rounded-3xl border transition-all ${
          globalMaintenance
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl text-xl ${
                globalMaintenance
                  ? "bg-red-500 text-white animate-bounce"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <FaTools />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {t("admin.versionControl.maintenanceMode", "وضع الصيانة الشامل")}
                {globalMaintenance && (
                  <span className="px-2.5 py-0.5 text-xs font-black bg-red-500 text-white rounded-full">
                    {t("admin.active", "نشط")}
                  </span>
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "admin.versionControl.maintenanceDesc",
                  "عند تفعيل وضع الصيانة، سيتم قفل الوصول لجميع مستخدمي الهواتف وعرض شاشة الصيانة."
                )}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={globalMaintenance}
              onChange={(e) => setGlobalMaintenance(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>
      </motion.div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Android Card */}
        <motion.div
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm text-2xl">
                <FaAndroid />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t("admin.versionControl.androidApp", "تطبيق Android")}</h3>
                <span className="text-xs text-emerald-100">Google Play Store</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full text-xs font-semibold">
              <FaShieldAlt />
              <span>
                {androidConfig.forceUpdate
                  ? t("admin.versionControl.forceUpdateOn", "تحديث إلزامي مفعل")
                  : t("admin.versionControl.softUpdateOn", "تحديث اختياري")}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Version Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("admin.versionControl.latestVersion", "أحدث إصدار (Latest)")}
                </label>
                <input
                  type="text"
                  value={androidConfig.latestVersion}
                  onChange={(e) =>
                    setAndroidConfig({ ...androidConfig, latestVersion: e.target.value })
                  }
                  placeholder="1.2.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("admin.versionControl.minRequiredVersion", "الحد الأدنى المطلوب (Min)")}
                </label>
                <input
                  type="text"
                  value={androidConfig.minRequiredVersion}
                  onChange={(e) =>
                    setAndroidConfig({ ...androidConfig, minRequiredVersion: e.target.value })
                  }
                  placeholder="1.0.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Force Update Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block">
                  {t("admin.versionControl.forceUpdateSwitch", "فرض التحديث الإلزامي (Force Update)")}
                </span>
                <span className="text-xs text-slate-500">
                  {t(
                    "admin.versionControl.forceUpdateHelp",
                    "عند تفعيله، سيتم منع فتح التطبيق لمن يملك إصداراً أقل من أحدث إصدار."
                  )}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={androidConfig.forceUpdate}
                  onChange={(e) =>
                    setAndroidConfig({ ...androidConfig, forceUpdate: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Store URL */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("admin.versionControl.storeUrl", "رابط متجر Google Play")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={androidConfig.storeUrl}
                  onChange={(e) =>
                    setAndroidConfig({ ...androidConfig, storeUrl: e.target.value })
                  }
                  placeholder="https://play.google.com/store/apps/details?id=com.wonderlearn.sanabel"
                  className="w-full px-4 py-3 pe-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <a
                  href={androidConfig.storeUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute end-3 top-3.5 text-slate-400 hover:text-emerald-600"
                >
                  <FaExternalLinkAlt size={14} />
                </a>
              </div>
            </div>

            {/* Release Notes Arabic */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("admin.versionControl.notesAr", "ملاحظات الإصدار (العربية)")}
              </label>
              <textarea
                rows={3}
                value={androidConfig.releaseNotesAr}
                onChange={(e) =>
                  setAndroidConfig({ ...androidConfig, releaseNotesAr: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Release Notes English */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("admin.versionControl.notesEn", "ملاحظات الإصدار (الإنجليزية)")}
              </label>
              <textarea
                rows={3}
                value={androidConfig.releaseNotesEn}
                onChange={(e) =>
                  setAndroidConfig({ ...androidConfig, releaseNotesEn: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </motion.div>

        {/* iOS Card */}
        <motion.div
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm text-2xl">
                <FaApple />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t("admin.versionControl.iosApp", "تطبيق iOS")}</h3>
                <span className="text-xs text-blue-100">Apple App Store</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full text-xs font-semibold">
              <FaShieldAlt />
              <span>
                {iosConfig.forceUpdate
                  ? t("admin.versionControl.forceUpdateOn", "تحديث إلزامي مفعل")
                  : t("admin.versionControl.softUpdateOn", "تحديث اختياري")}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Version Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("admin.versionControl.latestVersion", "أحدث إصدار (Latest)")}
                </label>
                <input
                  type="text"
                  value={iosConfig.latestVersion}
                  onChange={(e) =>
                    setIosConfig({ ...iosConfig, latestVersion: e.target.value })
                  }
                  placeholder="1.2.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t("admin.versionControl.minRequiredVersion", "الحد الأدنى المطلوب (Min)")}
                </label>
                <input
                  type="text"
                  value={iosConfig.minRequiredVersion}
                  onChange={(e) =>
                    setIosConfig({ ...iosConfig, minRequiredVersion: e.target.value })
                  }
                  placeholder="1.0.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Force Update Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block">
                  {t("admin.versionControl.forceUpdateSwitch", "فرض التحديث الإلزامي (Force Update)")}
                </span>
                <span className="text-xs text-slate-500">
                  {t(
                    "admin.versionControl.forceUpdateHelp",
                    "عند تفعيله، سيتم منع فتح التطبيق لمن يملك إصداراً أقل من أحدث إصدار."
                  )}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={iosConfig.forceUpdate}
                  onChange={(e) =>
                    setIosConfig({ ...iosConfig, forceUpdate: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Store URL */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("admin.versionControl.storeUrlIos", "رابط متجر Apple App Store")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={iosConfig.storeUrl}
                  onChange={(e) =>
                    setIosConfig({ ...iosConfig, storeUrl: e.target.value })
                  }
                  placeholder="https://apps.apple.com/app/id... (سيتم إضافته بعد نشر تطبيق iOS)"
                  className="w-full px-4 py-3 pe-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <a
                  href={iosConfig.storeUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute end-3 top-3.5 text-slate-400 hover:text-blue-600"
                >
                  <FaExternalLinkAlt size={14} />
                </a>
              </div>
            </div>

            {/* Release Notes Arabic */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("admin.versionControl.notesAr", "ملاحظات الإصدار (العربية)")}
              </label>
              <textarea
                rows={3}
                value={iosConfig.releaseNotesAr}
                onChange={(e) =>
                  setIosConfig({ ...iosConfig, releaseNotesAr: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Release Notes English */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t("admin.versionControl.notesEn", "ملاحظات الإصدار (الإنجليزية)")}
              </label>
              <textarea
                rows={3}
                value={iosConfig.releaseNotesEn}
                onChange={(e) =>
                  setIosConfig({ ...iosConfig, releaseNotesEn: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Informative Guidance Card */}
      <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl flex items-start gap-4">
        <FaInfoCircle className="text-2xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
          <p className="font-bold">
            {t("admin.versionControl.guideTitle", "كيف تعمل التحديثات على الهواتف؟")}
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
            <li>
              <strong>{t("admin.versionControl.softUpdate", "تحديث اختياري (Soft):")}</strong>{" "}
              {t(
                "admin.versionControl.softUpdateExpl",
                "يظهر للمستخدم نافذة منبثقة تفيده بوجود إصدار أحدث مع إمكانية التخطي والمتابعة."
              )}
            </li>
            <li>
              <strong>{t("admin.versionControl.hardUpdate", "تحديث إلزامي (Force):")}</strong>{" "}
              {t(
                "admin.versionControl.hardUpdateExpl",
                "يقفل التطبيق تماماً بشاشة تلزم المستخدم بالدخول للمتجر لتحديث التطبيق للاستمرار."
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
