import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export const VIBRATION_STORAGE_KEY = "sanabel:vibration-effects";

export class HapticsManagerClass {
  private _vibrationEnabled: boolean;

  constructor() {
    this._vibrationEnabled = this.readPreference();
  }

  private readPreference(): boolean {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(VIBRATION_STORAGE_KEY) !== "false";
    } catch {
      return true;
    }
  }

  private savePreference(enabled: boolean) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(VIBRATION_STORAGE_KEY, String(enabled));
    } catch {
      // Storage unavailable fallback
    }
  }

  public get vibrationEnabled(): boolean {
    return this._vibrationEnabled;
  }

  public setVibrationEnabled(enabled: boolean) {
    this._vibrationEnabled = enabled;
    this.savePreference(enabled);
  }

  /**
   * Light impact - subtle tactile click on UI taps, tab switching, and navigation buttons.
   */
  public async impactLight(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(15);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }

  /**
   * Medium impact - interactive actions like watering a tree, confirming inputs.
   */
  public async impactMedium(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(30);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }

  /**
   * Heavy impact - leveling up, stage advancement, significant milestones.
   */
  public async impactHeavy(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(50);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }

  /**
   * Success notification - completing a good deed, prayer logged, points earned.
   */
  public async notificationSuccess(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([25, 40, 35]);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }

  /**
   * Error notification - failed submission, insufficient balance, wrong password.
   */
  public async notificationError(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([40, 50, 40]);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }

  /**
   * Warning notification.
   */
  public async notificationWarning(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([30, 40, 30]);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }

  /**
   * Celebratory pattern - unlocks, rewards, level ups, special achievements.
   */
  public async celebration(): Promise<void> {
    if (!this._vibrationEnabled) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
        setTimeout(async () => {
          try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          } catch {}
        }, 120);
      } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([40, 50, 40, 50, 80]);
      }
    } catch {
      // Ignore unsupported platforms silently
    }
  }
}

export const HapticsManager = new HapticsManagerClass();
