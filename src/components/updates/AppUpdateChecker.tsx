import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { API_BASE_URL } from "../../config/api";
import {
  getInstalledAppInfo,
  isVersionLower,
  openStoreUrl,
} from "../../utils/versionCheck";
import { UpdatePromptModal } from "./UpdatePromptModal";
import { ForceUpdateScreen } from "./ForceUpdateScreen";
import { MaintenanceScreen } from "./MaintenanceScreen";
import i18n from "../../i18n";
import { sessionStore } from "../../utils/safeStorage";
import { resyncPrayerNotificationsIfEnabled } from "../../services/prayerNotifications";

interface VersionResponse {
  success: boolean;
  platform: "android" | "ios" | "web";
  latestVersion: string;
  minRequiredVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  releaseNotes: {
    ar: string;
    en: string;
  };
  maintenanceMode: boolean;
}

export const AppUpdateChecker: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [softUpdate, setSoftUpdate] = useState(false);

  const [platform, setPlatform] = useState<"android" | "ios" | "web">("web");
  const [latestVersion, setLatestVersion] = useState("1.0.0");
  const [minRequiredVersion, setMinRequiredVersion] = useState("1.0.0");
  const [storeUrl, setStoreUrl] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  const checkVersion = useCallback(async () => {
    // Completely bypass update checks on web / Vercel testing deployments
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      setLoading(true);
      const appInfo = await getInstalledAppInfo();
      setPlatform(appInfo.platform);

      const res = await axios.get<VersionResponse>(
        `${API_BASE_URL}/app/version?platform=${appInfo.platform}`
      );

      if (!res.data || !res.data.success) {
        setLoading(false);
        return;
      }

      const {
        latestVersion: remoteLatest,
        minRequiredVersion: remoteMin,
        forceUpdate: remoteForce,
        storeUrl: remoteStore,
        releaseNotes: remoteNotes,
        maintenanceMode: remoteMaintenance,
      } = res.data;

      setLatestVersion(remoteLatest || "1.0.0");
      setMinRequiredVersion(remoteMin || "1.0.0");
      setStoreUrl(remoteStore || "");

      const lang = i18n.language === "ar" ? "ar" : "en";
      setReleaseNotes(remoteNotes?.[lang] || remoteNotes?.ar || "");

      // 1. Check Maintenance Mode
      if (remoteMaintenance) {
        setMaintenance(true);
        setForceUpdate(false);
        setSoftUpdate(false);
        return;
      } else {
        setMaintenance(false);
      }

      // 2. Check Force Update
      const installedVer = appInfo.version;
      const isBelowMin = isVersionLower(installedVer, remoteMin);
      const isForced = remoteForce && isVersionLower(installedVer, remoteLatest);

      if (isBelowMin || isForced) {
        setForceUpdate(true);
        setSoftUpdate(false);
        return;
      } else {
        setForceUpdate(false);
      }

      // 3. Check Soft Update (if not already dismissed in this session)
      const hasNewer = isVersionLower(installedVer, remoteLatest);
      const sessionDismissed = sessionStore.getItem(`update_dismissed_${remoteLatest}`);

      if (hasNewer && !sessionDismissed) {
        setSoftUpdate(true);
      } else {
        setSoftUpdate(false);
      }
    } catch (error) {
      console.warn("Version check skipped or failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkVersion();

    // Listen for native app foreground/resume events
    let handler: PluginListenerHandle | undefined;
    let disposed = false;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener("appStateChange", (state) => {
        if (state.isActive) {
          void checkVersion();
          void resyncPrayerNotificationsIfEnabled();
        }
      }).then((h) => {
        if (disposed) void h.remove();
        else handler = h;
      }).catch((error) => console.warn("Native lifecycle listener unavailable", error));
    }

    return () => {
      disposed = true;
      if (handler) void handler.remove();
    };
  }, [checkVersion]);

  const handleUpdate = () => {
    openStoreUrl(storeUrl, platform);
  };

  const handleDismissSoftUpdate = () => {
    sessionStore.setItem(`update_dismissed_${latestVersion}`, "true");
    setSoftUpdate(false);
  };

  // Completely inactive on Web / Vercel
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  if (maintenance) {
    return <MaintenanceScreen onRetry={checkVersion} />;
  }

  if (forceUpdate) {
    return (
      <ForceUpdateScreen
        latestVersion={latestVersion}
        minRequiredVersion={minRequiredVersion}
        releaseNotes={releaseNotes}
        platform={platform}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <UpdatePromptModal
      open={softUpdate}
      latestVersion={latestVersion}
      releaseNotes={releaseNotes}
      onUpdate={handleUpdate}
      onDismiss={handleDismissSoftUpdate}
    />
  );
};
