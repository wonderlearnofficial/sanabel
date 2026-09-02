import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { useUserContext } from "../../context/StudentUserProvider";

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
  password: string | null;
}

interface TestFamily {
  parent: {
    userId: number;
    parentId: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string | null;
  };
  children: TestChild[];
}

interface TestAccountData {
  school: { id: number; name: string } | null;
  grade: { id: number; name: string } | null;
  class: { id: number; name: string } | null;
  admin: {
    userId: number;
    adminsId: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string | null;
  } | null;
  teacher: {
    userId: number;
    teacherId: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string | null;
  } | null;
  families: TestFamily[];
  isProduction: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ROLE_CONFIG = {
  Admin: { label: "مشرف المدرسة", bg: "from-purple-600 to-purple-800", badge: "bg-purple-100 text-purple-700", icon: "🛡" },
  Teacher: { label: "معلم", bg: "from-emerald-600 to-emerald-800", badge: "bg-emerald-100 text-emerald-700", icon: "👩‍🏫" },
  Parent: { label: "ولي أمر", bg: "from-amber-500 to-amber-700", badge: "bg-amber-100 text-amber-700", icon: "👨" },
  Student: { label: "طالب", bg: "from-cyan-500 to-cyan-700", badge: "bg-cyan-100 text-cyan-700", icon: "👦" },
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-1 rounded px-1.5 py-0.5 text-xs transition-all"
      style={{ background: copied ? "#d1fae5" : "#f3f4f6", color: copied ? "#065f46" : "#6b7280" }}
      title="Copy"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
};

// ---------------------------------------------------------------------------
// AccountCard
// ---------------------------------------------------------------------------
interface AccountCardProps {
  userId: number;
  role: "Admin" | "Teacher" | "Parent" | "Student";
  firstName: string;
  lastName: string;
  email: string;
  password: string | null;
  extra?: React.ReactNode;
  isProduction: boolean;
  onLogin: (userId: number) => void;
  loggingInId: number | null;
}

const AccountCard: React.FC<AccountCardProps> = ({
  userId, role, firstName, lastName, email, password, extra, isProduction, onLogin, loggingInId,
}) => {
  const cfg = ROLE_CONFIG[role];
  const isLoggingIn = loggingInId === userId;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${cfg.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{firstName} {lastName}</p>
            <span className="text-xs text-white/70">{cfg.label}</span>
          </div>
        </div>
        {!isProduction && (
          <button
            onClick={() => onLogin(userId)}
            disabled={loggingInId !== null}
            className="rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-all border border-white/30"
          >
            {isLoggingIn ? "⏳ جاري..." : "⬆ دخول سريع"}
          </button>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-1 text-gray-600" dir="ltr">
          <span className="text-gray-400">✉</span>
          <span className="font-mono text-xs flex-1 truncate">{email}</span>
          <CopyButton text={email} />
        </div>
        {password && (
          <div className="flex items-center gap-1 text-gray-600" dir="ltr">
            <span className="text-gray-400">🔑</span>
            <span className="font-mono text-xs">{password}</span>
            <CopyButton text={password} />
          </div>
        )}
        {extra}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main TestPage
// ---------------------------------------------------------------------------
const TestPage: React.FC = () => {
  const { refreshUserData } = useUserContext();
  const [data, setData] = useState<TestAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingInId, setLoggingInId] = useState<number | null>(null);
  const [loginMsg, setLoginMsg] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/dev/test-accounts`)
      .then((r) => setData(r.data.data))
      .catch((e) => {
        const msg = e?.response?.data?.message || e.message;
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginAs = async (userId: number) => {
    setLoggingInId(userId);
    setLoginMsg(null);
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
      setLoginMsg("تعذر تسجيل الدخول: " + (e?.response?.data?.message || e.message));
      setLoggingInId(null);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full overflow-y-auto overscroll-y-contain bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-8 shadow-lg">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">🧪 صفحة الاختبار</h1>
              <p className="text-blue-200 text-sm">حسابات الاختبار وعلاقاتها — انقر على أي بطاقة لتسجيل الدخول مباشرة</p>
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded-xl bg-white/20 border border-white/30 hover:bg-white/30 px-4 py-2 text-sm font-semibold text-white transition"
            >
              ← فتح التطبيق
            </button>
          </div>

          {/* School info bar */}
          {data?.school && (
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { label: "المدرسة", value: data.school.name, icon: "🏫" },
                { label: "الصف", value: data.grade?.name ?? "—", icon: "📚" },
                { label: "الفصل", value: data.class?.name ?? "—", icon: "🏛" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 border border-white/20"
                >
                  <span>{item.icon}</span>
                  <span className="text-white/70 text-xs">{item.label}:</span>
                  <span className="text-white text-sm font-semibold">{item.value}</span>
                </div>
              ))}
              {data.isProduction && (
                <div className="flex items-center gap-2 rounded-xl bg-orange-500/30 px-3 py-1.5 border border-orange-400/40">
                  <span>⚠</span>
                  <span className="text-orange-100 text-xs font-medium">بيئة إنتاج — كلمات المرور مخفية، تسجيل الدخول السريع معطل</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {loginMsg && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {loginMsg}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400 text-lg">
            <span className="animate-spin ml-2">⏳</span> جاري التحميل...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-8 text-center text-red-600">
            <p className="text-2xl mb-2">❌</p>
            <p className="font-semibold">{error}</p>
            <p className="text-sm text-red-400 mt-1">
              هل تم تشغيل: <code>npm run seed:test-local</code>؟
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-8">
            {/* Admin & Teacher row */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-gray-200"></span>
                الإدارة والتدريس
                <span className="h-px flex-1 bg-gray-200"></span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.admin && (
                  <AccountCard
                    userId={data.admin.userId}
                    role="Admin"
                    firstName={data.admin.firstName}
                    lastName={data.admin.lastName}
                    email={data.admin.email}
                    password={data.admin.password}
                    isProduction={data.isProduction}
                    onLogin={loginAs}
                    loggingInId={loggingInId}
                    extra={
                      <div className="text-xs text-gray-400">
                        مشرف مدرسة · {data.school?.name}
                      </div>
                    }
                  />
                )}
                {data.teacher && (
                  <AccountCard
                    userId={data.teacher.userId}
                    role="Teacher"
                    firstName={data.teacher.firstName}
                    lastName={data.teacher.lastName}
                    email={data.teacher.email}
                    password={data.teacher.password}
                    isProduction={data.isProduction}
                    onLogin={loginAs}
                    loggingInId={loggingInId}
                    extra={
                      <div className="text-xs text-gray-400">
                        معلم · {data.class?.name}
                      </div>
                    }
                  />
                )}
              </div>
            </section>

            {/* Family trees */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-gray-200"></span>
                العائلات والطلاب
                <span className="h-px flex-1 bg-gray-200"></span>
              </h2>
              <div className="space-y-6">
                {data.families.map((family, fi) => (
                  <div
                    key={family.parent.userId}
                    className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                  >
                    {/* Parent header row */}
                    <div className="border-b border-gray-100">
                      <AccountCard
                        userId={family.parent.userId}
                        role="Parent"
                        firstName={family.parent.firstName}
                        lastName={family.parent.lastName}
                        email={family.parent.email}
                        password={family.parent.password}
                        isProduction={data.isProduction}
                        onLogin={loginAs}
                        loggingInId={loggingInId}
                        extra={
                          <div className="text-xs text-gray-400">
                            ولي أمر · {family.children.length} {family.children.length === 1 ? "طالب" : "طلاب"}
                          </div>
                        }
                      />
                    </div>

                    {/* Children */}
                    <div className="px-4 py-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1">
                        <span>└─</span> الأبناء
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {family.children.map((child, ci) => (
                          <div key={child.userId} className="relative">
                            {/* connector line */}
                            <div className="absolute right-0 top-0 bottom-0 -mr-4 w-px bg-amber-200"></div>
                            <AccountCard
                              userId={child.userId}
                              role="Student"
                              firstName={child.firstName}
                              lastName={child.lastName}
                              email={child.email}
                              password={child.password}
                              isProduction={data.isProduction}
                              onLogin={loginAs}
                              loggingInId={loggingInId}
                              extra={
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <span>كود الاتصال:</span>
                                  <span className="font-mono font-bold text-gray-600">{child.connectCode}</span>
                                  <CopyButton text={child.connectCode} />
                                </div>
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Relationship diagram */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-gray-200"></span>
                مخطط العلاقات
                <span className="h-px flex-1 bg-gray-200"></span>
              </h2>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm font-mono text-sm text-gray-700 leading-8 whitespace-pre-wrap" dir="ltr">
{`${data.school?.name ?? "School"} (Org ID: ${data.school?.id ?? "?"})
├── 🛡 Admin: ${data.admin?.email ?? "—"}
├── 📚 Grade: ${data.grade?.name ?? "—"}
└── 🏛 Class: ${data.class?.name ?? "—"}
    └── 👩‍🏫 Teacher: ${data.teacher?.email ?? "—"}
        ├── 👨 Ahmed Hassan (ahmed.hassan@sanabel.local)
        │   ├── 👦 Omar Ahmed  (omar.ahmed@sanabel.local)
        │   └── 👧 Lina Ahmed  (lina.ahmed@sanabel.local)
        ├── 👨 Khaled Mahmoud (khaled.mahmoud@sanabel.local)
        │   ├── 👦 Adam Khaled (adam.khaled@sanabel.local)
        │   └── 👧 Noor Khaled (noor.khaled@sanabel.local)
        └── 👨 Adel Samir (adel.samir@sanabel.local)
            └── 👦 Youssef Adel (youssef.adel@sanabel.local)`}
              </div>
            </section>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 pb-4">
              🔒 هذه الصفحة مخصصة للاختبار فقط — يُرجى حذفها بعد انتهاء مرحلة الاختبار
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
