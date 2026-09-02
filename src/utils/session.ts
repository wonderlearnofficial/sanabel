import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { localStore } from "./safeStorage";

export function clearClientSession(): void {
  localStore.removeItem("token");
  localStore.removeItem("refreshToken");
  localStore.removeItem("role");
  // An impersonated Student session may retain a saved Admin token. Security
  // invalidation must clear both identities so the stale Admin token cannot be
  // restored from the banner after a role/password/account change.
  localStore.removeItem("adminReturnToken");
  localStore.removeItem("adminReturnRole");
  localStore.removeItem("adminReturnEmail");
  localStore.removeItem("adminImpersonatedStudentName");
  localStore.setItem("keepLoggedIn", "false");
}

// Best-effort server-side session invalidation (rotates the user's tokenVersion
// so all refresh tokens stop working), then clears all client auth state. Safe
// to call even when offline — local state is cleared regardless.
export async function logoutSession(): Promise<void> {
  const token = localStore.getItem("token");
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
  clearClientSession();
}
