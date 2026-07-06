import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Best-effort server-side session invalidation (rotates the user's tokenVersion
// so all refresh tokens stop working), then clears all client auth state. Safe
// to call even when offline — local state is cleared regardless.
export async function logoutSession(): Promise<void> {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      await axios.post(
        `${API_BASE_URL}/users/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      // ignore — clearing local state is what matters for the user
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.setItem("keepLoggedIn", "false");
}
