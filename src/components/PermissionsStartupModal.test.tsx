import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PermissionsStartupModal, {
  PERMISSIONS_ONBOARDING_KEY,
} from "./PermissionsStartupModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ar" },
  }),
}));

vi.mock("../services/prayerNotifications", () => ({
  enablePrayerNotifications: vi.fn().mockResolvedValue({
    ok: true,
    city: {
      key: "cairo",
      arabicName: "القاهرة",
      englishName: "Cairo",
      latitude: 30.0444,
      longitude: 31.2357,
    },
  }),
  EGYPT_CITIES: [
    { key: "cairo", arabicName: "القاهرة", englishName: "Cairo", latitude: 30.0444, longitude: 31.2357 },
    { key: "alexandria", arabicName: "الإسكندرية", englishName: "Alexandria", latitude: 31.2001, longitude: 29.9187 },
  ],
}));

vi.mock("../services/appNotificationManager", () => ({
  requestAppNotificationPermissions: vi.fn().mockResolvedValue(true),
}));

describe("PermissionsStartupModal", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("does not open if user has already completed permissions onboarding", () => {
    localStorage.setItem(PERMISSIONS_ONBOARDING_KEY, "true");
    const { container } = render(<PermissionsStartupModal />);
    expect(container.firstChild).toBeNull();
  });

  it("opens for first-time user and handles auto-detect flow", async () => {
    render(<PermissionsStartupModal />);

    await waitFor(
      () => {
        expect(screen.getByText("مرحباً بك في سنابل الإحسان 🌱")).toBeDefined();
      },
      { timeout: 1500 },
    );

    const autoButton = screen.getByText("تفعيل الإشعارات وتحديد الموقع");
    fireEvent.click(autoButton);

    await waitFor(() => {
      expect(screen.getByText("تم الإعداد بنجاح! 🎉")).toBeDefined();
    });

    expect(localStorage.getItem(PERMISSIONS_ONBOARDING_KEY)).toBe("true");
  });

  it("allows selecting city manually and completes onboarding", async () => {
    render(<PermissionsStartupModal />);

    await waitFor(
      () => {
        expect(screen.getByText("اختيار مدينتي يدويًا")).toBeDefined();
      },
      { timeout: 1500 },
    );

    fireEvent.click(screen.getByText("اختيار مدينتي يدويًا"));

    await waitFor(() => {
      expect(screen.getByText("اختر مدينتك يدويًا 📍")).toBeDefined();
    });

    const cairoButton = screen.getByText("القاهرة");
    fireEvent.click(cairoButton);

    await waitFor(() => {
      expect(screen.getByText("تم الإعداد بنجاح! 🎉")).toBeDefined();
    });

    expect(localStorage.getItem(PERMISSIONS_ONBOARDING_KEY)).toBe("true");
  });

  it("allows skipping and records completion so it only asks on first timer", async () => {
    render(<PermissionsStartupModal />);

    await waitFor(
      () => {
        expect(screen.getByText("لاحقاً")).toBeDefined();
      },
      { timeout: 1500 },
    );

    fireEvent.click(screen.getByText("لاحقاً"));
    expect(localStorage.getItem(PERMISSIONS_ONBOARDING_KEY)).toBe("true");
  });
});
