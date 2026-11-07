import React, { useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { localStore } from "../../utils/safeStorage";

/**
 * Public account-deletion page (Google Play requirement): reachable without the
 * app or a sign-in at /delete-account. A person asks for their account to be
 * deleted; an administrator reviews the request and deletes the account.
 * Signed in, one tap sends the request for that account.
 */

type Lang = "ar" | "en";

const TEXT = {
  ar: {
    title: "حذف حساب سنابل الإحسان",
    intro:
      "يمكنك طلب حذف حسابك من هنا دون الحاجة إلى تثبيت التطبيق. يراجع فريقنا الطلب ثم يحذف الحساب ويتواصل معك عبر البريد الإلكتروني.",
    whatTitle: "ما الذي يُحذف؟",
    what: [
      "الحساب وبيانات الدخول والملف الشخصي (الاسم والصورة الرمزية).",
      "تقدّم الطالب في المهام والتحديات ونقاطه.",
      "للمعلم أو ولي الأمر: ربط الحساب بالطلاب والفصول (لا تُحذف حسابات الطلاب الآخرين).",
    ],
    keepTitle: "ما الذي قد يبقى؟",
    keep: "سجل إداري بعملية الحذف نفسها (أن حسابًا حُذف ومتى)، يُحفظ للأمان والتدقيق.",
    when: "نراجع الطلبات خلال أيام قليلة، ولا يمكن التراجع عن الحذف بعد تنفيذه.",
    signedInTitle: "أنت مسجّل الدخول",
    signedInBody: "اضغط الزر لإرسال طلب حذف حسابك الحالي.",
    signedInButton: "أرسل طلب حذف حسابي",
    formTitle: "طلب حذف حساب",
    fullName: "الاسم الكامل",
    contactEmail: "البريد الإلكتروني للتواصل معك",
    accountIdentifier: "البريد الإلكتروني أو اسم المستخدم للحساب",
    accountType: "نوع الحساب",
    student: "طالب",
    teacher: "معلم",
    parent: "ولي أمر",
    notSure: "غير متأكد",
    schoolName: "اسم المدرسة (اختياري)",
    details: "ملاحظات (اختياري)",
    submit: "أرسل الطلب",
    sending: "جارٍ الإرسال…",
    doneTitle: "وصلنا طلبك",
    doneBody:
      "سنراجع الطلب ونحذف الحساب ثم نتواصل معك على بريدك الإلكتروني. لن نخبر أحدًا بتفاصيل حسابك.",
    already: "لديك طلب مفتوح بالفعل، وسنتواصل معك قريبًا.",
    errorGeneric: "تعذّر إرسال الطلب. تحقق من الاتصال وحاول مرة أخرى.",
    errorRate: "طلبات كثيرة. حاول مرة أخرى بعد قليل.",
    switchLang: "English",
  },
  en: {
    title: "Delete your Sanabel Al Ehsan account",
    intro:
      "You can ask for your account to be deleted here, without installing the app. Our team reviews the request, deletes the account and contacts you by email.",
    whatTitle: "What is deleted",
    what: [
      "The account, its sign-in details and profile (name and avatar).",
      "A student's progress in missions and challenges, and their points.",
      "For a teacher or parent: the account's links to students and classes (other students' accounts are not deleted).",
    ],
    keepTitle: "What may be kept",
    keep: "An administrative record of the deletion itself (that an account was deleted, and when), kept for security and audit.",
    when: "We review requests within a few days. Deletion cannot be undone once done.",
    signedInTitle: "You are signed in",
    signedInBody: "Press the button to send a deletion request for your current account.",
    signedInButton: "Send my deletion request",
    formTitle: "Request account deletion",
    fullName: "Full name",
    contactEmail: "Email we can contact you on",
    accountIdentifier: "The account's email or username",
    accountType: "Account type",
    student: "Student",
    teacher: "Teacher",
    parent: "Parent",
    notSure: "Not sure",
    schoolName: "School name (optional)",
    details: "Notes (optional)",
    submit: "Send request",
    sending: "Sending…",
    doneTitle: "We received your request",
    doneBody:
      "We will review it, delete the account and contact you by email. We never share details of an account with anyone else.",
    already: "You already have an open request. We will contact you soon.",
    errorGeneric: "The request could not be sent. Check your connection and try again.",
    errorRate: "Too many requests. Try again in a little while.",
    switchLang: "العربية",
  },
} as const;

const initialLang = (): Lang => {
  try {
    const saved = localStore.getItem("language") || localStore.getItem("i18nextLng") || navigator.language;
    return String(saved).toLowerCase().startsWith("en") ? "en" : "ar";
  } catch {
    return "ar";
  }
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-[#4AAAD6]";

const DeleteAccount: React.FC = () => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const tx = TEXT[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const token = useMemo(() => localStore.getItem("token"), []);

  const [form, setForm] = useState({
    fullName: "",
    contactEmail: "",
    accountIdentifier: "",
    accountType: "",
    schoolName: "",
    details: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [already, setAlready] = useState(false);
  const [error, setError] = useState("");

  const failure = (e: unknown) => {
    if (axios.isAxiosError(e) && e.response?.status === 429) return tx.errorRate;
    const message = axios.isAxiosError(e) ? e.response?.data?.message : "";
    return e && axios.isAxiosError(e) && e.response?.status === 400 && message ? String(message) : tx.errorGeneric;
  };

  const submitPublic = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/account-deletion/requests`, form);
      setStatus("done");
    } catch (e) {
      setError(failure(e));
      setStatus("idle");
    }
  };

  const submitOwn = async () => {
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/account-deletion/mine`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAlready(Boolean(response.data?.alreadyRequested));
      setStatus("done");
    } catch (e) {
      setError(failure(e));
      setStatus("idle");
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((previous) => ({ ...previous, [key]: e.target.value }));

  return (
    <div className="h-full w-full overflow-y-auto bg-white">
        <main dir={dir} lang={lang} className="mx-auto w-full max-w-2xl px-4 py-6 text-black">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{tx.title}</h1>
            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-sm"
            >
              {tx.switchLang}
            </button>
          </div>

          <p className="mb-4 text-base leading-7">{tx.intro}</p>

          <section className="mb-4 rounded-xl bg-[#E6E9FF] p-4">
            <h2 className="mb-2 text-lg font-bold">{tx.whatTitle}</h2>
            <ul className="list-disc space-y-1 ps-5 leading-7">
              {tx.what.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h2 className="mb-1 mt-3 text-lg font-bold">{tx.keepTitle}</h2>
            <p className="leading-7">{tx.keep}</p>
            <p className="mt-3 font-semibold leading-7">{tx.when}</p>
          </section>

          {status === "done" ? (
            <section role="status" className="rounded-xl border border-green-300 bg-green-50 p-4">
              <h2 className="mb-1 text-lg font-bold">{tx.doneTitle}</h2>
              <p className="leading-7">{already ? tx.already : tx.doneBody}</p>
            </section>
          ) : (
            <>
              {token && (
                <section className="mb-4 rounded-xl border border-gray-300 p-4">
                  <h2 className="mb-1 text-lg font-bold">{tx.signedInTitle}</h2>
                  <p className="mb-3 leading-7">{tx.signedInBody}</p>
                  <button
                    type="button"
                    onClick={submitOwn}
                    disabled={status === "sending"}
                    className="rounded-lg bg-[#E14E54] px-4 py-2 font-semibold text-white disabled:opacity-60"
                  >
                    {status === "sending" ? tx.sending : tx.signedInButton}
                  </button>
                </section>
              )}

              <form onSubmit={submitPublic} className="space-y-3 rounded-xl border border-gray-300 p-4">
                <h2 className="text-lg font-bold">{tx.formTitle}</h2>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{tx.fullName}</span>
                  <input required maxLength={120} className={inputClass} value={form.fullName} onChange={set("fullName")} autoComplete="name" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{tx.contactEmail}</span>
                  <input required type="email" maxLength={255} dir="ltr" className={inputClass} value={form.contactEmail} onChange={set("contactEmail")} autoComplete="email" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{tx.accountIdentifier}</span>
                  <input required maxLength={255} dir="ltr" className={inputClass} value={form.accountIdentifier} onChange={set("accountIdentifier")} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{tx.accountType}</span>
                  <select className={inputClass} value={form.accountType} onChange={set("accountType")}>
                    <option value="">{tx.notSure}</option>
                    <option value="student">{tx.student}</option>
                    <option value="teacher">{tx.teacher}</option>
                    <option value="parent">{tx.parent}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{tx.schoolName}</span>
                  <input maxLength={160} className={inputClass} value={form.schoolName} onChange={set("schoolName")} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{tx.details}</span>
                  <textarea maxLength={1000} rows={3} className={inputClass} value={form.details} onChange={set("details")} />
                </label>
                {error && (
                  <p role="alert" className="text-sm font-semibold text-[#E14E54]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-lg bg-[#4AAAD6] px-4 py-2 text-base font-semibold text-white disabled:opacity-60"
                >
                  {status === "sending" ? tx.sending : tx.submit}
                </button>
              </form>
              {error && token && (
                <p role="alert" className="mt-2 text-sm font-semibold text-[#E14E54]">
                  {error}
                </p>
              )}
            </>
          )}
        </main>
    </div>
  );
};

export default DeleteAccount;
