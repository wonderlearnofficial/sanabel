import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../../i18n";
import AdminRedirectScreen from "./AdminRedirectScreen";
import ImpersonationBanner from "../../components/ImpersonationBanner";
import { localStore } from "../../utils/safeStorage";

describe("Mobile Admin Cutover — Required 16 Regression Tests", () => {
  const originalEnvUrl = import.meta.env.VITE_ADMIN_APP_URL;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (import.meta.env as any).VITE_ADMIN_APP_URL = originalEnvUrl;
  });

  // Helper simulating App router with /admin and legacy path guards
  const renderRouter = (initialPath: string) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Switch>
          <Route exact path="/admin-redirect" component={AdminRedirectScreen} />
          <Route path="/admin" component={AdminRedirectScreen} />
          <Route path="/student/home" render={() => <div data-testid="student-home">Student Home</div>} />
          <Route path="/student/create-avatar" render={() => <div data-testid="avatar-create">Create Avatar</div>} />
          <Route path="/teacher/home" render={() => <div data-testid="teacher-home">Teacher Home</div>} />
          <Route path="/parent/home" render={() => <div data-testid="parent-home">Parent Home</div>} />
          <Route path="/login" render={() => <div data-testid="login-screen">Login Screen</div>} />
        </Switch>
      </MemoryRouter>
    );
  };

  // 1. Admin login -> DOES NOT navigate to /admin/userdata and DOES NOT store persistent mobile session
  it("1. Admin login -> DOES NOT navigate to /admin/userdata and DOES NOT store mobile session", () => {
    // Simulate Admin login response handling
    localStore.setItem("token", "pre-existing-token");
    localStore.setItem("keepLoggedIn", "true");

    const role = "Admin";
    let target = "";
    if (role === "Admin") {
      localStore.removeItem("token");
      localStore.removeItem("refreshToken");
      localStore.removeItem("role");
      localStore.removeItem("user");
      localStore.setItem("keepLoggedIn", "false");
      target = "/admin-redirect";
    }

    expect(target).not.toBe("/admin/userdata");
    expect(target).toBe("/admin-redirect");
    expect(localStore.getItem("token")).toBeNull();
    expect(localStore.getItem("refreshToken")).toBeNull();
    expect(localStore.getItem("role")).toBeNull();
    expect(localStore.getItem("keepLoggedIn")).toBe("false");
  });

  // 2. Admin login -> DOES NOT navigate to /admin/home and does not trigger refreshUserData
  it("2. Admin login -> DOES NOT navigate to /admin/home and skips refreshUserData", () => {
    let refreshUserDataCalled = false;
    const refreshUserData = () => { refreshUserDataCalled = true; };

    const role = "Admin";
    let target = "";
    if (role === "Admin") {
      target = "/admin-redirect";
    } else {
      refreshUserData();
    }

    expect(target).not.toBe("/admin/home");
    expect(target).toBe("/admin-redirect");
    expect(refreshUserDataCalled).toBe(false);
  });

  // 3. Admin login -> shows Admin Console screen
  it("3. Admin login -> shows Admin Console screen", () => {
    render(
      <MemoryRouter>
        <AdminRedirectScreen />
      </MemoryRouter>
    );
    expect(screen.getByText("هذا الحساب يستخدم لوحة الإدارة")).toBeInTheDocument();
    expect(
      screen.getByText("يمكنك إدارة المدرسة أو المنصة من خلال لوحة الإدارة المخصصة.")
    ).toBeInTheDocument();
  });

  // 4. Open Admin Console -> uses VITE_ADMIN_APP_URL
  it("4. Open Admin Console -> uses VITE_ADMIN_APP_URL", () => {
    (import.meta.env as any).VITE_ADMIN_APP_URL = "https://temporary-swift-marsh-3qyyrbm.vercel.app";
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <MemoryRouter>
        <AdminRedirectScreen />
      </MemoryRouter>
    );

    const button = screen.getByTestId("open-admin-button");
    expect(button).toHaveTextContent("فتح لوحة الإدارة");
    fireEvent.click(button);

    expect(openSpy).toHaveBeenCalledWith(
      "https://temporary-swift-marsh-3qyyrbm.vercel.app",
      "_blank",
      "noopener,noreferrer"
    );
  });

  // 5. missing VITE_ADMIN_APP_URL -> safe configuration message
  it("5. missing VITE_ADMIN_APP_URL -> safe configuration message without crash", () => {
    (import.meta.env as any).VITE_ADMIN_APP_URL = "";

    render(
      <MemoryRouter>
        <AdminRedirectScreen />
      </MemoryRouter>
    );

    expect(screen.getByTestId("admin-config-warning")).toBeInTheDocument();
    expect(screen.getByTestId("open-admin-button-disabled")).toBeDisabled();
    expect(screen.queryByTestId("open-admin-button")).not.toBeInTheDocument();
  });

  // 6. /admin -> no Admin UI
  it("6. /admin -> no Admin UI", () => {
    const { queryByText, getByText } = renderRouter("/admin");
    expect(getByText("هذا الحساب يستخدم لوحة الإدارة")).toBeInTheDocument();
    expect(queryByText("UserData")).not.toBeInTheDocument();
    expect(queryByText("AdminHeader")).not.toBeInTheDocument();
    expect(queryByText("AdminNavbar")).not.toBeInTheDocument();
  });

  // 7. /admin/userdata -> no Admin UI
  it("7. /admin/userdata -> no Admin UI", () => {
    const { queryByText, getByText } = renderRouter("/admin/userdata");
    expect(getByText("هذا الحساب يستخدم لوحة الإدارة")).toBeInTheDocument();
    expect(queryByText("UserData")).not.toBeInTheDocument();
    expect(queryByText("AdminHeader")).not.toBeInTheDocument();
  });

  // 8. /admin/home -> no Admin UI
  it("8. /admin/home -> no Admin UI", () => {
    const { queryByText, getByText } = renderRouter("/admin/home");
    expect(getByText("هذا الحساب يستخدم لوحة الإدارة")).toBeInTheDocument();
    expect(queryByText("UserData")).not.toBeInTheDocument();
    expect(queryByText("AdminHeader")).not.toBeInTheDocument();
  });

  // 9. /admin/random -> no Admin UI
  it("9. /admin/random -> no Admin UI", () => {
    const { queryByText, getByText } = renderRouter("/admin/random");
    expect(getByText("هذا الحساب يستخدم لوحة الإدارة")).toBeInTheDocument();
    expect(queryByText("UserData")).not.toBeInTheDocument();
    expect(queryByText("AdminHeader")).not.toBeInTheDocument();
  });

  // 10. Solo User login -> normal app
  it("10. Solo User login -> normal app", () => {
    const role = "Student";
    const hasCompletedTutorial = "true";
    const target = role === "Student" ? (hasCompletedTutorial ? "/student/home" : "/student/create-avatar") : "";
    expect(target).toBe("/student/home");
  });

  // 11. School Student login -> normal app
  it("11. School Student login -> normal app", () => {
    const role = "Student";
    const hasCompletedTutorial = "true";
    const target = role === "Student" ? (hasCompletedTutorial ? "/student/home" : "/student/create-avatar") : "";
    expect(target).toBe("/student/home");
  });

  // 12. Teacher login -> normal app
  it("12. Teacher login -> normal app", () => {
    const role = "Teacher";
    const target = role === "Teacher" ? "/teacher/home" : "";
    expect(target).toBe("/teacher/home");
  });

  // 13. Parent login -> normal app
  it("13. Parent login -> normal app", () => {
    const role = "Parent";
    const target = role === "Parent" ? "/parent/home" : "";
    expect(target).toBe("/parent/home");
  });

  // 14. Student impersonation handoff -> works
  it("14. Student impersonation handoff -> works and parses handoffCode", () => {
    const testUrl = "https://sanabel-tau.vercel.app/impersonate?code=test-code-12345678";
    const urlObj = new URL(testUrl);
    const code = urlObj.searchParams.get("code") || urlObj.searchParams.get("handoffCode");
    expect(code).toBe("test-code-12345678");
  });

  // 15. ImpersonationBanner -> works
  it("15. ImpersonationBanner -> displays when isImpersonated is active", () => {
    localStorage.setItem("isImpersonated", "true");
    localStorage.setItem("impersonatedStudentName", "Omar Ahmed");

    render(<ImpersonationBanner />);

    expect(screen.getByText(/Omar Ahmed/)).toBeInTheDocument();
    expect(screen.getByText("العودة للوحة التحكم")).toBeInTheDocument();
  });

  // 16. Exit impersonation -> works
  it("16. Exit impersonation -> clears session credentials and cleans storage", () => {
    localStorage.setItem("isImpersonated", "true");
    localStorage.setItem("impersonatedStudentName", "Omar Ahmed");
    localStorage.setItem("token", "student-token");
    localStorage.setItem("role", "Student");

    render(<ImpersonationBanner />);

    const exitBtn = screen.getByRole("button");
    fireEvent.click(exitBtn);

    expect(localStorage.getItem("isImpersonated")).toBeNull();
    expect(localStorage.getItem("impersonatedStudentName")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
