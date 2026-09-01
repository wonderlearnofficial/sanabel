import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import StudentToDoList from "./StudentToDoList";

vi.mock("axios");
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (value: string) => value }) }));
vi.mock("../../components/navbar/StudentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/navbar/TeacherNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/navbar/ParentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/GoBackButton", () => ({ default: () => <button>back</button> }));
vi.mock("../../components/PrimaryButton", () => ({ default: ({ text, onClick }: any) => <button onClick={onClick}>{text}</button> }));
vi.mock("../../context/StudentUserProvider", () => ({
  useUserContext: () => ({
    user: { id: 9, classId: 4, grade: "primary", completedTasks: { taskIds: [] } },
    refreshUserData: vi.fn(),
    mutateStudent: vi.fn(),
  }),
}));

describe("School Student persistent To-Do", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "Student");
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/mission/myApprovers")) return { data: { data: { approvers: [] } } } as any;
      return { data: { data: [
        { id: 41, status: "pending_approval", createdAt: "2026-09-01T10:00:00Z",
          Task: { id: 3, title: "Help the class", type: "community", xp: 5, snabelRed: 1, snabelBlue: 1, snabelYellow: 1 },
          Sources: [{ sourceType: "teacher", sourceId: 5, name: "Ms Amal" }], ApprovalRequests: [{ id: 8, status: "pending" }] },
        { id: 42, status: "completed", createdAt: "2026-09-01T09:00:00Z", completionSource: "parent_direct", completedByName: "Mom",
          Task: { id: 4, title: "Help the family", type: "family", xp: 5, snabelRed: 1, snabelBlue: 1, snabelYellow: 1 },
          Sources: [], ApprovalRequests: [] },
      ] } } as any;
    });
  });

  it("renders authoritative pending/completed states and keeps assignment and completion metadata separate", async () => {
    render(<StudentToDoList />);
    await waitFor(() => expect(screen.getByText("Help the class")).toBeInTheDocument());
    expect(screen.getByText(/Assigned by.*Ms Amal/)).toBeInTheDocument();
    expect(screen.getByText("Waiting for approval")).toBeInTheDocument();
    expect(screen.getByText("Help the family")).toBeInTheDocument();
    expect(screen.getByText(/Completed.*Confirmed by.*Mom/)).toBeInTheDocument();
  });
});
