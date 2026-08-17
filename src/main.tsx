import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setupAxiosAuth } from "./config/axiosSetup";
import {
  resyncPrayerNotificationsIfEnabled,
  sendTestPrayerNotification,
} from "./services/prayerNotifications";

// Install the global access-token refresh interceptor before anything renders.
setupAxiosAuth();

// Roll the native prayer-notification window forward on every app start
// (no-op on web and when the feature is off).
resyncPrayerNotificationsIfEnabled();

// Testing-phase helper: run sanabelTestPrayerNotification() in the console to
// receive a sample prayer notification after ~10 seconds.
(window as any).sanabelTestPrayerNotification = sendTestPrayerNotification;

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
