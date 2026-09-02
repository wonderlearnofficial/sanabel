// Prayer-time notifications, unified across platforms:
//
// - Android/iOS (Capacitor): prayer times are computed ON the device with
//   `adhan` and scheduled as local notifications for the next 7 days. No
//   server involved; survives offline. Re-synced on every app start so the
//   7-day window keeps rolling forward.
// - Web browser: the existing server flow — a web-push subscription plus the
//   user's location are stored on the server, which schedules pushes at each
//   prayer time (works even with the tab closed, as long as the browser
//   supports push; requires the user to be logged in).
//
// Calculation method is MuslimWorldLeague on BOTH sides — keep in sync with
// server/src/services/prayerTimeService.ts.

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { localStore } from "../utils/safeStorage";

export const PRAYER_ENABLED_KEY = "prayerNotifications";
const COORDS_KEY = "prayerNotificationsCoords";

// Deterministic local-notification ids reserved for prayers:
// 510000 + dayIndex * 10 + prayerIndex  (well clear of other notifications)
const PRAYER_ID_BASE = 510000;
const DAYS_TO_SCHEDULE = 7;
const ANDROID_CHANNEL_ID = "prayer-times";
const NATIVE_RESYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastNativeResyncAt = 0;

export interface ScheduledPrayer {
  id: number;
  name: string;
  arabicName: string;
  time: Date;
}

const PRAYERS = [
  { key: "fajr", arabicName: "الفجر" },
  { key: "dhuhr", arabicName: "الظهر" },
  { key: "asr", arabicName: "العصر" },
  { key: "maghrib", arabicName: "المغرب" },
  { key: "isha", arabicName: "العشاء" },
] as const;

export type EnableResult =
  | { ok: true; city?: PrayerCity; coords?: Coords }
  // needsCity: automatic location failed/denied — the UI should offer the
  // EGYPT_CITIES list and retry with the chosen city.
  | { ok: false; message: string; needsCity?: boolean };

type Coords = { latitude: number; longitude: number };

export interface PrayerCity extends Coords {
  key: string;
  arabicName: string;
  englishName: string;
}

type IOSNavigator = Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">;

export const isIOSLikeDevice = (nav: IOSNavigator): boolean =>
  /iPad|iPhone|iPod/i.test(nav.userAgent) ||
  (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);

// Fallback when device location is denied or unavailable. GPS is always
// preferred — prayer times from exact coordinates beat any city preset.
export const EGYPT_CITIES: PrayerCity[] = [
  { key: "cairo", arabicName: "القاهرة", englishName: "Cairo", latitude: 30.0444, longitude: 31.2357 },
  { key: "alexandria", arabicName: "الإسكندرية", englishName: "Alexandria", latitude: 31.2001, longitude: 29.9187 },
  { key: "giza", arabicName: "الجيزة", englishName: "Giza", latitude: 30.0131, longitude: 31.2089 },
  { key: "mansoura", arabicName: "المنصورة", englishName: "Mansoura", latitude: 31.0409, longitude: 31.3785 },
  { key: "tanta", arabicName: "طنطا", englishName: "Tanta", latitude: 30.7865, longitude: 31.0004 },
  { key: "portsaid", arabicName: "بورسعيد", englishName: "Port Said", latitude: 31.2653, longitude: 32.3019 },
  { key: "suez", arabicName: "السويس", englishName: "Suez", latitude: 29.9668, longitude: 32.5498 },
  { key: "asyut", arabicName: "أسيوط", englishName: "Asyut", latitude: 27.1809, longitude: 31.1837 },
  { key: "luxor", arabicName: "الأقصر", englishName: "Luxor", latitude: 25.6872, longitude: 32.6396 },
  { key: "aswan", arabicName: "أسوان", englishName: "Aswan", latitude: 24.0889, longitude: 32.8998 },
];

export const findNearestCity = (lat: number, lng: number): PrayerCity => {
  let closest = EGYPT_CITIES[0];
  let minDistance = Infinity;
  for (const city of EGYPT_CITIES) {
    const d = Math.hypot(city.latitude - lat, city.longitude - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return closest;
};

const LOCATION_FALLBACK_MESSAGE =
  "لم نتمكن من تحديد موقعك تلقائيًا. اختر أقرب مدينة لك.";

// ---------------------------------------------------------------------------
// Pure schedule builder (unit-tested; no platform APIs)
// ---------------------------------------------------------------------------

export const buildPrayerSchedule = (
  latitude: number,
  longitude: number,
  startDate: Date,
  days: number = DAYS_TO_SCHEDULE,
): ScheduledPrayer[] => {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  const schedule: ScheduledPrayer[] = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    PRAYERS.forEach((prayer, prayerIndex) => {
      const time = prayerTimes[prayer.key];
      // Skip prayers already in the past (relevant for today only)
      if (time > startDate) {
        schedule.push({
          id: PRAYER_ID_BASE + dayIndex * 10 + prayerIndex,
          name: prayer.key,
          arabicName: prayer.arabicName,
          time,
        });
      }
    });
  }

  return schedule;
};

// ---------------------------------------------------------------------------
// Native (Android / iOS): on-device local notifications
// ---------------------------------------------------------------------------

const cancelNativePrayerNotifications = async () => {
  const pending = await LocalNotifications.getPending();
  const prayerIds = pending.notifications
    .filter((n) => n.id >= PRAYER_ID_BASE && n.id < PRAYER_ID_BASE + 1000)
    .map((n) => ({ id: n.id }));
  if (prayerIds.length > 0) {
    await LocalNotifications.cancel({ notifications: prayerIds });
  }
};

const scheduleNativePrayerNotifications = async (
  latitude: number,
  longitude: number,
): Promise<number> => {
  if (Capacitor.getPlatform() === "android") {
    await LocalNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: "إشعارات الصلاة",
      description: "تنبيهات أوقات الصلاة",
      importance: 4,
      visibility: 1,
    }).catch(() => {});
  }

  await cancelNativePrayerNotifications();

  const schedule = buildPrayerSchedule(latitude, longitude, new Date());
  if (schedule.length === 0) return 0;

  await LocalNotifications.schedule({
    notifications: schedule.map((prayer) => ({
      id: prayer.id,
      title: `حان وقت صلاة ${prayer.arabicName}`,
      body: "لا تنس ذكر الله وإقامة الصلاة في وقتها.",
      schedule: { at: prayer.time, allowWhileIdle: true },
      channelId: ANDROID_CHANNEL_ID,
      smallIcon: "ic_launcher",
      largeIcon: "ic_launcher",
      iconColor: "#22c55e",
    })),
  });

  return schedule.length;
};

const enableNative = async (coords?: Coords): Promise<EnableResult> => {
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted") {
    return {
      ok: false,
      message: "يجب الموافقة على الإشعارات لتفعيل هذه الخاصية.",
    };
  }

  let resolved = coords;
  if (!resolved) {
    try {
      await Geolocation.requestPermissions().catch(() => {});
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 15000,
      });
      resolved = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return { ok: false, needsCity: true, message: LOCATION_FALLBACK_MESSAGE };
    }
  }

  await scheduleNativePrayerNotifications(resolved.latitude, resolved.longitude);

  const nearestCity = findNearestCity(resolved.latitude, resolved.longitude);
  localStore.setItem(COORDS_KEY, JSON.stringify(resolved));
  localStore.setItem("userCity", nearestCity.arabicName);
  localStore.setItem("userLocation", JSON.stringify({
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    cityName: nearestCity.arabicName,
    cityKey: nearestCity.key,
  }));
  localStore.setItem(PRAYER_ENABLED_KEY, "true");
  return { ok: true, city: nearestCity, coords: resolved };
};

// ---------------------------------------------------------------------------
// Web: server-scheduled web push
// ---------------------------------------------------------------------------

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const getWebPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
    });
  });

const enableWeb = async (coords?: Coords): Promise<EnableResult> => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    const isIOS = isIOSLikeDevice(navigator);
    return {
      ok: false,
      message: isIOS
        ? "على iPhone، أضف سنابل إلى الشاشة الرئيسية أولاً ثم افتحه من هناك لتفعيل الإشعارات."
        : "متصفحك لا يدعم الإشعارات.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      message: "يجب الموافقة على الإشعارات لتفعيل هذه الخاصية.",
    };
  }

  let resolved = coords;
  if (!resolved) {
    try {
      const position = await getWebPosition();
      resolved = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return { ok: false, needsCity: true, message: LOCATION_FALLBACK_MESSAGE };
    }
  }

  const nearestCity = findNearestCity(resolved.latitude, resolved.longitude);
  localStore.setItem(COORDS_KEY, JSON.stringify(resolved));
  localStore.setItem("userCity", nearestCity.arabicName);
  localStore.setItem("userLocation", JSON.stringify({
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    cityName: nearestCity.arabicName,
    cityKey: nearestCity.key,
  }));
  localStore.setItem(PRAYER_ENABLED_KEY, "true");

  try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const token = localStore.getItem("token");
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

      if (token && vapidKey && "PushManager" in window) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });

        await axios.post(
          `${API_BASE_URL}/users/subscribe-push`,
          {
            subscription,
            location: resolved,
          },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 },
        ).catch(() => {});
      }
  } catch (error) {
    console.warn("Web push subscription attempt error:", error);
    return { ok: false, message: "تعذر تفعيل الإشعارات على هذا الجهاز." };
  }

  return { ok: true, city: nearestCity, coords: resolved };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Pass a `city` from EGYPT_CITIES to skip device geolocation (the UI does
// this after a needsCity result). Without it, the device's own location is
// used — more accurate than any city preset.
export const enablePrayerNotifications = async (
  city?: PrayerCity,
): Promise<EnableResult> => {
  const coords = city
    ? { latitude: city.latitude, longitude: city.longitude }
    : undefined;
  try {
    return Capacitor.isNativePlatform()
      ? await enableNative(coords)
      : await enableWeb(coords);
  } catch (error) {
    console.error("Enable prayer notifications error:", error);
    return { ok: false, message: "حدث خطأ أثناء تفعيل الإشعارات." };
  }
};

export const disablePrayerNotifications = async (): Promise<void> => {
  localStore.setItem(PRAYER_ENABLED_KEY, "false");
  localStore.removeItem(COORDS_KEY);

  try {
    if (Capacitor.isNativePlatform()) {
      await cancelNativePrayerNotifications();
    } else {
      const registration = await navigator.serviceWorker?.getRegistration("/sw.js");
      const subscription = await registration?.pushManager?.getSubscription();
      await subscription?.unsubscribe();

      const token = localStore.getItem("token");
      if (token) {
        await axios.post(
          `${API_BASE_URL}/users/unsubscribe-push`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 },
        );
      }
    }
  } catch (error) {
    // Disabling must never trap the user in the ON state
    console.error("Disable prayer notifications error:", error);
  }
};

// Fires a sample prayer notification ~10 seconds from now, so the whole
// chain (permission → channel → display) can be verified without waiting
// for a real prayer time. Exposed on window as sanabelTestPrayerNotification
// for the testing phase — run it from the browser/WebView console.
export const sendTestPrayerNotification = async (): Promise<EnableResult> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== "granted") {
        return {
          ok: false,
          message: "يجب الموافقة على الإشعارات لتفعيل هذه الخاصية.",
        };
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: PRAYER_ID_BASE + 999,
            title: "حان وقت صلاة الظهر (تجربة)",
            body: "هذا إشعار تجريبي للتأكد من عمل تنبيهات الصلاة.",
            schedule: { at: new Date(Date.now() + 10_000), allowWhileIdle: true },
            channelId: ANDROID_CHANNEL_ID,
            smallIcon: "ic_launcher",
            largeIcon: "ic_launcher",
            iconColor: "#22c55e",
          },
        ],
      });
      return { ok: true };
    }

    if (!("serviceWorker" in navigator)) {
      return { ok: false, message: "متصفحك لا يدعم الإشعارات." };
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        message: "يجب الموافقة على الإشعارات لتفعيل هذه الخاصية.",
      };
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    setTimeout(() => {
      registration.showNotification("حان وقت صلاة الظهر (تجربة)", {
        body: "هذا إشعار تجريبي للتأكد من عمل تنبيهات الصلاة.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        dir: "rtl",
      });
    }, 10_000);
    return { ok: true };
  } catch (error) {
    console.error("Test prayer notification error:", error);
    return { ok: false, message: "حدث خطأ أثناء تفعيل الإشعارات." };
  }
};

// Called once on app startup. On native platforms this rolls the 7-day
// scheduling window forward using the last known coordinates (refreshing
// them silently when location permission is still granted).
export const resyncPrayerNotificationsIfEnabled = async (): Promise<void> => {
  if (localStore.getItem(PRAYER_ENABLED_KEY) !== "true") return;
  if (!Capacitor.isNativePlatform()) return; // web is server-scheduled
  const now = Date.now();
  if (now - lastNativeResyncAt < NATIVE_RESYNC_INTERVAL_MS) return;

  try {
    let coords: { latitude: number; longitude: number } | null = null;
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });
      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      localStore.setItem(COORDS_KEY, JSON.stringify(coords));
    } catch {
      coords = localStore.getJson<Coords | null>(
        COORDS_KEY,
        null,
        (value): value is Coords => {
          if (typeof value !== "object" || value === null) return false;
          const candidate = value as Partial<Coords>;
          return Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude);
        },
      );
    }

    if (coords) {
      await scheduleNativePrayerNotifications(coords.latitude, coords.longitude);
      lastNativeResyncAt = now;
    }
  } catch (error) {
    console.error("Prayer notifications resync error:", error);
  }
};
