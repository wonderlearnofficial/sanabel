import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  Backpack,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  KeyRound,
  Languages,
  Layers,
  LogIn,
  Moon,
  Presentation,
  School,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useUserContext } from "../../context/StudentUserProvider";
import { useTheme } from "../../context/ThemeContext";
import { describeApiError } from "../../utils/apiError";
import { localStore } from "../../utils/safeStorage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TestChild {
  userId: number;
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  connectCode: string;
}

interface TestFamily {
  parent: {
    userId: number;
    parentId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  children: TestChild[];
}

interface TestAccountData {
  school: { id: number; name: string } | null;
  grade: { id: number; name: string } | null;
  class: { id: number; name: string } | null;
  admin: { userId: number; adminsId: number; firstName: string; lastName: string; email: string } | null;
  teacher: { userId: number; teacherId: number; firstName: string; lastName: string; email: string } | null;
  families: TestFamily[];
  isProduction: boolean;
}

type Role = "Admin" | "Teacher" | "Parent" | "Student";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ROLE_STYLE: Record<Role, { label: string; Icon: typeof Users; tile: string; text: string }> = {
  Admin: {
    label: "مشرف المدرسة",
    Icon: ShieldCheck,
    tile: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  Teacher: {
    label: "معلم",
    Icon: Presentation,
    tile: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  Parent: {
    label: "ولي أمر",
    Icon: Users,
    tile: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    text: "text-amber-800 dark:text-amber-300",
  },
  Student: {
    label: "طالب",
    Icon: Backpack,
    tile: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    text: "text-sky-800 dark:text-sky-300",
  },
};

// The Admin console is a separate app with its own login, so a client token
// cannot sign an admin in there. Missing URL means the build is misconfigured.
const ADMIN_APP_URL = (import.meta.env.VITE_ADMIN_APP_URL || "").trim();

// Production has no passwordless /dev/login-as. Quick sign-in there uses the
// normal login endpoint with the shared test password: built in through
// VITE_TEST_ACCOUNT_PASSWORD, or entered once per device when that is unset.
const BUILT_IN_PASSWORD = (import.meta.env.VITE_TEST_ACCOUNT_PASSWORD || "").trim();
const PASSWORD_KEY = "testPagePassword";

const HOME_BY_ROLE: Record<string, string> = {
  Teacher: "/teacher/home",
  Parent: "/parent/home",
};

const copyText = (text: string) =>
  navigator.clipboard?.writeText(text).then(() => true, () => false) ?? Promise.resolve(false);

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-900";

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    setState((await copyText(text)) ? "copied" : "failed");
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={state === "failed" ? t("تعذر النسخ") : t("نسخ")}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${focusRing}`}
    >
      {state === "copied" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    </button>
  );
};

// ---------------------------------------------------------------------------
// AccountRow
// ---------------------------------------------------------------------------
interface AccountRowProps {
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  meta?: React.ReactNode;
  action: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
}

const AccountRow: React.FC<AccountRowProps> = ({ role, firstName, lastName, email, meta, action }) => {
  const { t } = useTranslation();
  const { Icon, tile, text, label } = ROLE_STYLE[role];
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile}`} aria-hidden>
          <Icon size={22} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="font-bold text-slate-900 dark:text-slate-50">{firstName} {lastName}</p>
            <span className={`text-xs font-semibold ${text}`}>{t(label)}</span>
          </div>
          <div className="flex min-w-0 items-center gap-0.5">
            <span className="truncate text-sm text-slate-600 dark:text-slate-400" dir="ltr">{email}</span>
            <CopyButton text={email} label={t("نسخ {{value}}", { value: email })} />
          </div>
          {meta}
        </div>
      </div>
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:hover:bg-slate-100 sm:w-auto ${focusRing}`}
      >
        {action.icon}
        {action.label}
      </button>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
    {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

const ToolbarButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode }> = ({
  onClick,
  label,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}
  >
    {children}
  </button>
);

const card = "overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800";

// ---------------------------------------------------------------------------
// Main TestPage
// ---------------------------------------------------------------------------
const TestPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { refreshUserData } = useUserContext();
  const [data, setData] = useState<TestAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInId, setLoggingInId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [savedPassword, setSavedPassword] = useState(() => localStore.getItem(PASSWORD_KEY) || "");
  const [passwordDraft, setPasswordDraft] = useState("");

  const isArabic = !i18n.language?.startsWith("en");

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/dev/test-accounts`)
      .then((r) => setData(r.data.data))
      .catch((e) => {
        setError(
          e?.response?.status === 404
            ? t("لم يتم إنشاء حسابات الاختبار في قاعدة البيانات هذه. شغّل npm run seed:test-local في مجلد server.")
            : describeApiError(e, t),
        );
      })
      .finally(() => setLoading(false));
  }, [t]);

  const passwordless = data ? !data.isProduction : false;
  const testPassword = BUILT_IN_PASSWORD || savedPassword;

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const value = passwordDraft.trim();
    if (!value) return;
    if (!localStore.setItem(PASSWORD_KEY, value)) {
      setNotice({ tone: "error", text: t("تعذر حفظ كلمة المرور على هذا الجهاز.") });
      return;
    }
    setSavedPassword(value);
    setPasswordDraft("");
    setNotice(null);
  };

  const forgetPassword = () => {
    localStore.removeItem(PASSWORD_KEY);
    setSavedPassword("");
  };

  // Mirrors Login.tsx for the mobile roles so the session looks identical to a
  // normal sign-in.
  const startSession = async (user: { token: string; refreshToken?: string; role: string; email: string }) => {
    if (!localStore.setItem("token", user.token)) {
      throw new Error(t("تعذر حفظ جلسة تسجيل الدخول على هذا الجهاز"));
    }
    if (user.refreshToken) localStore.setItem("refreshToken", user.refreshToken);
    localStore.setItem("role", user.role);
    localStore.setItem("keepLoggedIn", "true");
    localStore.removeItem("isImpersonated");
    localStore.removeItem("impersonatedStudentName");
    const tutorialDone = localStore.getItem(`tutorialComplete-${user.email}`);
    localStore.setItem("firstTimer", tutorialDone ? "false" : "true");
    await refreshUserData(user.token);
    window.location.href =
      user.role === "Student"
        ? tutorialDone ? "/student/home" : "/student/create-avatar"
        : HOME_BY_ROLE[user.role] ?? "/";
  };

  const quickSignIn = async (userId: number, email: string) => {
    if (!passwordless && !testPassword) {
      setNotice({ tone: "error", text: t("أدخل كلمة مرور الاختبار أولًا.") });
      return;
    }
    setLoggingInId(userId);
    setNotice(null);
    try {
      if (passwordless) {
        const res = await axios.post(`${API_BASE_URL}/dev/login-as/${userId}`);
        const { token, role } = res.data.data;
        await startSession({ token, role, email });
      } else {
        const res = await axios.patch(`${API_BASE_URL}/users/login`, { email, password: testPassword });
        const user = res.data.data.user;
        await startSession({ token: String(user.token), refreshToken: user.refreshToken, role: String(user.role), email });
      }
    } catch (e: any) {
      const reason = e?.response || e?.request ? describeApiError(e, t) : e?.message;
      setNotice({ tone: "error", text: t("تعذر الدخول السريع: {{reason}}", { reason }) });
      setLoggingInId(null);
    }
  };

  // The console signs the account in itself from #test-login (its LoginPage),
  // since a token from this origin cannot reach the console's storage.
  const openAdminConsole = (email: string) => {
    const url = `${ADMIN_APP_URL.replace(/\/+$/, "")}/login#test-login=${encodeURIComponent(email)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const signInAction = (userId: number, email: string) => ({
    label: loggingInId === userId ? t("جارٍ الدخول…") : t("دخول سريع"),
    icon: <LogIn size={16} className={isArabic ? "-scale-x-100" : ""} />,
    disabled: loggingInId !== null || (!passwordless && !testPassword),
    onClick: () => quickSignIn(userId, email),
  });

  return (
    <div
      className={`fixed inset-0 z-10 h-full w-full overflow-y-auto overscroll-y-contain bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100`}
      style={{ WebkitOverflowScrolling: "touch", minHeight: "100%" }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:pt-10">
        {/* Toolbar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <a
            href="/"
            className={`rounded-lg px-1 py-2 text-sm font-semibold text-slate-600 underline-offset-4 hover:underline dark:text-slate-300 ${focusRing}`}
          >
            {t("العودة إلى التطبيق")}
          </a>
          <div className="flex items-center gap-2">
            <ToolbarButton
              onClick={() => i18n.changeLanguage(isArabic ? "en" : "ar")}
              label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Languages size={16} />
              {isArabic ? "English" : "العربية"}
            </ToolbarButton>
            <ToolbarButton onClick={toggleDarkMode} label={darkMode ? t("الوضع الفاتح") : t("الوضع الداكن")}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span className="hidden sm:inline">{darkMode ? t("الوضع الفاتح") : t("الوضع الداكن")}</span>
            </ToolbarButton>
          </div>
        </div>

        {/* Header */}
        <header className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" aria-hidden>
            <FlaskConical size={28} />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black sm:text-4xl">{t("حسابات الاختبار")}</h1>
            {data?.school ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  { Icon: School, value: data.school.name },
                  { Icon: Layers, value: data.grade?.name ?? t("بدون صف") },
                  { Icon: Presentation, value: data.class?.name ?? t("بدون فصل") },
                ].map(({ Icon, value }) => (
                  <li key={value} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <Icon size={14} className="text-slate-400" aria-hidden />
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("اختر حسابًا للدخول به وتجربة التطبيق.")}</p>
            )}
          </div>
        </header>

        {/* Quick sign-in setup */}
        {data && !passwordless && !BUILT_IN_PASSWORD && (
          <div className={`${card} mb-6 p-4`}>
            {savedPassword ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <Check size={16} aria-hidden />
                  {t("الدخول السريع مفعّل على هذا الجهاز.")}
                </p>
                <button
                  type="button"
                  onClick={forgetPassword}
                  className={`rounded-lg px-2 py-1 text-sm text-slate-500 underline-offset-4 hover:underline dark:text-slate-400 ${focusRing}`}
                >
                  {t("إزالة كلمة المرور من هذا الجهاز")}
                </button>
              </div>
            ) : (
              <form onSubmit={savePassword} className="space-y-3">
                <label htmlFor="test-password" className="flex items-center gap-2 text-sm font-semibold">
                  <KeyRound size={16} className="text-slate-400" aria-hidden />
                  {t("كلمة مرور الاختبار")}
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("أدخلها مرة واحدة ليعمل الدخول السريع على هذا الجهاز.")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="test-password"
                    type="password"
                    autoComplete="off"
                    value={passwordDraft}
                    onChange={(e) => setPasswordDraft(e.target.value)}
                    dir="ltr"
                    className={`h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${focusRing}`}
                  />
                  <button
                    type="submit"
                    disabled={!passwordDraft.trim()}
                    className={`h-10 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 ${focusRing}`}
                  >
                    {t("تفعيل الدخول السريع")}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {notice && (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              notice.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
            }`}
          >
            {notice.text}
          </div>
        )}

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label={t("جارٍ تحميل الحسابات")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className={`${card} p-6`}>
            <p className="font-bold text-red-700 dark:text-red-300">{t("تعذر تحميل حسابات الاختبار")}</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-10">
            {/* Staff */}
            {(data.admin || data.teacher) && (
              <section>
                <SectionTitle title={t("الإدارة والتدريس")} />
                <div className={`${card} divide-y divide-slate-100 dark:divide-slate-800`}>
                  {data.admin && (
                    <AccountRow
                      role="Admin"
                      firstName={data.admin.firstName}
                      lastName={data.admin.lastName}
                      email={data.admin.email}
                      meta={
                        <p className={`mt-0.5 text-xs ${ADMIN_APP_URL ? "text-slate-500 dark:text-slate-400" : "text-red-700 dark:text-red-300"}`}>
                          {ADMIN_APP_URL
                            ? t("يفتح لوحة الإدارة في نافذة جديدة.")
                            : t("رابط لوحة الإدارة غير مهيأ في هذا الإصدار (VITE_ADMIN_APP_URL).")}
                        </p>
                      }
                      action={{
                        label: t("دخول سريع"),
                        icon: <ExternalLink size={16} />,
                        disabled: !ADMIN_APP_URL,
                        onClick: () => openAdminConsole(data.admin!.email),
                      }}
                    />
                  )}
                  {data.teacher && (
                    <AccountRow
                      role="Teacher"
                      firstName={data.teacher.firstName}
                      lastName={data.teacher.lastName}
                      email={data.teacher.email}
                      meta={
                        data.class && (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {t("يدرّس {{className}}", { className: data.class.name })}
                          </p>
                        )
                      }
                      action={signInAction(data.teacher.userId, data.teacher.email)}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Families */}
            <section>
              <SectionTitle title={t("العائلات")} hint={t("كل ولي أمر وأبناؤه المرتبطون به")} />
              {data.families.length === 0 ? (
                <p className={`${card} px-4 py-6 text-sm text-slate-600 dark:text-slate-400`}>
                  {t("لا توجد عائلات اختبار في قاعدة البيانات هذه.")}
                </p>
              ) : (
                <div className="space-y-4">
                  {data.families.map((family) => (
                    <div key={family.parent.userId} className={card}>
                      <AccountRow
                        role="Parent"
                        firstName={family.parent.firstName}
                        lastName={family.parent.lastName}
                        email={family.parent.email}
                        meta={
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {family.children.length === 0
                              ? t("لا يوجد أبناء مرتبطون")
                              : family.children.length === 1
                                ? t("ابن واحد مرتبط")
                                : t("{{count}} أبناء مرتبطون", { count: family.children.length })}
                          </p>
                        }
                        action={signInAction(family.parent.userId, family.parent.email)}
                      />
                      {family.children.length > 0 && (
                        <ul className="relative border-t border-slate-100 bg-slate-50/70 py-1 dark:border-slate-800 dark:bg-slate-950/40">
                          {/* Branch line from the parent's icon down through the children */}
                          <span className="absolute bottom-7 start-[37px] top-0 w-px bg-amber-300 dark:bg-amber-500/40" aria-hidden />
                          {family.children.map((child) => (
                            <li key={child.userId} className="relative ps-10 sm:ps-12">
                              <span className="absolute start-[37px] top-[34px] h-px w-5 bg-amber-300 dark:bg-amber-500/40 sm:w-7" aria-hidden />
                              <AccountRow
                                role="Student"
                                firstName={child.firstName}
                                lastName={child.lastName}
                                email={child.email}
                                meta={
                                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{t("كود الربط")}</span>
                                    <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200" dir="ltr">{child.connectCode}</span>
                                    <CopyButton text={child.connectCode} label={t("نسخ {{value}}", { value: child.connectCode })} />
                                  </div>
                                }
                                action={signInAction(child.userId, child.email)}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <p className="text-center text-xs text-slate-500 dark:text-slate-500">
              {t("صفحة داخلية لمرحلة الاختبار، تُحذف قبل الإطلاق.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
