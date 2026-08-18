import { beforeEach, describe, expect, it, vi } from "vitest";

const localNotificationMocks = vi.hoisted(() => ({
  channels: [] as any[],
  scheduled: [] as any[],
  permissionStatus: { display: "prompt" } as { display: string },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: () => Promise.resolve(localNotificationMocks.permissionStatus),
    requestPermissions: () => {
      localNotificationMocks.permissionStatus = { display: "granted" };
      return Promise.resolve(localNotificationMocks.permissionStatus);
    },
    createChannel: (channel: any) => {
      localNotificationMocks.channels.push(channel);
      return Promise.resolve();
    },
    schedule: (opts: any) => {
      localNotificationMocks.scheduled.push(opts);
      return Promise.resolve();
    },
  },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));

vi.mock("./prayerNotifications", () => ({
  PRAYER_ENABLED_KEY: "prayerNotifications",
  resyncPrayerNotificationsIfEnabled: vi.fn().mockResolvedValue(undefined),
  enablePrayerNotifications: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  initAppNotificationsOnStartup,
  requestAppNotificationPermissions,
  sendLocalAppNotification,
  setupNotificationChannels,
  APP_NOTIFICATIONS_ENABLED_KEY,
  NOTIFICATION_CHANNELS,
} from "./appNotificationManager";

describe("appNotificationManager", () => {
  beforeEach(() => {
    localStorage.clear();
    localNotificationMocks.channels = [];
    localNotificationMocks.scheduled = [];
    localNotificationMocks.permissionStatus = { display: "prompt" };
    vi.clearAllMocks();
  });

  it("creates Android notification channels", async () => {
    await setupNotificationChannels();
    expect(localNotificationMocks.channels.length).toBeGreaterThanOrEqual(3);
    const channelIds = localNotificationMocks.channels.map((c) => c.id);
    expect(channelIds).toContain(NOTIFICATION_CHANNELS.GENERAL);
    expect(channelIds).toContain(NOTIFICATION_CHANNELS.PRAYER);
    expect(channelIds).toContain(NOTIFICATION_CHANNELS.REMINDERS);
  });

  it("requests permissions and updates storage when granted", async () => {
    const granted = await requestAppNotificationPermissions();
    expect(granted).toBe(true);
    expect(localStorage.getItem(APP_NOTIFICATIONS_ENABLED_KEY)).toBe("true");
  });

  it("initializes notifications on startup for any user", async () => {
    await initAppNotificationsOnStartup();
    expect(localStorage.getItem(APP_NOTIFICATIONS_ENABLED_KEY)).toBe("true");
  });

  it("schedules a local notification with custom options", async () => {
    const success = await sendLocalAppNotification({
      title: "تنبيه جديد",
      body: "لقد أنجزت عملاً صالحاً اليوم!",
      channelId: NOTIFICATION_CHANNELS.GENERAL,
    });

    expect(success).toBe(true);
    expect(localNotificationMocks.scheduled).toHaveLength(1);
    expect(localNotificationMocks.scheduled[0].notifications[0].title).toBe("تنبيه جديد");
  });
});
