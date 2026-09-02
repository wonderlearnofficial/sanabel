import { beforeEach, describe, expect, it } from "vitest";
import { clearClientSession } from "./session";

describe("security session cleanup", () => {
  beforeEach(() => localStorage.clear());

  it("clears the active identity and saved Admin impersonation identity", () => {
    localStorage.setItem("token", "student-token");
    localStorage.setItem("refreshToken", "student-refresh");
    localStorage.setItem("role", "Student");
    localStorage.setItem("adminReturnToken", "admin-token");
    localStorage.setItem("adminReturnRole", "Admin");
    localStorage.setItem("adminReturnEmail", "admin@example.com");
    localStorage.setItem("adminImpersonatedStudentName", "Student Name");

    clearClientSession();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("adminReturnToken")).toBeNull();
    expect(localStorage.getItem("adminReturnRole")).toBeNull();
    expect(localStorage.getItem("adminReturnEmail")).toBeNull();
    expect(localStorage.getItem("adminImpersonatedStudentName")).toBeNull();
    expect(localStorage.getItem("keepLoggedIn")).toBe("false");
  });
});
