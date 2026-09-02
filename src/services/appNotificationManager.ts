import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  resyncPrayerNotificationsIfEnabled,
  enablePrayerNotifications,
  PRAYER_ENABLED_KEY,
} from "./prayerNotifications";
import { localStore } from "../utils/safeStorage";

export const APP_NOTIFICATIONS_ENABLED_KEY = "sanabel:app_notifications_enabled";
export const NOTIFICATIONS_REQUESTED_KEY = "sanabel:notifications_prompted";

export const NOTIFICATION_CHANNELS = {
  GENERAL: "sanabel-general",
  PRAYER: "prayer-times",
  REMINDERS: "sanabel-reminders",
};

/**
 * Initializes notification channels on Android.
 */
export const setupNotificationChannels = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return;
  }

  try {
    // 1. General Sanabel Notifications Channel
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNELS.GENERAL,
      name: "تنبيهات سنابل العامة / General Sanabel",
      description: "إشعارات الإنجازات والجوائز والأوسمة في سنابل الإحسان",
      importance: 5,
      visibility: 1,
      sound: "beep.wav",
      vibration: true,
      lights: true,
    });

    // 2. Prayer Times Channel
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNELS.PRAYER,
      name: "مواقيت وتنبيهات الصلاة / Prayer Times",
      description: "تنبيهات مواعيد الصلاة الخمس يوميًا",
      importance: 5,
      visibility: 1,
      sound: "beep.wav",
      vibration: true,
      lights: true,
    });

    // 3. Daily Reminders & Challenges Channel
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNELS.REMINDERS,
      name: "التذكيرات والمهام اليومية / Daily Reminders",
      description: "تذكير يومي لغرس بذور الخير والمهام الإيجابية",
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch (error) {
    console.warn("Failed to create notification channels:", error);
  }
};

/**
 * Prompts user for notification permissions across Native (Android/iOS) and Web.
 */
export const requestAppNotificationPermissions = async (): Promise<boolean> => {
  try {
    localStore.setItem(NOTIFICATIONS_REQUESTED_KEY, "true");

    if (Capacitor.isNativePlatform()) {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === "granted") {
        localStore.setItem(APP_NOTIFICATIONS_ENABLED_KEY, "true");
        await setupNotificationChannels();
        return true;
      }

      const requested = await LocalNotifications.requestPermissions();
      const granted = requested.display === "granted";
      if (granted) {
        localStore.setItem(APP_NOTIFICATIONS_ENABLED_KEY, "true");
        await setupNotificationChannels();
      }
      return granted;
    }

    // Web Browser Notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        localStore.setItem(APP_NOTIFICATIONS_ENABLED_KEY, "true");
        return true;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        const granted = permission === "granted";
        if (granted) {
          localStore.setItem(APP_NOTIFICATIONS_ENABLED_KEY, "true");
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {});
          }
        }
        return granted;
      }
    }

    return false;
  } catch (error) {
    console.warn("Error requesting notification permissions:", error);
    return false;
  }
};

/**
 * Entry point called automatically once the application starts. It must not
 * trigger a permission prompt: iOS browsers require notification permission
 * to be requested from a direct user gesture. The onboarding modal/settings
 * call requestAppNotificationPermissions after the user taps Enable.
 */
export const initAppNotificationsOnStartup = async (): Promise<void> => {
  try {
    let isGranted = false;
    if (Capacitor.isNativePlatform()) {
      const current = await LocalNotifications.checkPermissions();
      isGranted = current.display === "granted";
      if (isGranted) await setupNotificationChannels();
    } else if (typeof window !== "undefined" && "Notification" in window) {
      isGranted = Notification.permission === "granted";
    }

    if (isGranted) {
      localStore.setItem(APP_NOTIFICATIONS_ENABLED_KEY, "true");
      // If prayer notifications haven't been explicitly disabled by the user,
      // auto-enable or resync them for the 7-day rolling window
      const prayerPref = localStore.getItem(PRAYER_ENABLED_KEY);
      if (prayerPref === null || prayerPref === "true") {
        localStore.setItem(PRAYER_ENABLED_KEY, "true");
        if (Capacitor.isNativePlatform()) {
          await resyncPrayerNotificationsIfEnabled();
        }
      }
    }
  } catch (error) {
    console.error("Failed to initialize app notifications on startup:", error);
  }
};

/**
 * Sends or schedules a unified local notification.
 */
export const sendLocalAppNotification = async (options: {
  id?: number;
  title: string;
  body: string;
  scheduleAt?: Date;
  channelId?: string;
}): Promise<boolean> => {
  try {
    const id = options.id || Math.floor(Math.random() * 1000000) + 1;
    const channelId = options.channelId || NOTIFICATION_CHANNELS.GENERAL;

    if (Capacitor.isNativePlatform()) {
      await setupNotificationChannels();
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: options.title,
            body: options.body,
            schedule: options.scheduleAt ? { at: options.scheduleAt, allowWhileIdle: true } : undefined,
            channelId,
            smallIcon: "ic_launcher",
            largeIcon: "ic_launcher",
            iconColor: "#22c55e",
          },
        ],
      });
      return true;
    }

    // Web Fallback
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          registration.showNotification(options.title, {
            body: options.body,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            dir: "rtl",
          });
          return true;
        }
      }
      new Notification(options.title, {
        body: options.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        dir: "rtl",
      });
      return true;
    }

    return false;
  } catch (error) {
    console.warn("Failed to send local notification:", error);
    return false;
  }
};
