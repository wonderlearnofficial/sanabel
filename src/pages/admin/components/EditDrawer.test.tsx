import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditDrawer } from "./EditDrawer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

const grades = [
  { id: 10, name: "grade-4", organizationId: 1 },
  { id: 20, name: "foreign-grade", organizationId: 2 },
  { id: 30, name: "shared-grade", organizationId: null },
];

const classes = [
  { id: 100, classname: "4A", grade: "grade-4", organizationId: 1, gradeId: 10 },
  { id: 101, classname: "Legacy ungraded", grade: "", organizationId: 1, gradeId: null },
  { id: 200, classname: "Foreign", grade: "foreign-grade", organizationId: 2, gradeId: 20 },
];

function Harness() {
  const [organizationId, setOrganizationId] = useState("1");
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);

  return (
    <EditDrawer
      activeTab="students"
      editingRow={{ id: 7 }}
      onClose={() => undefined}
      onSave={() => undefined}
      isSaving={false}
      accentColor="#000"
      editFirstName="Imported"
      setEditFirstName={() => undefined}
      editLastName="Student"
      setEditLastName={() => undefined}
      editEmail="imported@example.com"
      setEditEmail={() => undefined}
      editGrade={gradeId}
      setEditGrade={setGradeId}
      editOrgId={organizationId}
      setEditOrgId={setOrganizationId}
      editClassId={classId}
      setEditClassId={setClassId}
      editClassIds={classIds}
      setEditClassIds={setClassIds}
      addClassGradeFilter=""
      setAddClassGradeFilter={() => undefined}
      classToAdd=""
      setClassToAdd={() => undefined}
      editClassName=""
      setEditClassName={() => undefined}
      editOrgName=""
      setEditOrgName={() => undefined}
      editGradeName=""
      setEditGradeName={() => undefined}
      gradesList={grades}
      organizations={[
        { id: 1, name: "School A" },
        { id: 2, name: "School B" },
      ]}
      classesOptions={classes}
    />
  );
}

describe("Admin Student relationship repair", () => {
  it("bulk imported student can be repaired with grade/class from Admin edit", () => {
    render(<Harness />);

    const gradeSelect = screen.getByTestId("student-grade-select");
    expect(gradeSelect).toHaveValue("");
    expect(screen.getByRole("option", { name: "grade-4" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "shared-grade" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "foreign-grade" })).not.toBeInTheDocument();

    // With no Grade yet, all classes in the selected Organization remain
    // available. Selecting a graded Class derives its Grade by database ID.
    const classSelect = screen.getByTestId("student-class-select");
    expect(screen.getByRole("option", { name: "4A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Legacy ungraded" })).toBeInTheDocument();
    fireEvent.change(classSelect, { target: { value: "100" } });
    expect(gradeSelect).toHaveValue("10");
    expect(classSelect).toHaveValue("100");

    // A tenant change clears both dependent IDs, preventing a stale foreign
    // Class or Grade from being submitted.
    fireEvent.change(screen.getByTestId("student-organization-select"), {
      target: { value: "2" },
    });
    expect(gradeSelect).toHaveValue("");
    expect(classSelect).toHaveValue("");
  });
});
