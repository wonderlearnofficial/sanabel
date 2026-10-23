import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  locationState: { location: "prompt", coarseLocation: "prompt" } as Record<string, string>,
  requestResult: { location: "denied", coarseLocation: "denied" } as Record<string, string>,
  requestPermissions: vi.fn(),
  getCurrentPosition: vi.fn(),
  schedule: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
}));

vi.mock("@capacitor/geolocation", () => ({
  Geolocation: {
    checkPermissions: () => Promise.resolve(mocks.locationState),
    requestPermissions: (...args: unknown[]) => {
      mocks.requestPermissions(...args);
      return Promise.resolve(mocks.requestResult);
    },
    getCurrentPosition: (...args: unknown[]) => {
      mocks.getCurrentPosition(...args);
      return Promise.resolve({ coords: { latitude: 30.0444, longitude: 31.2357 } });
    },
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: () => Promise.resolve({ display: "granted" }),
    createChannel: () => Promise.resolve(),
    getPending: () => Promise.resolve({ notifications: [] }),
    cancel: () => Promise.resolve(),
    schedule: (...args: unknown[]) => {
      mocks.schedule(...args);
      return Promise.resolve();
    },
  },
}));

import {
  LOCATION_DENIED_KEY,
  PRAYER_ENABLED_KEY,
  enablePrayerNotifications,
  resyncPrayerNotificationsIfEnabled,
} from "./prayerNotifications";

describe("prayer notification location permission", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.locationState = { location: "prompt", coarseLocation: "prompt" };
    mocks.requestResult = { location: "denied", coarseLocation: "denied" };
  });

  it("never prompts for location during the background resync", async () => {
    localStorage.setItem(PRAYER_ENABLED_KEY, "true");
    localStorage.setItem(
      "prayerNotificationsCoords",
      JSON.stringify({ latitude: 30.0444, longitude: 31.2357 }),
    );

    await resyncPrayerNotificationsIfEnabled();

    expect(mocks.requestPermissions).not.toHaveBeenCalled();
    expect(mocks.getCurrentPosition).not.toHaveBeenCalled();
    // The stored coordinates still keep the schedule rolling.
    expect(mocks.schedule).toHaveBeenCalledTimes(1);
  });

  it("records a denial from the explicit request and offers a city instead", async () => {
    const result = await enablePrayerNotifications();

    expect(mocks.requestPermissions).toHaveBeenCalledTimes(1);
    expect(mocks.getCurrentPosition).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, needsCity: true });
    expect(localStorage.getItem(LOCATION_DENIED_KEY)).toBe("true");
  });

  it("clears the stored denial once permission is granted", async () => {
    localStorage.setItem(LOCATION_DENIED_KEY, "true");
    mocks.requestResult = { location: "granted", coarseLocation: "granted" };

    const result = await enablePrayerNotifications();

    expect(result.ok).toBe(true);
    expect(localStorage.getItem(LOCATION_DENIED_KEY)).toBeNull();
  });
});
