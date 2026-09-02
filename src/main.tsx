import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setupAxiosAuth } from "./config/axiosSetup";
import {
  resyncPrayerNotificationsIfEnabled,
  sendTestPrayerNotification,
} from "./services/prayerNotifications";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

// Install the global access-token refresh interceptor before anything renders.
setupAxiosAuth();

// Roll the native prayer-notification window forward on every app start
// (no-op on web and when the feature is off).
void resyncPrayerNotificationsIfEnabled().catch((error) => {
  console.warn("Prayer notification startup resync failed", error);
});

// Testing-phase helper: run sanabelTestPrayerNotification() in the console to
// receive a sample prayer notification after ~10 seconds.
declare global {
  interface Window {
    sanabelTestPrayerNotification?: typeof sendTestPrayerNotification;
  }
}
window.sanabelTestPrayerNotification = sendTestPrayerNotification;

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
