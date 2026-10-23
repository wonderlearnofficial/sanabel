import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MissionConfirmationModal, { StudentData, Task } from "./MissionConfirmationModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}(${Object.values(vars).join(",")})` : key,
  }),
}));

vi.mock("../../../components/PrimaryButton", () => ({
  default: ({ text, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

vi.mock("../../student/tutorial/GetAvatar", () => ({
  default: () => <img alt="avatar" />,
}));

const mockTask: Task = {
  id: 1,
  type: "الصلاة",
  title: "أداء صلاة الفجر في وقتها مع الجماعة أو في أول الوقت",
  description: "وصف المهمة",
  xp: 10,
  snabelBlue: 2,
  snabelRed: 1,
  snabelYellow: 3,
};

const createMockStudents = (count: number): StudentData[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    userId: 100 + index,
    user: {
      id: 100 + index,
      userId: 100 + index,
      firstName: `Student${index + 1}`,
      lastName: `Al-Test`,
      profileImg: null,
    },
    Class: {
      id: 1,
      classname: "Class A",
      grade: "Grade 4",
    },
    organization: {
      id: 1,
      name: "Al-Amal School",
    },
  }));
};

describe("MissionConfirmationModal UI Resilience & Scale", () => {
  it("renders empty state and disables Confirm when 0 students are selected", () => {
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={mockTask}
        selectedStudents={[]}
        onRemoveStudent={vi.fn()}
        action="assign"
      />
    );

    expect(screen.getByText("لم يتم اختيار أي طالب")).toBeInTheDocument();
    expect(screen.getByTestId("selected-count-badge")).toHaveTextContent("0");

    const confirmBtn = screen.getByText("تأكيد").closest("button");
    expect(confirmBtn).toBeDisabled();
  });

  it("renders 1 student cleanly with correct count and details", () => {
    const students = createMockStudents(1);
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={mockTask}
        selectedStudents={students}
        onRemoveStudent={vi.fn()}
        action="assign"
      />
    );

    expect(screen.getByText("Student1 Al-Test")).toBeInTheDocument();
    expect(screen.getByTestId("selected-count-badge")).toHaveTextContent("1");
    expect(screen.queryByPlaceholderText("ابحث في الطلاب المختارين...")).not.toBeInTheDocument();

    const confirmBtn = screen.getByText("تأكيد").closest("button");
    expect(confirmBtn).not.toBeDisabled();
  });

  it("renders 3 students without search bar", () => {
    const students = createMockStudents(3);
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={mockTask}
        selectedStudents={students}
        onRemoveStudent={vi.fn()}
        action="assign"
      />
    );

    expect(screen.getByTestId("selected-count-badge")).toHaveTextContent("3");
    expect(screen.getByText("Student1 Al-Test")).toBeInTheDocument();
    expect(screen.getByText("Student2 Al-Test")).toBeInTheDocument();
    expect(screen.getByText("Student3 Al-Test")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("ابحث في الطلاب المختارين...")).not.toBeInTheDocument();
  });

  it("renders search bar when student count is >= 8 (tested with 10 students)", () => {
    const students = createMockStudents(10);
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={mockTask}
        selectedStudents={students}
        onRemoveStudent={vi.fn()}
        action="assign"
      />
    );

    expect(screen.getByTestId("selected-count-badge")).toHaveTextContent("10");
    const searchInput = screen.getByPlaceholderText("ابحث في الطلاب المختارين...");
    expect(searchInput).toBeInTheDocument();

    // Filter by name
    fireEvent.change(searchInput, { target: { value: "Student10" } });
    expect(screen.getByText("Student10 Al-Test")).toBeInTheDocument();
    expect(screen.queryByText("Student1 Al-Test")).not.toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByLabelText("مسح");
    fireEvent.click(clearBtn);
    expect(screen.getByText("Student1 Al-Test")).toBeInTheDocument();
  });

  it("scales to 50 students: renders bounded list, supports removal by student ID, and keeps footer accessible", () => {
    const onRemove = vi.fn();
    const students = createMockStudents(50);
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={mockTask}
        selectedStudents={students}
        onRemoveStudent={onRemove}
        action="complete"
      />
    );

    expect(screen.getByTestId("selected-count-badge")).toHaveTextContent("50");
    expect(screen.getByText("Student1 Al-Test")).toBeInTheDocument();
    expect(screen.getByText("Student50 Al-Test")).toBeInTheDocument();

    // Remove student 5
    const removeBtn = screen.getByLabelText("إزالة Student5 Al-Test");
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith(5);

    // Cancel and Confirm buttons are still rendered and reachable
    expect(screen.getByText("إلغاء")).toBeInTheDocument();
    expect(screen.getByText("تأكيد")).toBeInTheDocument();
  });

  it("scales to 100 students without crashing and keeps action buttons in DOM", () => {
    const students = createMockStudents(100);
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={mockTask}
        selectedStudents={students}
        onRemoveStudent={vi.fn()}
        action="assign"
      />
    );

    expect(screen.getByTestId("selected-count-badge")).toHaveTextContent("100");
    expect(screen.getByText("Student100 Al-Test")).toBeInTheDocument();
    expect(screen.getByText("تأكيد")).not.toBeDisabled();
    expect(screen.getByText("إلغاء")).not.toBeDisabled();
  });

  it("enforces idempotency: disables buttons and shows loading spinner when isSubmitting is true", () => {
    const students = createMockStudents(3);
    const onConfirm = vi.fn();
    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        selectedTask={mockTask}
        selectedStudents={students}
        onRemoveStudent={vi.fn()}
        action="assign"
        isSubmitting={true}
      />
    );

    const submitBtn = screen.getByText("جارٍ التسجيل...").closest("button");
    expect(submitBtn).toBeDisabled();

    // Clicking does not call onConfirm
    fireEvent.click(submitBtn!);
    expect(onConfirm).not.toHaveBeenCalled();

    const cancelBtn = screen.getByText("إلغاء").closest("button");
    expect(cancelBtn).toBeDisabled();
  });

  it("handles extreme long student names and long mission titles gracefully", () => {
    const longStudent: StudentData = {
      id: 999,
      userId: 999,
      user: {
        id: 999,
        firstName: "عبدالرحمن محمد عبدالرحمن مصطفى السيد الأحمدي الشافعي",
        lastName: "المصري الطويل جدا جدا جدا جدا",
      },
      Class: {
        classname: "فصل النخبة المتفوقون رقم 104 المتقدم",
        grade: "المرحلة الثانوية المتقدمة بنين",
      },
      organization: {
        name: "مدرسة سنابل الإحسان النموذجية الدولية للغات والعلوم المتقدمة",
      },
    };

    const longTask: Task = {
      id: 99,
      type: "العلم والتعلم",
      title:
        "قراءة وتلخيص كتاب كامل في السيرة النبوية الشريفة يتجاوز مائتي صفحة مع كتابة الدروس المستفادة ومشاركتها مع زملاء الفصل والمعلم في الإذاعة الصباحية للمدرسة",
      xp: 9999,
      snabelBlue: 999,
      snabelRed: 999,
      snabelYellow: 999,
    };

    render(
      <MissionConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        selectedTask={longTask}
        selectedStudents={[longStudent]}
        onRemoveStudent={vi.fn()}
        action="complete"
      />
    );

    expect(screen.getByText("تأكيد تسجيل المهمة")).toBeInTheDocument();
    expect(screen.getByText(longTask.title)).toBeInTheDocument();
    expect(
      screen.getByText("عبدالرحمن محمد عبدالرحمن مصطفى السيد الأحمدي الشافعي المصري الطويل جدا جدا جدا جدا"),
    ).toBeInTheDocument();
    expect(screen.getByText("تأكيد")).toBeInTheDocument();
  });
});
