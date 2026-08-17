import { beforeEach, describe, expect, it, vi } from "vitest";

const hapticCalls = vi.hoisted(() => ({
  impacts: [] as any[],
  notifications: [] as any[],
  vibrations: [] as any[],
}));

vi.mock("@capacitor/haptics", () => ({
  Haptics: {
    impact: (opts: any) => {
      hapticCalls.impacts.push(opts);
      return Promise.resolve();
    },
    notification: (opts: any) => {
      hapticCalls.notifications.push(opts);
      return Promise.resolve();
    },
    vibrate: (opts: any) => {
      hapticCalls.vibrations.push(opts);
      return Promise.resolve();
    },
  },
  ImpactStyle: {
    Light: "LIGHT",
    Medium: "MEDIUM",
    Heavy: "HEAVY",
  },
  NotificationType: {
    Success: "SUCCESS",
    Warning: "WARNING",
    Error: "ERROR",
  },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));

import {
  HapticsManagerClass,
  VIBRATION_STORAGE_KEY,
} from "./HapticsManager";

describe("HapticsManager", () => {
  beforeEach(() => {
    localStorage.clear();
    hapticCalls.impacts = [];
    hapticCalls.notifications = [];
    hapticCalls.vibrations = [];
  });

  it("triggers native light impact when enabled", async () => {
    const manager = new HapticsManagerClass();
    await manager.impactLight();
    expect(hapticCalls.impacts).toHaveLength(1);
    expect(hapticCalls.impacts[0]).toEqual({ style: "LIGHT" });
  });

  it("triggers native medium impact", async () => {
    const manager = new HapticsManagerClass();
    await manager.impactMedium();
    expect(hapticCalls.impacts).toHaveLength(1);
    expect(hapticCalls.impacts[0]).toEqual({ style: "MEDIUM" });
  });

  it("triggers native heavy impact", async () => {
    const manager = new HapticsManagerClass();
    await manager.impactHeavy();
    expect(hapticCalls.impacts).toHaveLength(1);
    expect(hapticCalls.impacts[0]).toEqual({ style: "HEAVY" });
  });

  it("triggers success and error notifications", async () => {
    const manager = new HapticsManagerClass();
    await manager.notificationSuccess();
    expect(hapticCalls.notifications[0]).toEqual({ type: "SUCCESS" });

    await manager.notificationError();
    expect(hapticCalls.notifications[1]).toEqual({ type: "ERROR" });
  });

  it("persists user vibration preference and suppresses haptics when disabled", async () => {
    const manager = new HapticsManagerClass();
    manager.setVibrationEnabled(false);

    expect(manager.vibrationEnabled).toBe(false);
    expect(localStorage.getItem(VIBRATION_STORAGE_KEY)).toBe("false");

    await manager.impactLight();
    await manager.notificationSuccess();
    expect(hapticCalls.impacts).toHaveLength(0);
    expect(hapticCalls.notifications).toHaveLength(0);
  });
});
