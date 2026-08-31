import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import sanabelLogo from "../assets/login/logo.png";
import {
  enablePrayerNotifications,
  EGYPT_CITIES,
  PrayerCity,
} from "../services/prayerNotifications";
import { requestAppNotificationPermissions } from "../services/appNotificationManager";

export const PERMISSIONS_ONBOARDING_KEY = "sanabel:permissions_onboarding_completed";

export const PermissionsStartupModal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language !== "en";

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "detecting" | "manual_city" | "success">("intro");
  const [detectedCityName, setDetectedCityName] = useState<string>("");
  const [selectedCityKey, setSelectedCityKey] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const hasCompleted = localStorage.getItem(PERMISSIONS_ONBOARDING_KEY) === "true";
    if (!hasCompleted) {
      // Small timeout to allow the initial screen render before presenting modal
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const markCompletedAndClose = () => {
    localStorage.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
    setIsOpen(false);
  };

  const handleAutoDetectAndEnable = async () => {
    setStep("detecting");
    setErrorMessage("");

    try {
      // 1. Request notification permissions across native/web
      await requestAppNotificationPermissions().catch(() => false);

      // 2. Request geolocation & calculate nearest city / schedule prayers
      const result = await enablePrayerNotifications();

      if (result.ok) {
        const cityName = result.city
          ? isRTL
            ? result.city.arabicName
            : result.city.englishName || result.city.arabicName
          : isRTL
            ? "موقعك الحالي"
            : "Current Location";

        setDetectedCityName(cityName);
        localStorage.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
        setStep("success");
        setTimeout(() => {
          setIsOpen(false);
        }, 1800);
      } else {
        // Fallback: If not detected, ask him manually
        setStep("manual_city");
        if (result.message) {
          setErrorMessage(result.message);
        }
      }
    } catch (err) {
      console.warn("Auto detect permissions error:", err);
      setStep("manual_city");
    }
  };

  const handleSelectCity = async (city: PrayerCity) => {
    setSelectedCityKey(city.key);
    setStep("detecting");

    try {
      await requestAppNotificationPermissions().catch(() => false);
      const result = await enablePrayerNotifications(city);

      if (result.ok) {
        const cityName = isRTL ? city.arabicName : city.englishName || city.arabicName;
        setDetectedCityName(cityName);
        localStorage.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
        setStep("success");
        setTimeout(() => {
          setIsOpen(false);
        }, 1800);
      } else {
        setStep("manual_city");
        setErrorMessage(result.message || "حدث خطأ أثناء حفظ المدينة");
      }
    } catch (err) {
      console.warn("Manual city select error:", err);
      setStep("manual_city");
    }
  };

  const handleSkip = () => {
    markCompletedAndClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-sm overflow-hidden bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-950/40 p-6 flex flex-col items-center text-center relative"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Decorative Background Blob */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Sanabel Logo Badge */}
          <motion.div
            initial={{ scale: 0.8, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-24 h-24 mb-4 p-2 bg-gradient-to-br from-emerald-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-3xl shadow-md flex items-center justify-center border border-emerald-100 dark:border-neutral-700"
          >
            <img
              src={sanabelLogo}
              alt="سنابل الإحسان - Sanabel Logo"
              className="object-contain w-full h-full"
            />
          </motion.div>

          {/* STEP 1: INTRO PROMPT */}
          {step === "intro" && (
            <div className="flex flex-col items-center w-full">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5">
                {t("مرحباً بك في سنابل الإحسان 🌱")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed px-2">
                {t(
                  "لتصلك تنبيهات مواعيد الصلاة وأعمال الخير اليومية بدقة، نرجو تفعيل الإشعارات والموقع الجغرافي."
                )}
              </p>

              {/* Permission Features Cards */}
              <div className="w-full space-y-2.5 mb-5 text-right">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm text-lg">
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      {t("تنبيهات الصلاة والتحديات")}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                      {t("تذكيرات مواقيت الصلوات الخمس والمهام")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm text-lg">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-sky-900 dark:text-sky-300">
                      {t("تحديد الموقع التلقائي")}
                    </p>
                    <p className="text-[11px] text-sky-700/80 dark:text-sky-400">
                      {t("حساب أوقات الصلاة الدقيقة لمدينتك")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleAutoDetectAndEnable}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <span>📍</span>
                  <span>{t("تفعيل الإشعارات وتحديد الموقع")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep("manual_city")}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-2xl transition"
                >
                  {t("اختيار مدينتي يدويًا")}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  {t("لاحقاً")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETECTING / LOADING */}
          {step === "detecting" && (
            <div className="flex flex-col items-center py-6">
              <div className="relative w-16 h-16 mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-100 dark:border-emerald-950 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xl">
                  📍
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {t("جارٍ تحديد موقعك وتفعيل التنبيهات...")}
              </h3>
              <p className="text-xs text-slate-400">
                {t("يرجى الموافقة على إذن الإشعارات والموقع")}
              </p>
            </div>
          )}

          {/* STEP 3: MANUAL CITY SELECTION (FALLBACK) */}
          {step === "manual_city" && (
            <div className="flex flex-col items-center w-full">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {t("اختر مدينتك يدويًا 📍")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {errorMessage
                  ? t(errorMessage)
                  : t("اختر أقرب مدينة لك لحساب مواقيت الصلاة بدقة:")}
              </p>

              <div className="w-full max-h-48 overflow-y-auto pr-1 space-y-1.5 mb-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2">
                  {EGYPT_CITIES.map((city) => (
                    <button
                      key={city.key}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                        selectedCityKey === city.key
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                          : "bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-neutral-700 hover:border-emerald-400"
                      }`}
                    >
                      <span>🕌</span>
                      <span>{isRTL ? city.arabicName : city.englishName || city.arabicName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleAutoDetectAndEnable}
                  className="w-full py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t("🔄 إعادة المحاولة تلقائيًا")}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-2 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  {t("لاحقاً")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-4"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {t("تم الإعداد بنجاح! 🎉")}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                {t("تم تحديد مدينتك:")} {detectedCityName}
              </p>
              <p className="text-[11px] text-slate-400 text-center">
                {t("تم ضبط مواقيت الصلاة وتفعيل تنبيهات سنابل الإحسان.")}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PermissionsStartupModal;
