import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Notifications from "./Notifications";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "طلبات الموافقة": "Approval requests",
        "موافقة": "Approve",
        "رفض": "Deny",
        "طالب": "Student",
      })[key] || key,
    i18n: { language: "en" },
  }),
}));

vi.mock("../../guides/useAutoStartGuide", () => ({
  useAutoStartGuide: () => undefined,
}));

vi.mock("../../components/GoBackButton", () => ({
  default: () => <button type="button">Back</button>,
}));

vi.mock("../student/tutorial/GetAvatar", () => ({
  default: ({ userAvatarData }: { userAvatarData: unknown }) => (
    <div data-testid="student-avatar" data-avatar={JSON.stringify(userAvatarData)} />
  ),
}));

vi.mock("./NotificationContext", () => {
  const notificationState = {
    notifications: [],
    allTrophies: [],
    readChallengeIds: [],
    pendingApprovalRequests: [
      {
        id: 17,
        missionDate: "2026-09-02T08:00:00.000Z",
        Student: {
          user: {
            firstName: "Layla",
            lastName: "Ahmed",
            profileImg: { avatar: "layla" },
          },
          Class: { classname: "Class 4A", grade: "Grade 4" },
          grade: "Grade 4",
        },
        Mission: {
          title: "Drink 6-8 cups of water",
          type: "الإحسان للجسد",
          categoryId: 2,
          xp: 5,
          snabelBlue: 2,
          snabelRed: 1,
          snabelYellow: 1,
        },
      },
    ],
    unreadCount: 1,
    isLoading: false,
    refreshNotifications: vi.fn().mockResolvedValue(undefined),
    approveApprovalRequest: vi.fn().mockResolvedValue(undefined),
    denyApprovalRequest: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  };

  return { useNotifications: () => notificationState };
});

describe("Parent and Teacher approval requests", () => {
  beforeEach(() => {
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("language", "en");
  });

  it("renders the student identity and school metadata in LTR", () => {
    render(<Notifications />);

    expect(screen.getByTestId("approval-requests-page")).toHaveAttribute(
      "dir",
      "ltr",
    );

    const card = screen.getByTestId("approval-request-17");
    expect(within(card).getByText("Layla Ahmed")).toBeInTheDocument();
    expect(within(card).getByText("Class 4A")).toBeInTheDocument();
    expect(within(card).getByText("Grade 4")).toBeInTheDocument();
    expect(within(card).getByTestId("student-avatar")).toHaveAttribute(
      "data-avatar",
      JSON.stringify({ avatar: "layla" }),
    );
    expect(within(card).getByRole("button", { name: "Deny" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(card.querySelector('img[aria-hidden="true"]')).not.toBeNull();
  });
});
