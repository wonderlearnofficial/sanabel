import axios from "axios";
import { API_BASE_URL } from "./api";

// Single-flight guard so a burst of concurrent 401s triggers only one refresh.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const resp = await axios.post(`${API_BASE_URL}/users/refresh`, {
      refreshToken,
    });
    const newToken = resp?.data?.data?.token;
    if (newToken) {
      localStorage.setItem("token", newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
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
      const isAuthCall =
        url.includes("/users/refresh") || url.includes("/users/login");

      if (
        status === 401 &&
        code === "TOKEN_EXPIRED" &&
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
        const newToken = await refreshing;
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return axios(original);
        }
        // Refresh failed — the session is genuinely over.
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }

      return Promise.reject(error);
    },
  );
}
