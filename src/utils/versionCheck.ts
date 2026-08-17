import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Compares two semantic version strings (e.g., "1.2.3" vs "1.2.4").
 * Returns:
 *  - negative number if v1 < v2
 *  - 0 if v1 === v2
 *  - positive number if v1 > v2
 */
export const compareVersions = (v1: string = "0.0.0", v2: string = "0.0.0"): number => {
  const cleanV1 = (v1 || "0.0.0").replace(/^v/i, "").trim();
  const cleanV2 = (v2 || "0.0.0").replace(/^v/i, "").trim();

  const parts1 = cleanV1.split(".").map((p) => parseInt(p, 10) || 0);
  const parts2 = cleanV2.split(".").map((p) => parseInt(p, 10) || 0);

  const length = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < length; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  return 0;
};

/**
 * Returns true if currentVersion is strictly less than targetVersion.
 */
export const isVersionLower = (currentVersion: string, targetVersion: string): boolean => {
  return compareVersions(currentVersion, targetVersion) < 0;
};

/**
 * Detects running platform: 'android', 'ios', or 'web'.
 */
export const getAppPlatform = (): "android" | "ios" | "web" => {
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return "web";
};

/**
 * Retrieves the currently installed native app version and build info.
 */
export const getInstalledAppInfo = async (): Promise<{
  version: string;
  build: string;
  name: string;
  platform: "android" | "ios" | "web";
}> => {
  const platform = getAppPlatform();
  try {
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      return {
        version: info.version || "1.0.0",
        build: info.build || "1",
        name: info.name || "Sanabel",
        platform,
      };
    }
  } catch (err) {
    console.warn("Could not retrieve native app info:", err);
  }

  // Fallback for web / development preview
  return {
    version: "1.0.0",
    build: "1",
    name: "Sanabel",
    platform,
  };
};

/**
 * Directs user to the appropriate store URL.
 */
export const openStoreUrl = (url: string, platform: "android" | "ios" | "web"): void => {
  if (url && url.trim()) {
    window.open(url, "_system");
    return;
  }

  // Fallback defaults
  if (platform === "android") {
    window.open("https://play.google.com/store/apps/details?id=com.wonderlearn.sanabel", "_system");
  } else if (platform === "ios") {
    if (url && url.trim()) {
      window.open(url, "_system");
    }
  } else {
    window.location.reload();
  }
};
