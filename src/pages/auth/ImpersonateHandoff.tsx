import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { localStore } from "../../utils/safeStorage";
import { useUserContext } from "../../context/StudentUserProvider";
import { IonSpinner } from "@ionic/react";

// A handoff code is single-use. React StrictMode (dev) runs effects twice, and
// a re-render with a new `refreshUserData` reruns this one, so every run for
// the same code shares one exchange request; a second POST would get 409
// CODE_ALREADY_USED and replace the successful sign-in with an error screen.
const exchanges = new Map<string, Promise<any>>();
const exchangeOnce = (code: string) => {
  let pending = exchanges.get(code);
  if (!pending) {
    pending = axios.post(`${API_BASE_URL}/users/impersonation/exchange`, { code });
    exchanges.set(code, pending);
  }
  return pending;
};

export const ImpersonateHandoff: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const { refreshUserData } = useUserContext();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      setError("No impersonation code provided.");
      return;
    }

    let isMounted = true;

    const exchangeCode = async () => {
      try {
        const response = await exchangeOnce(code.trim());

        const userData = response.data?.data?.user;
        if (!userData || !userData.token) {
          throw new Error("Invalid response from server");
        }

        localStore.setItem("token", userData.token);
        if (userData.refreshToken) {
          localStore.setItem("refreshToken", userData.refreshToken);
        }
        localStore.setItem("role", "Student");
        localStore.setItem("keepLoggedIn", "true");
        localStore.setItem("isImpersonated", "true");
        const studentName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Student";
        localStore.setItem("impersonatedStudentName", studentName);
        localStore.setItem("firstTimer", "false");

        window.dispatchEvent(new Event("storage"));

        // Clean up code from browser URL so it cannot be copied/shared/re-entered
        window.history.replaceState({}, document.title, window.location.pathname);

        await refreshUserData(userData.token);

        if (isMounted) {
          history.replace("/student/home");
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err.response?.data?.message ||
          "This impersonation link has expired or has already been used. Please generate a new link from the Admin Console.";
        setError(msg);
      }
    };

    exchangeCode();

    return () => {
      isMounted = false;
    };
  }, [location.search, history, refreshUserData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Impersonation Failed</h2>
        <p className="text-sm text-gray-600 max-w-sm mb-6">{error}</p>
        <button
          onClick={() => {
            if (window.opener && !window.opener.closed) {
              window.close();
            } else {
              history.replace("/login");
            }
          }}
          className="px-5 py-2.5 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          {window.opener ? "Close Window" : "Go to Login"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <IonSpinner name="crescent" className="w-10 h-10 text-emerald-600 mb-4" />
      <h2 className="text-lg font-semibold text-gray-800">Signing in as Student...</h2>
      <p className="text-xs text-gray-500 mt-1">Establishing secure session</p>
    </div>
  );
};

export default ImpersonateHandoff;
