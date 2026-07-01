// Extracts a human-readable message from a failed axios request, preferring
// whatever the server actually said over a generic fallback.
export function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (data) {
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (typeof data.error === "string" && data.error.trim()) return data.error;
  }
  if (!error?.response && error?.message) {
    // Network-level failure (no response at all): timeout, CORS, DNS, offline, etc.
    return "networkError";
  }
  return fallback;
}
