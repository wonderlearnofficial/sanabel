import { getErrorMessage } from "../../../config/getErrorMessage";

const SIGNUP_INCOMPLETE =
  "لم يكتمل إنشاء هذا الحساب بعد. أكمل التسجيل من صفحة إنشاء حساب.";

// Returns an i18n key naming the missing field, or null when both are filled.
export function validateLoginFields(
  email: string,
  password: string,
): string | null {
  const hasEmail = email.trim() !== "";
  const hasPassword = password !== "";
  if (!hasEmail && !hasPassword) {
    return "يرجى إدخال البريد الإلكتروني وكلمة المرور.";
  }
  if (!hasEmail) return "يرجى إدخال البريد الإلكتروني.";
  if (!hasPassword) return "يرجى إدخال كلمة المرور.";
  return null;
}

// Maps a failed PATCH /users/login to an i18n key. Login has no session yet,
// so a bare 401/403 must never be reported as "session expired".
export function describeLoginError(error: any): string {
  const status = error?.response?.status;
  const message = getErrorMessage(error, "login_failed");

  // describeApiError resolves known codes and messages first; only fall back
  // to status-based login wording when it produced a generic answer.
  const isGeneric =
    message === "login_failed" ||
    message === "انتهت صلاحية جلستك. سجل الدخول مرة أخرى." ||
    /^[\x00-\x7F]*$/.test(message); // untranslated server text

  if (!isGeneric) return message;

  // 409: the email belongs to a signup that was never finished.
  if (status === 409) return SIGNUP_INCOMPLETE;
  // 400: the server rejected missing fields.
  if (status === 400) return "fill_all_fields";
  if (status === 401 || status === 403) return "login_failed";
  return message;
}
