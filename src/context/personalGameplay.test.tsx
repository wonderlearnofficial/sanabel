import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { UserProvider, useUserContext } from "./StudentUserProvider";
import TodoList from "../pages/student/StudentToDoList";
import Shop from "../components/tree/Shop";
import ProgressTrophies from "../pages/student/progress/ProgressTrophies";
import { AudioManager } from "../utils/AudioManager";

vi.mock("axios", () => ({ default: { get: vi.fn(), request: vi.fn() } }));
vi.mock("../utils/AudioManager", () => ({ AudioManager: { play: vi.fn(), unlock: vi.fn() } }));
vi.mock("react-i18next", async () => ({ ...await vi.importActual<any>("react-i18next"), useTranslation: () => ({ t: (key: string) => key, i18n: { language: "ar" } }) }));
vi.mock("../guides/useAutoStartGuide", () => ({ useAutoStartGuide: vi.fn() }));
vi.mock("../components/navbar/StudentNavbar", () => ({ default: () => null }));
vi.mock("../components/navbar/TeacherNavbar", () => ({ default: () => null }));
vi.mock("../components/navbar/ParentNavbar", () => ({ default: () => null }));
vi.mock("framer-motion", () => {
  const components: Record<string, any> = {};
  return {
  AnimatePresence: ({ children }: any) => children,
  motion: new Proxy({}, { get: (_target, tag: string) => components[tag] ||= ({ children, initial, animate, exit, transition, whileHover, whileTap, variants, ...props }: any) => React.createElement(tag, props, children) }),
  };
});
vi.mock("react-toastify", () => ({
  ToastContainer: () => <div id="test-toast" role="alert" />,
  toast: { error: (message: string) => { document.getElementById("test-toast")!.textContent = message; }, warning: vi.fn() },
}));

const deferred = () => {
  let resolve!: (value: any) => void, reject!: (reason: any) => void;
  const promise = new Promise<any>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const date = new Date().toISOString().slice(0, 10);
const student = { id: 7, classId: null, organizationId: null, xp: 0, snabelRed: 100, snabelBlue: 100, snabelYellow: 100, water: 0, seeders: 0, treeProgress: 1, user: { firstName: "Personal", lastName: "Student", email: "test@example.invalid" } };
const profile = (values = {}) => ({ status: 200, data: { data: { student: { ...student, ...values }, treePoint: { water: 1, seeders: 1, stage: 0, treeProgress: 1 }, completedTasks: { date, taskIds: [] } } } });
function Probe() {
  const context = useUserContext();
  return <><output data-testid="state">{JSON.stringify(context.user)}</output><button onClick={() => void context.refreshUserData()}>refresh profile</button></>;
}
function mount(page: React.ReactNode = <TodoList />) {
  return render(<MemoryRouter><UserProvider><Probe />{page}</UserProvider></MemoryRouter>);
}
const state = () => JSON.parse(screen.getByTestId("state").textContent!);
async function confirmMission() {
  fireEvent.click(await screen.findByTestId("complete-mission-1"));
  const button = screen.getByRole("button", { name: "تأكيد" });
  fireEvent.click(button); fireEvent.click(button);
}
async function confirmPurchase() {
  await waitFor(() => expect(state()?.id).toBe(7));
  fireEvent.click(screen.getAllByText("+")[1]);
  fireEvent.click(screen.getByText("شراء"));
  const button = screen.getByRole("button", { name: "تأكيد الشراء" });
  fireEvent.click(button); fireEvent.click(button);
}
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  localStorage.setItem("token", "test-token"); localStorage.setItem("role", "Student");
  localStorage.setItem("sanabel:todos:7", JSON.stringify([{ id: 1, task: { id: 1, title: "Personal task", type: "Kind", completionStatus: "Completed" }, completed: false }]));
  vi.mocked(axios.get).mockImplementation(async (url: any) => url.includes("/users/session") ? { status: 200 } : profile());
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("personal gameplay interactions", () => {
  it("shop controls cannot consume clicks against an unloaded zero-value profile", async () => {
    const pending = deferred(); vi.mocked(axios.get).mockReturnValue(pending.promise);
    mount(<Shop />);
    expect(screen.getByRole("button", { name: "زيادة الماء" })).toBeDisabled();
    expect(screen.getByText("جاري تحميل البيانات...")).toBeInTheDocument();
    await act(async () => pending.resolve(profile()));
    expect(screen.getByRole("button", { name: "زيادة الماء" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "زيادة الماء" }));
    expect(screen.getByText("شراء")).toBeInTheDocument();
  });

  it("mission stays checked after success, updates rewards once and plays authoritative level-up", async () => {
    const pending = deferred(); vi.mocked(axios.request).mockReturnValue(pending.promise);
    mount(); await confirmMission();
    expect(axios.request).toHaveBeenCalledTimes(1);
    expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining("/students/add-pros") }));
    expect(screen.getByRole("button", { name: "جاري التحديث..." })).toBeDisabled();
    expect(AudioManager.play).not.toHaveBeenCalled();
    await act(async () => pending.resolve({ status: 201, data: { student: { ...student, xp: 15 }, completion: { taskId: 1, date, completionStatus: "Completed" } } }));
    expect(screen.getByTestId("complete-mission-1")).toHaveAttribute("aria-pressed", "true");
    expect(state().xp).toBe(15);
    expect(AudioManager.play).toHaveBeenCalledTimes(1);
    expect(AudioManager.play).toHaveBeenCalledWith("levelUp", true);
  });

  it("mission failure shows its reason, keeps circle incomplete and allows retry", async () => {
    vi.mocked(axios.request).mockRejectedValue({ response: { status: 400, data: { message: "Specific rejection" } } });
    mount(); await confirmMission();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Specific rejection"));
    expect(screen.getByTestId("complete-mission-1")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("complete-mission-1")).not.toBeDisabled();
    expect(AudioManager.play).not.toHaveBeenCalledWith("reward", true);
    expect(AudioManager.play).not.toHaveBeenCalledWith("levelUp", true);
  });

  it("a profile fetch started before completion cannot overwrite confirmed state", async () => {
    mount(); await screen.findByTestId("complete-mission-1");
    const stale = deferred(); vi.mocked(axios.get).mockReturnValueOnce(stale.promise);
    fireEvent.click(screen.getByText("refresh profile"));
    vi.mocked(axios.request).mockResolvedValue({ status: 201, data: { student: { ...student, xp: 5 }, completion: { taskId: 1, date } } });
    await confirmMission();
    await waitFor(() => expect(state().xp).toBe(5));
    await act(async () => stale.resolve(profile()));
    expect(state().xp).toBe(5);
    expect(screen.getByTestId("complete-mission-1")).toHaveAttribute("aria-pressed", "true");
  });

  it("purchase updates every balance and inventory with one in-flight request", async () => {
    const pending = deferred(); vi.mocked(axios.request).mockReturnValue(pending.promise);
    mount(<Shop />); await confirmPurchase();
    expect(axios.request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "جاري الشراء..." })).toBeDisabled();
    await act(async () => pending.resolve({ status: 200, data: { student: { ...student, water: 1, snabelRed: 90, snabelBlue: 90, snabelYellow: 90 } } }));
    expect(state()).toMatchObject({ water: 1, fertilizer: 0, snabelRed: 90, snabelBlue: 90, snabelYellow: 90 });
    expect(screen.getByText("تمت عملية الشراء بنجاح")).toBeInTheDocument();
    expect(AudioManager.play).toHaveBeenCalledWith("success", true);
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(screen.queryByText("جاري الشراء...")).not.toBeInTheDocument();
  });

  it.each([400, 500])("purchase failure %s releases loading and shows an error without success audio", async status => {
    vi.mocked(axios.request).mockRejectedValue({ response: { status, data: status === 400 ? { error: "Insufficient snabel balance", missing: { snabelRed: 2, snabelBlue: 0, snabelYellow: 0 } } : { error: "Internal Server Error" } } });
    mount(<Shop />); await confirmPurchase();
    await waitFor(() => expect(screen.queryByText("جاري الشراء...")).not.toBeInTheDocument());
    if (status === 400) expect(screen.getByText("رصيد غير كافي")).toBeInTheDocument();
    else expect(screen.getByRole("alert")).not.toBeEmptyDOMElement();
    expect(state().water).toBe(0);
    expect(AudioManager.play).not.toHaveBeenCalledWith("success", true);
  });

  it("tree growth updates requirements before its celebration is dismissed", async () => {
    vi.mocked(axios.get).mockResolvedValue(profile({ water: 1, seeders: 1 }));
    vi.mocked(axios.request).mockResolvedValue({ status: 200, data: { student: { ...student, treeProgress: 2 }, treePoint: { id: 2, water: 2, seeders: 3, stage: 1 } } });
    mount(<Shop />);
    fireEvent.click(await screen.findByRole("button", { name: /كبر الشجرة/ }));
    await waitFor(() => expect(state().treeProgress).toBe(2));
    expect(state()).toMatchObject({ water: 0, fertilizer: 0, waterNeeded: 2, fertilizerNeeded: 3, treeStage: 1 });
    expect(AudioManager.play).toHaveBeenCalledWith("reward", true);
  });

  it("an already-completed retry reconciles its check without replaying rewards", async () => {
    vi.mocked(axios.request).mockResolvedValue({ status: 200, data: { alreadyCompleted: true, student: { ...student, xp: 15 }, completion: { taskId: 1, date } } });
    mount(); await confirmMission();
    await waitFor(() => expect(screen.getByTestId("complete-mission-1")).toHaveAttribute("aria-pressed", "true"));
    expect(state().xp).toBe(15);
    expect(AudioManager.play).not.toHaveBeenCalled();
  });

  it("refreshes an already-mounted challenge view after mission rewards commit", async () => {
    vi.mocked(axios.get).mockImplementation(async (url: any) => url.includes("student-trophy") ? { status: 200, data: { data: [] } } : url.includes("/users/session") ? { status: 200 } : profile());
    vi.mocked(axios.request).mockResolvedValue({ status: 201, data: { student: { ...student, xp: 5 }, completion: { taskId: 1, date } } });
    mount(<><TodoList /><ProgressTrophies /></>);
    await screen.findByTestId("complete-mission-1");
    const requests = () => vi.mocked(axios.get).mock.calls.filter(([url]) => String(url).includes("student-trophy")).length;
    await waitFor(() => expect(requests()).toBeGreaterThan(0));
    const before = requests();
    await confirmMission();
    await waitFor(() => expect(requests()).toBeGreaterThan(before));
  });

  it("a failed refresh preserves current balances and displays a retryable error", async () => {
    mount(null); await waitFor(() => expect(state()?.id).toBe(7));
    vi.mocked(axios.get).mockRejectedValueOnce({ code: "ECONNABORTED" });
    fireEvent.click(screen.getByText("refresh profile"));
    expect(await screen.findByRole("alert")).toHaveTextContent("انتهت مهلة الطلب");
    expect(state().snabelRed).toBe(100);
    expect(screen.getByText("إعادة المحاولة")).toBeInTheDocument();
  });

  it("out-of-order profile responses cannot replace the latest profile", async () => {
    mount(null); await waitFor(() => expect(state()?.id).toBe(7));
    const first = deferred(), second = deferred();
    vi.mocked(axios.get).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    fireEvent.click(screen.getByText("refresh profile"));
    fireEvent.click(screen.getByText("refresh profile"));
    await act(async () => second.resolve(profile({ xp: 15 })));
    await act(async () => first.resolve(profile({ xp: 5 })));
    expect(state().xp).toBe(15);
  });

  it("finishes reconciliation even if the mission page unmounts during the request", async () => {
    function Navigation() {
      const [visible, setVisible] = React.useState(true);
      return <><button onClick={() => setVisible(false)}>leave page</button>{visible && <TodoList />}</>;
    }
    const pending = deferred(); vi.mocked(axios.request).mockReturnValue(pending.promise);
    mount(<Navigation />); await confirmMission();
    fireEvent.click(screen.getByText("leave page"));
    await act(async () => pending.resolve({ status: 201, data: { student: { ...student, xp: 5 }, completion: { taskId: 1, date } } }));
    expect(state().xp).toBe(5);
    expect(state().completedTasks.taskIds).toEqual([1]);
    expect(AudioManager.play).toHaveBeenCalledWith("reward", true);
  });
});
