import axios from "axios";
import { API_BASE_URL } from "./api";
import { clearClientSession } from "../utils/session";
import { localStore, sessionStore } from "../utils/safeStorage";

// Single-flight guard so a burst of concurrent 401s triggers only one refresh.
let refreshing: Promise<string> | null = null;
let redirectingToLogin = false;

class SessionExpiredError extends Error {
  reason: "expired" | "accountDeleted";

  constructor(reason: "expired" | "accountDeleted" = "expired") {
    super("Session expired");
    this.name = "SessionExpiredError";
    this.reason = reason;
  }
}

export const TERMINAL_SESSION_CODES = new Set([
  "ACCOUNT_DELETED",
  "ACCOUNT_DISABLED",
  "ACCOUNT_CHANGED",
  "SESSION_REVOKED",
]);

// An expired or unverifiable access token is refreshable. The server sends
// 401 for both (a malformed token used to be 403, so 403 is still accepted).
const REFRESHABLE_TOKEN_CODES = new Set(["TOKEN_EXPIRED", "TOKEN_INVALID"]);

export function isRefreshableAuthFailure(
  status: number | undefined,
  code: unknown,
): boolean {
  return (
    (status === 401 || status === 403) &&
    typeof code === "string" &&
    REFRESHABLE_TOKEN_CODES.has(code)
  );
}

function endExpiredSession(
  reason: "expired" | "accountDeleted" = "expired",
): void {
  clearClientSession();
  if (redirectingToLogin || window.location.pathname === "/login") return;

  redirectingToLogin = true;
  sessionStore.setItem(
    reason === "accountDeleted" ? "accountDeleted" : "sessionExpired",
    "true",
  );
  window.location.replace("/login");
}

async function doRefresh(): Promise<string> {
  const refreshToken = localStore.getItem("refreshToken");
  if (!refreshToken) throw new SessionExpiredError();

  try {
    const resp = await axios.post(
      `${API_BASE_URL}/users/refresh`,
      { refreshToken },
      { timeout: 15000 },
    );
    const newToken = resp?.data?.data?.token;
    const nextRefreshToken = resp?.data?.data?.refreshToken;
    if (!newToken) throw new SessionExpiredError();

    localStore.setItem("token", newToken);
    if (nextRefreshToken) {
      localStore.setItem("refreshToken", nextRefreshToken);
    }
    return newToken;
  } catch (error) {
    if (error instanceof SessionExpiredError) throw error;

    // Only end the session when the server confirms that the refresh token is
    // unusable. Network/server outages must not sign the user out.
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      throw new SessionExpiredError(
        error.response?.data?.code === "ACCOUNT_DELETED"
          ? "accountDeleted"
          : "expired",
      );
    }
    throw error;
  }
}

// Installs a global response interceptor on the default axios instance (shared
// by every call site in the app). When the server reports an expired access
// token, it silently refreshes once and retries the original request. If the
// refresh fails, local session state is cleared.
export function setupAxiosAuth(): void {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original: any = error.config;
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const url: string = original?.url || "";
      const isLoginCall = url.includes("/users/login");
      const isAuthCall = url.includes("/users/refresh") || isLoginCall;
      const isDeletedAccount = code === "ACCOUNT_DELETED";
      // A login rejection (for example ACCOUNT_DISABLED) is not a session
      // ending; the login page shows the specific reason instead.
      const isTerminalSession =
        !isLoginCall && TERMINAL_SESSION_CODES.has(code);
      const canRefresh = isRefreshableAuthFailure(status, code);

      if (isTerminalSession) {
        endExpiredSession(isDeletedAccount ? "accountDeleted" : "expired");
        return Promise.reject(error);
      }

      if (
        canRefresh &&
        original &&
        !original._retry &&
        !isAuthCall
      ) {
        original._retry = true;
        if (!refreshing) {
          refreshing = doRefresh().finally(() => {
            refreshing = null;
          });
        }
        try {
          const newToken = await refreshing;
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return axios(original);
        } catch (refreshError) {
          if (refreshError instanceof SessionExpiredError) {
            endExpiredSession(refreshError.reason);
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );
}
