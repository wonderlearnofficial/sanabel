import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentsList from "./StudentsList";

// Regression tests for teacher/parent student selection.
//
// The selected-student list was previously resolved positionally
// (`index === id - 1`) while the selection state holds real database ids, so
// the confirmation dialog listed nobody and the remove buttons did nothing.
// These tests pin the id-based behaviour with ids that are deliberately not
// 1..N, which is the case a positional lookup passes by accident.

// Keys are returned verbatim, with any interpolation values appended, so an
// assertion can see both the key and the numbers it was given.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (value: string, vars?: Record<string, unknown>) =>
      vars ? `${value}(${Object.values(vars).join(",")})` : value,
  }),
}));
vi.mock("../../../components/navbar/StudentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../../components/navbar/TeacherNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../../components/navbar/ParentNavbar", () => ({ default: () => <nav /> }));
vi.mock("../../../components/GoBackButton", () => ({ default: () => <button>back</button> }));
vi.mock("../../../components/PrimaryButton", () => ({
  default: ({ text, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{text}</button>
  ),
}));
vi.mock("../../student/tutorial/GetAvatar", () => ({ default: () => <img alt="avatar" /> }));
vi.mock("../../../guides/useAutoStartGuide", () => ({ useAutoStartGuide: () => undefined }));
vi.mock("react-toastify", () => ({
  ToastContainer: () => <div />,
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const students = [
  {
    id: 27,
    userId: 108,
    user: { id: 108, userId: 108, firstName: "Omar", lastName: "Ahmed", profileImg: null },
    Class: { id: 4, classname: "Class 4A", grade: "Grade 4" },
    organization: { id: 3, name: "Nawah" },
  },
  {
    id: 31,
    userId: 109,
    user: { id: 109, userId: 109, firstName: "Layla", lastName: "Ahmed", profileImg: null },
    Class: { id: 4, classname: "Class 4A", grade: "Grade 4" },
    organization: { id: 3, name: "Nawah" },
  },
];

describe("Teacher/Parent student selection", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "Teacher");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          String(url).includes("appear-student")
            ? { data: students }
            : {
                data: [
                  {
                    id: 77,
                    title: "Morning prayer",
                    description: "fixture",
                    type: "الصلاة",
                    categoryId: 1,
                    xp: 5,
                    snabelRed: 1,
                    snabelBlue: 1,
                    snabelYellow: 2,
                  },
                ],
              },
      })) as any,
    );
  });

  const selectBoth = async () => {
    render(<StudentsList />);
    await waitFor(() => expect(screen.getByText("Omar Ahmed")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Omar Ahmed"));
    fireEvent.click(screen.getByText("Layla Ahmed"));
  };

  it("marks only the rows that were actually tapped", async () => {
    render(<StudentsList />);
    await waitFor(() => expect(screen.getByText("Omar Ahmed")).toBeInTheDocument());

    const rows = screen.getAllByRole("checkbox");
    expect(rows.every((row) => row.getAttribute("aria-checked") === "false")).toBe(true);

    fireEvent.click(screen.getByText("Omar Ahmed"));

    const [omarRow, laylaRow] = screen.getAllByRole("checkbox");
    expect(omarRow.getAttribute("aria-checked")).toBe("true");
    expect(laylaRow.getAttribute("aria-checked")).toBe("false");
  });

  it("counts the selection and offers select all / clear", async () => {
    render(<StudentsList />);
    await waitFor(() => expect(screen.getByText("Omar Ahmed")).toBeInTheDocument());
    expect(screen.getByText("students.selectedOfTotal(0,2)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("تحديد الكل"));
    expect(screen.getByText("students.selectedOfTotal(2,2)")).toBeInTheDocument();
    expect(
      screen.getAllByRole("checkbox").every((row) => row.getAttribute("aria-checked") === "true"),
    ).toBe(true);

    fireEvent.click(screen.getByText("مسح الكل"));
    expect(screen.getByText("students.selectedOfTotal(0,2)")).toBeInTheDocument();
  });

  it("carries the tapped students into the category step summary", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));

    const summary = screen.getByText("الطلاب المختارون").closest("section") as HTMLElement;
    expect(within(summary).getByText("2")).toBeInTheDocument();
    expect(within(summary).getByText("Omar")).toBeInTheDocument();
    expect(within(summary).getByText("Layla")).toBeInTheDocument();
  });

  it("uses one natural page scroll and does not render a detached progress bar", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));

    const page = document.querySelector("#page-height") as HTMLElement;
    expect(page.className).toContain("overflow-y-auto");
    expect(page.querySelectorAll("[class~='overflow-y-auto']")).toHaveLength(0);
    expect(screen.queryByText("mission.step.category")).not.toBeInTheDocument();
  });

  it("selects a category without leaving the step, and gates the CTA on it", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));

    // The page opens in direct-completion mode, so that is the CTA label here.
    const cta = screen.getByText("متابعة لتسجيل المهمة");
    expect(cta).toBeDisabled();

    const card = screen
      .getByText("سنابل الإحسان في العلاقة مع الله")
      .closest("button") as HTMLElement;
    expect(card.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(card);

    // Still on the category step, now with a visible selection.
    expect(card.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radiogroup", { name: "اختر فئة المهمة" })).toBeInTheDocument();
    expect(screen.getByText("متابعة لتسجيل المهمة")).not.toBeDisabled();
  });

  it("labels the CTA for the chosen action mode", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));

    // The page defaults to direct completion.
    expect(screen.getByText("متابعة لتسجيل المهمة")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Assign Mission"));
    expect(screen.getByText("متابعة لاختيار المهمة")).toBeInTheDocument();

    const assign = screen.getByText("Assign Mission").closest("button") as HTMLElement;
    const complete = screen
      .getByText("Register Completed Mission")
      .closest("button") as HTMLElement;
    expect(assign.getAttribute("aria-checked")).toBe("true");
    expect(complete.getAttribute("aria-checked")).toBe("false");
  });

  it("returns to student selection from تغيير الطلاب, keeping the selection", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));
    fireEvent.click(screen.getByText("تغيير الطلاب"));

    expect(screen.getByText("students.selectedOfTotal(2,2)")).toBeInTheDocument();
    expect(
      screen.getAllByRole("checkbox").every((row) => row.getAttribute("aria-checked") === "true"),
    ).toBe(true);
  });

  it("lists the selected students, with grade and class, in the confirmation dialog", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));

    // Walk the real path: category, continue, type, mission, then register.
    fireEvent.click(screen.getByText("سنابل الإحسان في العلاقة مع الله"));
    fireEvent.click(screen.getByText("متابعة لتسجيل المهمة"));
    fireEvent.click(await screen.findByText("الصلاة"));
    fireEvent.click(await screen.findByText("Morning prayer"));
    fireEvent.click(screen.getByText("تسجيل"));

    const dialog = (await screen.findByText("تأكيد تسجيل المهمة")).closest("div")
      ?.parentElement as HTMLElement;
    expect(within(dialog).getByText("Omar Ahmed")).toBeInTheDocument();
    expect(within(dialog).getByText("Layla Ahmed")).toBeInTheDocument();
    expect(
      within(dialog).getAllByText("Grade 4 · Class 4A · Nawah"),
    ).toHaveLength(2);
  });

  it("removes a student by id when the remove control is used", async () => {
    await selectBoth();
    fireEvent.click(screen.getByText("متابعة (2)"));
    const summary = screen.getByText("الطلاب المختارون").closest("section") as HTMLElement;
    expect(within(summary).getByText("2")).toBeInTheDocument();

    fireEvent.click(within(summary).getByLabelText("إزالة Omar"));

    await waitFor(() =>
      expect(within(summary).getByText("1")).toBeInTheDocument(),
    );
    expect(within(summary).queryByText("Omar")).not.toBeInTheDocument();
    expect(within(summary).getByText("Layla")).toBeInTheDocument();
  });
});
