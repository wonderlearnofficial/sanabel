import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import sanabelLogo from "../assets/login/logo.png";
import {
  enablePrayerNotifications,
  EGYPT_CITIES,
  PrayerCity,
} from "../services/prayerNotifications";
import { requestAppNotificationPermissions } from "../services/appNotificationManager";
import { localStore } from "../utils/safeStorage";

export const PERMISSIONS_ONBOARDING_KEY = "sanabel:permissions_onboarding_completed";

export const PermissionsStartupModal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language !== "en";

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "detecting" | "manual_city" | "success">("intro");
  const [detectedCityName, setDetectedCityName] = useState<string>("");
  const [selectedCityKey, setSelectedCityKey] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasCompleted = localStore.getItem(PERMISSIONS_ONBOARDING_KEY) === "true";
    if (!hasCompleted) {
      // Small timeout to allow the initial screen render before presenting modal
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    panelRef.current?.scrollTo?.({ top: 0, behavior: "auto" });
  }, [step]);

  const markCompletedAndClose = () => {
    localStore.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
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
        localStore.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
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
        localStore.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
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

  const handleBackToIntro = () => {
    setErrorMessage("");
    setSelectedCityKey("");
    setStep("intro");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/55 backdrop-blur-[3px] overflow-y-auto overscroll-contain">
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 48 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="permissions-title"
          className="permissions-sheet w-full sm:max-w-md max-h-[92dvh] overflow-x-hidden overflow-y-auto bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-slate-100 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/70 dark:border-neutral-800 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 flex flex-col items-center text-center relative"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-neutral-700 mb-4 sm:hidden" aria-hidden="true" />
          {/* Decorative Background Blob */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Sanabel Logo Badge */}
          {step === "intro" && <motion.div
            initial={{ scale: 0.8, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-16 h-16 mb-3 p-1.5 bg-gradient-to-br from-emerald-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-2xl shadow-sm flex items-center justify-center border border-emerald-100 dark:border-neutral-700"
          >
            <img
              src={sanabelLogo}
              alt="سنابل الإحسان - Sanabel Logo"
              className="object-contain w-full h-full"
            />
          </motion.div>}

          {/* STEP 1: INTRO PROMPT */}
          {step === "intro" && (
            <div className="flex flex-col items-center w-full">
              <div className="mb-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {t("إعداد سريع وآمن")}
              </div>
              <h2 id="permissions-title" className="text-[1.35rem] font-extrabold text-slate-900 dark:text-white mb-1.5 leading-tight">
                {t("مرحباً بك في سنابل الإحسان 🌱")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed px-2 max-w-xs">
                {t(
                  "لتصلك تنبيهات مواعيد الصلاة وأعمال الخير اليومية بدقة، نرجو تفعيل الإشعارات والموقع الجغرافي."
                )}
              </p>

              {/* Permission Features Cards */}
              <div className="w-full grid grid-cols-2 gap-2.5 mb-4 text-start">
                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm text-lg">
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 leading-tight">
                      {t("تنبيهات الصلاة والتحديات")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-emerald-700/80 dark:text-emerald-400 mt-1">
                      {t("تذكيرات مواقيت الصلوات الخمس والمهام")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm text-lg">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-sky-900 dark:text-sky-300 leading-tight">
                      {t("تحديد الموقع التلقائي")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-sky-700/80 dark:text-sky-400 mt-1">
                      {t("حساب أوقات الصلاة الدقيقة لمدينتك")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full flex items-start gap-2 rounded-xl bg-slate-50 dark:bg-neutral-800/80 px-3 py-2.5 mb-4 text-start">
                <span className="text-base" aria-hidden="true">🔒</span>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("خصوصيتك محفوظة. نستخدم موقعك فقط لحساب مواقيت الصلاة ولا نشاركه مع الآخرين.")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleAutoDetectAndEnable}
                  className="w-full min-h-12 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  <span>📍</span>
                  <span>{t("تفعيل الإشعارات وتحديد الموقع")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep("manual_city")}
                  className="w-full min-h-12 py-2.5 px-4 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-2xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  {t("اختيار مدينتي يدويًا")}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full min-h-11 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  {t("لاحقاً")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETECTING / LOADING */}
          {step === "detecting" && (
            <div className="flex flex-col items-center py-8 px-3 w-full" role="status" aria-live="polite">
              <div className="relative w-20 h-20 mb-5">
                <div className="w-20 h-20 rounded-full border-[5px] border-emerald-100 dark:border-emerald-950 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  📍
                </div>
              </div>
              <h3 id="permissions-title" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t("جارٍ تحديد موقعك وتفعيل التنبيهات...")}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t("يرجى الموافقة على إذن الإشعارات والموقع")}
              </p>
              <div className="w-full max-w-xs grid grid-cols-2 gap-2 mt-6">
                <div className="rounded-xl bg-slate-50 dark:bg-neutral-800 px-3 py-2 text-xs text-slate-500">🔔 {t("الإشعارات")}</div>
                <div className="rounded-xl bg-slate-50 dark:bg-neutral-800 px-3 py-2 text-xs text-slate-500">📍 {t("الموقع")}</div>
              </div>
            </div>
          )}

          {/* STEP 3: MANUAL CITY SELECTION (FALLBACK) */}
          {step === "manual_city" && (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center w-full mb-3">
                <button
                  type="button"
                  onClick={handleBackToIntro}
                  aria-label={t("رجوع")}
                  className="w-11 h-11 shrink-0 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xl font-bold active:scale-95 transition"
                >
                  {isRTL ? "‹" : "›"}
                </button>
                <div className="flex-1 px-2">
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{t("اختيار يدوي")}</p>
                  <h3 id="permissions-title" className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {t("اختر مدينتك يدويًا 📍")}
                  </h3>
                </div>
                <div className="w-11" aria-hidden="true" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed max-w-xs">
                {t("اختر أقرب مدينة لك لحساب مواقيت الصلاة بدقة:")}
              </p>
              {errorMessage && (
                <div role="alert" className="w-full flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 p-3 mb-3 text-start">
                  <span className="font-black" aria-hidden="true">!</span>
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{t(errorMessage)}</p>
                </div>
              )}

              <div className="w-full max-h-[42dvh] overflow-y-auto px-0.5 pb-1 mb-4 custom-scrollbar overscroll-contain">
                <div className="grid grid-cols-2 gap-2">
                  {EGYPT_CITIES.map((city) => (
                    <button
                      key={city.key}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`min-h-12 p-2.5 text-sm font-semibold rounded-xl border text-center transition flex items-center justify-center gap-2 active:scale-[0.98] ${
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
                  className="w-full min-h-11 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t("🔄 إعادة المحاولة تلقائيًا")}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full min-h-12 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl"
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
              className="flex flex-col items-center py-8 px-3"
              role="status"
              aria-live="polite"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                ✓
              </div>
              <h3 id="permissions-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t("تم الإعداد بنجاح! 🎉")}
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                {t("تم تحديد مدينتك:")} {detectedCityName}
              </p>
              <p className="text-xs leading-relaxed text-slate-400 text-center max-w-xs">
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
