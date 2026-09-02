import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import StudentToDoList from "./StudentToDoList";
import { computeReorder, todoSourceKind, formatTodoDate } from "./StudentToDoList";

vi.mock("axios");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (value: string, options?: { count?: number }) => ({
      "todo.search": "بحث",
      "todo.searchPlaceholder": "ابحث عن مهمة أو تصنيف",
      "todo.date.previous": "اليوم السابق",
      "todo.date.select": "اختر التاريخ",
      "todo.date.firstDay": "هذا أول يوم في حسابك، ولا يوجد سجل مهام أقدم",
      "todo.historical.pending": `لديك ${options?.count ?? ""} طلبات موافقة معلقة من أيام سابقة`,
      "todo.status.completed": "مكتملة",
      "todo.source.self": "أضفتها أنا",
      "todo.approval.waitingForPrefix": "بانتظار موافقة",
      "todo.source.label": "المصدر",
      "todo.sort.label": "الترتيب",
      "todo.approval.retarget": "طلب الموافقة من شخص آخر",
      "todo.remove": "إزالة من قائمتي",
    } as Record<string, string>)[value] || value,
    i18n: { language: "ar", resolvedLanguage: "ar" },
  }),
}));
vi.mock("../../components/navbar/StudentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/navbar/TeacherNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/navbar/ParentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../components/GoBackButton", () => ({ default: () => <button>back</button> }));
vi.mock("../../components/PrimaryButton", () => ({ default: ({ text, onClick }: any) => <button onClick={onClick}>{text}</button> }));
vi.mock("./tutorial/GetAvatar", () => ({ default: () => <img alt="avatar" /> }));
vi.mock("react-toastify", () => ({
  ToastContainer: () => <div />,
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));
// Stable function identities: a fresh vi.fn() per render would change the
// load effect's dependencies every render and loop it forever.
const mockRefreshUserData = vi.fn();
const mockMutateStudent = vi.fn();
const mockUser: any = { id: 9, classId: 4, grade: "primary", completedTasks: { date: "2026-09-02", taskIds: [] } };
vi.mock("../../context/StudentUserProvider", () => ({
  useUserContext: () => ({
    user: mockUser,
    refreshUserData: mockRefreshUserData,
    mutateStudent: mockMutateStudent,
  }),
}));

const task = (id: number, title: string) => ({
  id, title, type: "الإحسان للجسد", categoryId: 2, xp: 5, snabelRed: 1, snabelBlue: 1, snabelYellow: 1,
});

const serverItems = [
  {
    id: 41, status: "pending_approval", createdAt: "2026-09-01T10:00:00Z", position: 0,
    Task: task(3, "Help the class"),
    Sources: [{ sourceType: "teacher", sourceId: 5, name: "Ms Amal", createdAt: "2026-09-01T10:00:00Z" }],
    ApprovalRequests: [{ id: 8, status: "pending", pendingWith: [{ type: "teacher", id: 5, name: "Ms Amal" }] }],
  },
  {
    id: 43, status: "todo", createdAt: "2026-09-01T09:30:00Z", position: 1,
    Task: task(6, "Water a plant"),
    Sources: [{ sourceType: "student", sourceId: 9, name: "You", createdAt: "2026-09-01T09:30:00Z" }],
    ApprovalRequests: [],
  },
  {
    id: 44, status: "todo", createdAt: "2026-09-01T08:00:00Z", position: 2,
    Task: task(7, "Group mission"),
    Sources: [
      { sourceType: "teacher", sourceId: 5, name: "Ms Amal", createdAt: "2026-09-01T08:00:00Z" },
      { sourceType: "parent", sourceId: 2, name: "Mom", createdAt: "2026-09-01T08:30:00Z" },
    ],
    ApprovalRequests: [],
  },
  {
    id: 42, status: "completed", createdAt: "2026-09-01T09:00:00Z", position: null,
    completionSource: "parent_direct", completedByName: "Mom",
    Task: task(4, "Help the family"),
    Sources: [], ApprovalRequests: [],
  },
];

describe("School Student To-Do v2", () => {
  beforeEach(() => {
    mockUser.classId = 4;
    mockUser.completedTasks = { date: "2026-09-02", taskIds: [] };
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "Student");
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/mission/myApprovers")) {
        return { data: { data: { approvers: [
          { id: 5, type: "teacher", name: "Ms Amal" },
          { id: 2, type: "parent", name: "Mom" },
        ] } } } as any;
      }
      return { data: { data: serverItems } } as any;
    });
    vi.mocked(axios.post).mockResolvedValue({ data: { data: {} } } as any);
    vi.mocked(axios.patch).mockResolvedValue({ data: {} } as any);
  });

  const renderList = async () => {
    render(<StudentToDoList />);
    await waitFor(() => expect(screen.getByText("Help the class")).toBeInTheDocument());
  };

  it("uses the compact date navigator, date-scoped API, and collapsed search", async () => {
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/mission/myApprovers")) return { data: { data: { approvers: [] } } } as any;
      return { data: { data: {
        selectedDate: "2026-09-02", serverToday: "2026-09-02", earliestDate: "2026-08-31",
        historicalPendingCount: 2, oldestHistoricalPendingDate: "2026-08-31", items: serverItems,
      } } } as any;
    });
    await renderList();
    expect(screen.queryByPlaceholderText("ابحث عن مهمة أو تصنيف")).not.toBeInTheDocument();
    expect(screen.getByText(/طلبات موافقة معلقة/)).toHaveTextContent("2");
    const firstTodoCall = vi.mocked(axios.get).mock.calls.find(([url]) => String(url).endsWith("/mission/todo"));
    expect(firstTodoCall?.[1]).not.toHaveProperty("params");
    fireEvent.click(screen.getByLabelText("بحث"));
    expect(screen.getByPlaceholderText("ابحث عن مهمة أو تصنيف")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("إغلاق البحث"));
    expect(screen.queryByPlaceholderText("ابحث عن مهمة أو تصنيف")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("اليوم السابق"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/mission/todo"), expect.objectContaining({ params: { date: "2026-09-01" } })));
  });

  it("explains when the navigator reaches the account history boundary", async () => {
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/mission/myApprovers")) return { data: { data: { approvers: [] } } } as any;
      return { data: { data: {
        selectedDate: "2026-09-01", serverToday: "2026-09-02", earliestDate: "2026-09-01",
        historicalPendingCount: 0, oldestHistoricalPendingDate: null, items: serverItems,
      } } } as any;
    });

    await renderList();
    fireEvent.click(screen.getByLabelText("اليوم السابق"));
    expect(screen.queryByTestId("todo-history-boundary")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("اليوم السابق"));
    await waitFor(() => expect(screen.getByTestId("todo-history-boundary")).toHaveTextContent("هذا أول يوم في حسابك"));
  });

  it("opens an in-app calendar when the date control is pressed", async () => {
    await renderList();
    const dateButton = screen.getByRole("button", { name: "اختر التاريخ" });
    expect(dateButton).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(dateButton);
    expect(screen.getByRole("dialog", { name: "اختر التاريخ" })).toBeInTheDocument();
  });

  it("gives Solo Users date and collapsed-search controls without a pending tab", async () => {
    mockUser.classId = null;
    localStorage.setItem("sanabel:todos:9", JSON.stringify([{
      id: 3, task: task(3, "Help the class"), completed: false, addedDate: "2026-09-02T08:00:00Z",
    }]));
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/students/student-task-completed")) return { data: { completedTasks: [{
        ...task(7, "An older completed mission"), missionDate: "2026-08-30",
        createdAt: "2026-08-30T08:00:00Z", updatedAt: "2026-08-30T08:05:00Z",
      }] } } as any;
      return { data: {} } as any;
    });

    await renderList();
    expect(screen.queryByTestId("status-tab-pending")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("ابحث عن مهمة أو تصنيف")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اختر التاريخ" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("بحث"));
    expect(screen.getByPlaceholderText("ابحث عن مهمة أو تصنيف")).toBeInTheDocument();
  });

  it("bootstraps from serverToday before sending a date when the device clock is ahead", async () => {
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/mission/myApprovers")) return { data: { data: { approvers: [] } } } as any;
      return { data: { data: {
        selectedDate: "2026-09-01", serverToday: "2026-09-01", earliestDate: "2026-08-31",
        historicalPendingCount: 0, oldestHistoricalPendingDate: null, items: serverItems,
      } } } as any;
    });

    await renderList();
    await waitFor(() => {
      const todoCalls = vi.mocked(axios.get).mock.calls
        .filter(([url]) => String(url).endsWith("/mission/todo"));
      expect(todoCalls.length).toBeGreaterThanOrEqual(2);
      expect(todoCalls[0][1]).not.toHaveProperty("params");
      expect(todoCalls[1][1]).toEqual(expect.objectContaining({ params: { date: "2026-09-01" } }));
    });
  });

  it("renders states, source identity and assignment dates without a permanent trash button", async () => {
    await renderList();

    expect(screen.getAllByText("مكتملة").length).toBeGreaterThan(0);

    // Pending chip names its approver; metadata carries name AND a visible
    // date — the date must never be truncated away.
    const teacherCard = screen.getByTestId("todo-card-3");
    expect(within(teacherCard).getByText("بانتظار موافقة")).toBeInTheDocument();
    expect(within(teacherCard).getAllByText("Ms Amal").length).toBeGreaterThan(0);
    expect(within(teacherCard).getByText(/سبتمبر/)).toBeInTheDocument();

    const selfCard = screen.getByTestId("todo-card-6");
    expect(within(selfCard).getByText(/أضفتها أنا/)).toBeInTheDocument();
    expect(within(selfCard).getByText(/سبتمبر/)).toBeInTheDocument();

    const multiCard = screen.getByTestId("todo-card-7");
    expect(within(multiCard).getByText("todo.multiSourceLine")).toBeInTheDocument();

    // Full per-source names/dates live in the details sheet.
    fireEvent.click(screen.getByTestId("todo-menu-7"));
    fireEvent.click(screen.getByTestId("menu-details"));
    expect(screen.getByText("مصادر المهمة")).toBeInTheDocument();
    expect(screen.getAllByText("Ms Amal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mom").length).toBeGreaterThan(0);

    // No always-visible destructive control on any card.
    expect(screen.queryByLabelText("حذف المهمة")).not.toBeInTheDocument();
    expect(screen.queryByTestId("menu-remove")).not.toBeInTheDocument();
  });

  it("menu actions depend on state: self-added removable, assigned not, pending retargetable, completed read-only", async () => {
    await renderList();

    fireEvent.click(screen.getByTestId("todo-menu-6"));
    expect(screen.getByTestId("menu-details")).toBeInTheDocument();
    expect(screen.getByTestId("menu-remove")).toBeInTheDocument();
    expect(screen.queryByTestId("menu-retarget")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("خيارات المهمة", { selector: "div[role=dialog]" }).parentElement as HTMLElement);

    fireEvent.click(screen.getByTestId("todo-menu-3"));
    expect(screen.getByTestId("menu-retarget")).toBeInTheDocument();
    expect(screen.queryByTestId("menu-remove")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("خيارات المهمة", { selector: "div[role=dialog]" }).parentElement as HTMLElement);

    fireEvent.click(screen.getByTestId("todo-menu-7"));
    expect(screen.queryByTestId("menu-remove")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("خيارات المهمة", { selector: "div[role=dialog]" }).parentElement as HTMLElement);

    fireEvent.click(screen.getByTestId("todo-menu-4"));
    expect(screen.getByTestId("menu-details")).toBeInTheDocument();
    expect(screen.queryByTestId("menu-remove")).not.toBeInTheDocument();
    expect(screen.queryByTestId("menu-retarget")).not.toBeInTheDocument();
  });

  it("retargets a pending request to another eligible approver via the API", async () => {
    await renderList();
    fireEvent.click(screen.getByTestId("todo-menu-3"));
    fireEvent.click(screen.getByTestId("menu-retarget"));

    expect(screen.queryByTestId("retarget-teacher-5")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("retarget-parent-2"));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/mission/approval/8/retarget"),
      { approverType: "parent", approverId: 2 },
      expect.anything(),
    ));
  });

  it("filters by assignment source through the source sheet, with every option reachable", async () => {
    await renderList();
    fireEvent.click(screen.getByTestId("todo-source-button"));

    // All five options are in the sheet — including Parent, which used to be
    // clipped off-screen in the chip row.
    for (const key of ["all", "self", "teacher", "parent", "multi"]) {
      expect(screen.getByTestId(`source-${key}`)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByTestId("source-self"));
    expect(screen.getByText("Water a plant")).toBeInTheDocument();
    expect(screen.queryByText("Help the class")).not.toBeInTheDocument();
    expect(screen.queryByText("Group mission")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("todo-source-button"));
    fireEvent.click(screen.getByTestId("source-multi"));
    expect(screen.getByText("Group mission")).toBeInTheDocument();
    expect(screen.queryByText("Water a plant")).not.toBeInTheDocument();
  });

  it("renders semantic icons: category chip, status tabs, source rows, sort trigger", async () => {
    await renderList();

    // The chip uses the mission type's Sanabel image asset, not a generic
    // category-level React icon.
    const chip = screen.getByTestId("category-chip-3");
    expect(chip.querySelector("img")).not.toBeNull();
    expect(chip.querySelector("svg")).toBeNull();

    // Every status tab carries an icon plus its label and count.
    for (const key of ["all", "active", "pending", "completed"]) {
      expect(screen.getByTestId(`status-tab-${key}`).querySelector("svg")).not.toBeNull();
    }

    // Sort trigger has the sort glyph, source trigger has the source glyph.
    expect(screen.getByTestId("todo-sort-button").querySelector("svg")).not.toBeNull();
    expect(screen.getByTestId("todo-source-button").querySelector("svg")).not.toBeNull();

    // Source sheet rows each carry their identity icon.
    fireEvent.click(screen.getByTestId("todo-source-button"));
    for (const key of ["all", "self", "teacher", "parent", "multi"]) {
      expect(screen.getByTestId(`source-${key}`).querySelector("svg")).not.toBeNull();
    }
  });

  it("groups by source when that sort is chosen, and drag handles disappear", async () => {
    await renderList();
    expect(screen.getByTestId("todo-drag-3")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("todo-sort-button"));
    fireEvent.click(screen.getByTestId("sort-source"));

    // Group headings are h2 elements; the chip row shares two of the labels.
    expect(screen.getByRole("heading", { name: /من المعلمين/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /أضفتها أنا/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /مصادر متعددة/ })).toBeInTheDocument();
    expect(screen.queryByTestId("todo-drag-3")).not.toBeInTheDocument();
  });

  it("Solo Users view truthful completed missions and uncompleted tasks on past dates", async () => {
    mockUser.classId = null;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    localStorage.setItem("sanabel:todos:days:9", JSON.stringify({
      [yesterday]: [{ id: 6, task: task(6, "Water a plant"), completed: false, addedDate: `${yesterday}T09:00:00Z` }],
      [today]: [{ id: 7, task: task(7, "Today mission"), completed: false, addedDate: `${today}T09:00:00Z` }],
    }));

    vi.mocked(axios.get).mockImplementation(async (url) => {
      if (url.endsWith("/students/appear-Taskes-Completed")) {
        return {
          data: {
            completedTasks: [
              {
                id: 3,
                taskId: 3,
                title: "Help the class",
                type: "الإحسان للجسد",
                missionDate: yesterday,
                createdAt: `${yesterday}T10:00:00Z`,
              },
            ],
          },
        };
      }
      return { data: {} };
    });

    render(<StudentToDoList />);
    await waitFor(() => expect(screen.getByText("Today mission")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("اليوم السابق"));
    await waitFor(() => {
      expect(screen.getByText("Help the class")).toBeInTheDocument();
      expect(screen.getByText("Water a plant")).toBeInTheDocument();
    });
  });

  it("Solo User missions assigned on a previous day do not leak into the new day", async () => {
    mockUser.classId = null;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    localStorage.setItem("sanabel:todos:days:9", JSON.stringify({
      [yesterday]: [{ id: 6, task: task(6, "Yesterday open task"), completed: false, addedDate: `${yesterday}T09:00:00Z` }],
    }));

    vi.mocked(axios.get).mockImplementation(async (url) => {
      if (url.endsWith("/students/appear-Taskes-Completed")) {
        return { data: { completedTasks: [] } };
      }
      return { data: {} };
    });

    render(<StudentToDoList />);
    await waitFor(() => expect(screen.queryByText("Yesterday open task")).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("اليوم السابق"));
    await waitFor(() => {
      expect(screen.getByText("Yesterday open task")).toBeInTheDocument();
    });
  });
});

describe("reorder and helpers (pure)", () => {
  it("computeReorder produces the moved id order and the API payload", () => {
    const result = computeReorder([41, 43, 44], 44, 41);
    expect(result?.ids).toEqual([44, 41, 43]);
    expect(result?.payload).toEqual([
      { id: 44, position: 0 },
      { id: 41, position: 1 },
      { id: 43, position: 2 },
    ]);
  });

  it("computeReorder is null for unknown ids or no-op moves", () => {
    expect(computeReorder([1, 2], 9, 1)).toBeNull();
    expect(computeReorder([1, 2], 1, 1)).toBeNull();
  });

  it("todoSourceKind buckets multi-source items separately", () => {
    const item = (sources: any[]) => ({ id: 1, task: {} as any, completed: false, sources }) as any;
    expect(todoSourceKind(item([{ sourceType: "student" }]), false)).toBe("self");
    expect(todoSourceKind(item([{ sourceType: "teacher" }]), false)).toBe("teacher");
    expect(todoSourceKind(item([{ sourceType: "teacher" }, { sourceType: "parent" }]), false)).toBe("multi");
    expect(todoSourceKind(item([]), true)).toBe("self");
  });

  it("formatTodoDate formats ISO input and rejects garbage", () => {
    expect(formatTodoDate("2026-09-01T10:00:00Z", "en")).toMatch(/September/);
    expect(formatTodoDate("not-a-date", "en")).toBe("");
    expect(formatTodoDate(undefined, "en")).toBe("");
  });
});
