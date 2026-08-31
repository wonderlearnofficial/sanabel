import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wonderlearn.sanabel",
  appName: "Sanabel Al Ehsan",
  webDir: "dist",
  backgroundColor: "#ffffff",
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "never",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#22c55e",
    },
  },
};

export default config;
