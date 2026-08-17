import { describeApiError } from "../utils/apiError";

// Backward-compatible wrapper for non-admin screens that still use the old
// helper. New code should use describeApiError directly with the active i18n
// translator. Unknown server messages continue to pass through unchanged.
export function getErrorMessage(error: any, fallback: string): string {
  const message = describeApiError(error);
  return message === "حدث خطأ غير متوقع. حاول مرة أخرى." ? fallback : message;
}
