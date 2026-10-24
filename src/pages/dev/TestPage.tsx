import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config/api";
import { useUserContext } from "../../context/StudentUserProvider";
import { describeApiError } from "../../utils/apiError";

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
const ROLE_STYLE: Record<Role, { label: string; dot: string; avatar: string; ring: string }> = {
  Admin: { label: "مشرف المدرسة", dot: "bg-indigo-500", avatar: "bg-indigo-50 text-indigo-700", ring: "ring-indigo-100" },
  Teacher: { label: "معلم", dot: "bg-emerald-600", avatar: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-100" },
  Parent: { label: "ولي أمر", dot: "bg-amber-500", avatar: "bg-amber-50 text-amber-800", ring: "ring-amber-100" },
  Student: { label: "طالب", dot: "bg-sky-600", avatar: "bg-sky-50 text-sky-800", ring: "ring-sky-100" },
};

// The Admin console is a separate app with its own login, so a client token
// cannot sign an admin in there. Missing URL means the build is misconfigured.
const ADMIN_APP_URL = (import.meta.env.VITE_ADMIN_APP_URL || "").trim();

const initials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

const copyText = (text: string) =>
  navigator.clipboard?.writeText(text).then(() => true, () => false) ?? Promise.resolve(false);

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
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
      className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      {state === "copied" ? "تم النسخ" : state === "failed" ? "تعذر النسخ" : "نسخ"}
    </button>
  );
};

// ---------------------------------------------------------------------------
// AccountRow
// ---------------------------------------------------------------------------
interface AccountRowProps {
  userId: number;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  meta?: React.ReactNode;
  action: { label: string; busyLabel?: string; onClick: () => void; disabled?: boolean; busy?: boolean };
}

const AccountRow: React.FC<AccountRowProps> = ({ role, firstName, lastName, email, meta, action }) => {
  const style = ROLE_STYLE[role];
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-4 ${style.avatar} ${style.ring}`}
          aria-hidden
        >
          {initials(firstName, lastName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="font-bold text-slate-900">{firstName} {lastName}</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1">
            <span className="truncate text-sm text-slate-600" dir="ltr">{email}</span>
            <CopyButton text={email} label={`نسخ البريد ${email}`} />
          </div>
          {meta}
        </div>
      </div>
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        className="w-full shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 sm:w-auto"
      >
        {action.busy ? action.busyLabel : action.label}
      </button>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Main TestPage
// ---------------------------------------------------------------------------
const TestPage: React.FC = () => {
  const { t } = useTranslation();
  const { refreshUserData } = useUserContext();
  const [data, setData] = useState<TestAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInId, setLoggingInId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/dev/test-accounts`)
      .then((r) => setData(r.data.data))
      .catch((e) => {
        setError(
          e?.response?.status === 404
            ? "لم يتم إنشاء حسابات الاختبار في قاعدة البيانات هذه. شغّل npm run seed:test-local في مجلد server."
            : describeApiError(e, t),
        );
      })
      .finally(() => setLoading(false));
  }, [t]);

  const quickLogin = data ? !data.isProduction : false;

  const loginAs = async (userId: number) => {
    setLoggingInId(userId);
    setNotice(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/dev/login-as/${userId}`);
      const { token, role, email } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("keepLoggedIn", "true");
      const done = localStorage.getItem(`tutorialComplete-${email}`);
      localStorage.setItem("firstTimer", done ? "false" : "true");
      await refreshUserData(token);
      window.location.href = "/";
    } catch (e: any) {
      setNotice({ tone: "error", text: `تعذر الدخول السريع: ${describeApiError(e, t)}` });
      setLoggingInId(null);
    }
  };

  // Production has no passwordless login: copy the email and send the tester
  // to the normal login form.
  const goToLogin = async (email: string) => {
    if (!(await copyText(email))) {
      setNotice({ tone: "error", text: `تعذر نسخ ${email}. انسخه يدويًا ثم افتح صفحة الدخول.` });
      return;
    }
    window.location.href = "/login";
  };

  const openAdminConsole = async (email: string) => {
    const copied = await copyText(email);
    window.open(ADMIN_APP_URL, "_blank", "noopener,noreferrer");
    setNotice({
      tone: "info",
      text: copied
        ? `فُتحت لوحة الإدارة في نافذة جديدة، وتم نسخ ${email}. سجّل الدخول هناك بكلمة مرور الاختبار.`
        : `فُتحت لوحة الإدارة في نافذة جديدة. سجّل الدخول هناك بالبريد ${email} وكلمة مرور الاختبار.`,
    });
  };

  const accountAction = (userId: number, email: string) =>
    quickLogin
      ? {
          label: "دخول سريع",
          busyLabel: "جارٍ الدخول…",
          busy: loggingInId === userId,
          disabled: loggingInId !== null,
          onClick: () => loginAs(userId),
        }
      : { label: "صفحة الدخول", onClick: () => goToLogin(email) };

  return (
    <div
      className="fixed inset-0 z-10 h-full w-full overflow-y-auto overscroll-y-contain bg-slate-100"
      style={{ WebkitOverflowScrolling: "touch", minHeight: "100%" }}
      dir="rtl"
    >
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:pt-12">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">حسابات الاختبار</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              {data?.school
                ? `${data.school.name}، ${data.grade?.name ?? "بدون صف"}، ${data.class?.name ?? "بدون فصل"}`
                : "اختر حسابًا للدخول به وتجربة التطبيق."}
            </p>
          </div>
          <a
            href="/"
            className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:self-auto"
          >
            العودة إلى التطبيق
          </a>
        </header>

        {data && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
              quickLogin ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {quickLogin
              ? "بيئة تطوير: «دخول سريع» يسجّل الدخول دون كلمة مرور."
              : "بيئة الإنتاج: الدخول السريع غير متاح. انسخ البريد وسجّل الدخول بكلمة مرور الاختبار من صفحة الدخول."}
          </div>
        )}

        {notice && (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              notice.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-900"
            }`}
          >
            {notice.text}
          </div>
        )}

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="جارٍ تحميل الحسابات">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6">
            <p className="font-bold text-red-800">تعذر تحميل حسابات الاختبار</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-10">
            {/* Staff */}
            {(data.admin || data.teacher) && (
              <section>
                <SectionTitle title="الإدارة والتدريس" />
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  {data.admin && (
                    <AccountRow
                      userId={data.admin.userId}
                      role="Admin"
                      firstName={data.admin.firstName}
                      lastName={data.admin.lastName}
                      email={data.admin.email}
                      meta={
                        !ADMIN_APP_URL && (
                          <p className="mt-1 text-xs text-red-700">
                            رابط لوحة الإدارة غير مهيأ في هذا الإصدار (VITE_ADMIN_APP_URL).
                          </p>
                        )
                      }
                      action={{
                        label: "فتح لوحة الإدارة",
                        disabled: !ADMIN_APP_URL,
                        onClick: () => openAdminConsole(data.admin!.email),
                      }}
                    />
                  )}
                  {data.teacher && (
                    <AccountRow
                      userId={data.teacher.userId}
                      role="Teacher"
                      firstName={data.teacher.firstName}
                      lastName={data.teacher.lastName}
                      email={data.teacher.email}
                      meta={data.class && <p className="mt-1 text-xs text-slate-500">يدرّس {data.class.name}</p>}
                      action={accountAction(data.teacher.userId, data.teacher.email)}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Families */}
            <section>
              <SectionTitle title="العائلات" hint="كل ولي أمر وأبناؤه المرتبطون به" />
              {data.families.length === 0 ? (
                <p className="rounded-2xl bg-white px-4 py-6 text-sm text-slate-600">
                  لا توجد عائلات اختبار في قاعدة البيانات هذه.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.families.map((family) => (
                    <div
                      key={family.parent.userId}
                      className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    >
                      <AccountRow
                        userId={family.parent.userId}
                        role="Parent"
                        firstName={family.parent.firstName}
                        lastName={family.parent.lastName}
                        email={family.parent.email}
                        meta={
                          <p className="mt-1 text-xs text-slate-500">
                            {family.children.length === 0
                              ? "لا يوجد أبناء مرتبطون"
                              : family.children.length === 1
                                ? "ابن واحد مرتبط"
                                : `${family.children.length} أبناء مرتبطون`}
                          </p>
                        }
                        action={accountAction(family.parent.userId, family.parent.email)}
                      />
                      {family.children.length > 0 && (
                        <ul className="relative border-t border-slate-100 bg-slate-50/60 py-1">
                          {/* Branch line from the parent's avatar down through the children */}
                          <span className="absolute bottom-6 right-9 top-0 w-px bg-amber-200" aria-hidden />
                          {family.children.map((child) => (
                            <li key={child.userId} className="relative pr-10 sm:pr-12">
                              <span className="absolute right-9 top-8 h-px w-4 bg-amber-200 sm:w-6" aria-hidden />
                              <AccountRow
                                userId={child.userId}
                                role="Student"
                                firstName={child.firstName}
                                lastName={child.lastName}
                                email={child.email}
                                meta={
                                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                    <span>كود الربط</span>
                                    <span className="font-bold tabular-nums text-slate-800" dir="ltr">{child.connectCode}</span>
                                    <CopyButton text={child.connectCode} label={`نسخ كود الربط ${child.connectCode}`} />
                                  </div>
                                }
                                action={accountAction(child.userId, child.email)}
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

            <p className="text-center text-xs text-slate-500">
              صفحة داخلية لمرحلة الاختبار، تُحذف قبل الإطلاق.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
