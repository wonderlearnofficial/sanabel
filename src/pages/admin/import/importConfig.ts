import { API_BASE_URL } from "../../../config/api";

export type WizardStep = "idle" | "parsing" | "reviewing" | "importing" | "done";

export interface ImportRow {
  index: number;
  data: Record<string, string>;
  status: "valid" | "warning" | "blocked";
  issues: string[];
  suggestion?: { field: string; value: string };
}

export interface BatchResult {
  successCount: number;
  failureCount: number;
  successfulEntries: any[];
  failedEntries: any[];
}

export interface TabImportConfig {
  endpoint: string;
  officialHeaders: string[];
  requiredFields: string[];
  hasOrg: boolean;
  hasClass: boolean;
  hasGrade: boolean;
  exampleRows: Record<string, string>[];
}

// One entry per importable tab (Users/Admins have no bulk-import concept).
export const IMPORT_CONFIGS: Record<string, TabImportConfig> = {
  students: {
    endpoint: `${API_BASE_URL}/students/add-student`,
    officialHeaders: ["id", "firstName", "lastName", "email", "grade", "school", "class"],
    requiredFields: ["firstName", "lastName", "email", "school", "class"],
    hasOrg: true,
    hasClass: true,
    hasGrade: true,
    exampleRows: [
      { id: "0", firstName: "John", lastName: "Doe", email: "johndoe@student.com", grade: "primary", school: "als", class: "red" },
      { id: "1", firstName: "Jane", lastName: "Smith", email: "janesmith@student.com", grade: "", school: "als", class: "blue" },
    ],
  },
  teachers: {
    endpoint: `${API_BASE_URL}/teachers/add-teacher`,
    officialHeaders: ["firstName", "lastName", "email", "school"],
    requiredFields: ["firstName", "lastName", "email", "school"],
    hasOrg: true,
    hasClass: false,
    hasGrade: false,
    exampleRows: [{ firstName: "Sara", lastName: "Ahmed", email: "sara.ahmed@teacher.com", school: "als" }],
  },
  parents: {
    endpoint: `${API_BASE_URL}/parents/add-parent`,
    officialHeaders: ["firstName", "lastName", "email"],
    requiredFields: ["firstName", "lastName", "email"],
    hasOrg: false,
    hasClass: false,
    hasGrade: false,
    exampleRows: [{ firstName: "Mona", lastName: "Ali", email: "mona.ali@parent.com" }],
  },
  organizations: {
    endpoint: `${API_BASE_URL}/organization/import`,
    officialHeaders: ["name"],
    requiredFields: ["name"],
    hasOrg: false,
    hasClass: false,
    hasGrade: false,
    exampleRows: [{ name: "als" }],
  },
  classes: {
    endpoint: `${API_BASE_URL}/class/import`,
    officialHeaders: ["classname", "school", "grade"],
    requiredFields: ["classname", "school"],
    hasOrg: true,
    hasClass: false,
    hasGrade: true,
    exampleRows: [{ classname: "red", school: "als", grade: "primary" }],
  },
  grades: {
    endpoint: `${API_BASE_URL}/admin/grades/import`,
    officialHeaders: ["name"],
    requiredFields: ["name"],
    hasOrg: false,
    hasClass: false,
    hasGrade: false,
    exampleRows: [{ name: "primary" }],
  },
};

export const IMPORTABLE_TABS = Object.keys(IMPORT_CONFIGS);
