import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import i18n from "../../i18n";
import StudentToDoList from "./StudentToDoList";

vi.mock("axios");
vi.mock("../../components/navbar/TeacherNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/navbar/ParentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/GoBackButton", () => ({ default: () => <button aria-label="back" /> }));
vi.mock("../../components/PrimaryButton", () => ({ default: ({ text, onClick }: any) => <button onClick={onClick}>{text}</button> }));
vi.mock("./tutorial/GetAvatar", () => ({ default: () => <img alt="avatar" /> }));
vi.mock("react-toastify", () => ({
  ToastContainer: () => <div />,
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const refreshUserData = vi.fn();
const mutateStudent = vi.fn();
vi.mock("../../context/StudentUserProvider", () => ({
  useUserContext: () => ({
    user: { id: 901, classId: 10, grade: "Grade 4", completedTasks: { taskIds: [] } },
    refreshUserData,
    mutateStudent,
  }),
}));

const unicodeMission = {
  id: 991,
  status: "todo",
  createdAt: "2026-09-02T08:15:00.000Z",
  position: 0,
  Task: {
    id: 991,
    title: "صلاة الظهر",
    description: "اختبار ترميز عربي",
    type: "الصلاة",
    categoryId: 1,
    xp: 5,
    snabelRed: 1,
    snabelBlue: 1,
    snabelYellow: 1,
  },
  Sources: [{ sourceType: "student", sourceId: 901, name: "You", createdAt: "2026-09-02T08:15:00.000Z" }],
  ApprovalRequests: [],
};

describe("Student Daily Mission localization", () => {
  beforeEach(async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "Student");
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/mission/myApprovers")) return { data: { data: { approvers: [] } } } as any;
      return { data: { data: {
        selectedDate: "2026-09-02",
        serverToday: "2026-09-02",
        earliestDate: "2026-09-01",
        historicalPendingCount: 0,
        oldestHistoricalPendingDate: null,
        items: [unicodeMission],
      } } } as any;
    });
    await i18n.changeLanguage("ar");
  });

  it("renders Arabic RTL chrome and preserves exact Arabic mission Unicode", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/student/todolist"]}><StudentToDoList /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("صلاة الظهر")).toBeInTheDocument());

    for (const label of ["قائمة المهام", "اليوم", "الكل", "قيد التنفيذ", "معلقة", "مكتملة", "المصدر", "ترتيبي", "إضافة مهمة جديدة"]) {
      expect(screen.getAllByText((_, element) => element?.textContent?.includes(label) === true).length).toBeGreaterThan(0);
    }
    expect(container.querySelector("#page-height")).toHaveAttribute("dir", "rtl");
    expect(container.textContent).not.toMatch(/Task List|Today|Pending|Completed|Source: All|My order|Added by me|Add New Mission/);
    expect(container.textContent).not.toMatch(/\?{3,}/);
  });

  it("switches to English LTR without a reload or state reset", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/student/todolist"]}><StudentToDoList /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("صلاة الظهر")).toBeInTheDocument());

    await act(async () => { await i18n.changeLanguage("en"); });

    for (const label of ["Task List", "Today", "All", "In Progress", "Pending", "Completed", "Source", "My order", "Add New Mission"]) {
      await waitFor(() => expect(screen.getAllByText((_, element) => element?.textContent?.includes(label) === true).length).toBeGreaterThan(0));
    }
    expect(container.querySelector("#page-height")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("صلاة الظهر")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\?{3,}/);
  });
});
