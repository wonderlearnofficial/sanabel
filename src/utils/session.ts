import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { localStore } from "./safeStorage";
import { clearAllGuideProgress } from "../guides/v2/progressStore";

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
  // The impersonation markers describe the session that is ending. Leaving them
  // behind makes the next real sign-in on this device look impersonated, which
  // now suppresses that user's guides and their seen-state writes.
  localStore.removeItem("isImpersonated");
  localStore.removeItem("impersonatedStudentName");
  // Ephemeral tutorial position only. Durable guide state lives on the server
  // (`Users.seenGuides`) and is deliberately left alone: signing out is not
  // forgetting what the learner was taught.
  clearAllGuideProgress();
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
