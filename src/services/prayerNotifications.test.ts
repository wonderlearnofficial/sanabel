import { describe, expect, it } from "vitest";
import { buildPrayerSchedule, EGYPT_CITIES } from "./prayerNotifications";

// Alexandria, Egypt
const LAT = 31.2001;
const LNG = 29.9187;

describe("buildPrayerSchedule", () => {
  it("schedules 5 prayers per day for the requested window", () => {
    const startOfDay = new Date(2026, 7, 17, 0, 0, 0);
    const schedule = buildPrayerSchedule(LAT, LNG, startOfDay, 7);

    expect(schedule).toHaveLength(35);
    const arabicNames = new Set(schedule.map((p) => p.arabicName));
    expect(arabicNames).toEqual(
      new Set(["الفجر", "الظهر", "العصر", "المغرب", "العشاء"]),
    );
  });

  it("keeps prayer order within a day (fajr → isha)", () => {
    const startOfDay = new Date(2026, 7, 17, 0, 0, 0);
    const day = buildPrayerSchedule(LAT, LNG, startOfDay, 1);

    expect(day.map((p) => p.name)).toEqual([
      "fajr",
      "dhuhr",
      "asr",
      "maghrib",
      "isha",
    ]);
    for (let i = 1; i < day.length; i++) {
      expect(day[i].time.getTime()).toBeGreaterThan(day[i - 1].time.getTime());
    }
  });

  it("skips prayers that are already in the past", () => {
    const lateEvening = new Date(2026, 7, 17, 23, 59, 0);
    const schedule = buildPrayerSchedule(LAT, LNG, lateEvening, 2);

    // Day 1 is (almost) fully in the past; every scheduled time is in the future
    expect(schedule.length).toBeLessThan(10);
    schedule.forEach((p) =>
      expect(p.time.getTime()).toBeGreaterThan(lateEvening.getTime()),
    );
  });

  it("works with every fallback city in the list", () => {
    const startOfDay = new Date(2026, 7, 17, 0, 0, 0);
    const keys = new Set(EGYPT_CITIES.map((c) => c.key));
    expect(keys.size).toBe(EGYPT_CITIES.length);

    EGYPT_CITIES.forEach((city) => {
      // All cities are inside Egypt's bounding box
      expect(city.latitude).toBeGreaterThan(22);
      expect(city.latitude).toBeLessThan(32);
      expect(city.longitude).toBeGreaterThan(24);
      expect(city.longitude).toBeLessThan(37);

      const day = buildPrayerSchedule(city.latitude, city.longitude, startOfDay, 1);
      expect(day).toHaveLength(5);
    });
  });

  it("assigns unique deterministic notification ids", () => {
    const startOfDay = new Date(2026, 7, 17, 0, 0, 0);
    const first = buildPrayerSchedule(LAT, LNG, startOfDay, 7);
    const second = buildPrayerSchedule(LAT, LNG, startOfDay, 7);

    expect(new Set(first.map((p) => p.id)).size).toBe(first.length);
    expect(first.map((p) => p.id)).toEqual(second.map((p) => p.id));
    first.forEach((p) => expect(p.id).toBeGreaterThanOrEqual(510000));
  });

  it("finds the nearest city correctly", async () => {
    const { findNearestCity } = await import("./prayerNotifications");
    // Near Cairo coordinates (30.05, 31.24)
    const cairoMatch = findNearestCity(30.05, 31.24);
    expect(cairoMatch.key).toBe("cairo");

    // Near Alexandria coordinates (31.21, 29.92)
    const alexMatch = findNearestCity(31.21, 29.92);
    expect(alexMatch.key).toBe("alexandria");

    // Near Aswan coordinates (24.1, 32.9)
    const aswanMatch = findNearestCity(24.1, 32.9);
    expect(aswanMatch.key).toBe("aswan");
  });
});
