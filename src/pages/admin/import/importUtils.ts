import * as XLSX from "xlsx";
import { ImportRow, TabImportConfig } from "./importConfig";

// Small, self-contained CSV helpers (deliberately not imported from
// UserData.tsx — that file will import this wizard, so importing back from
// it would create a circular dependency).
function escapeCsvCell(val: any): string {
  if (val == null) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export function arrayToCSV(rows: Record<string, any>[], headers: string[]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  return lines.join("\n");
}

function parseCSVText(text: string): { headers: string[]; rows: string[][] } {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = withoutBom.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  return { headers, rows };
}

// Header aliases → official field name. Mirrors the flexibility of the
// server's getImportField (server/src/helpers/importFieldLookup.ts) so a
// school's own column names ("First Name", "Student Email", ...) map
// automatically instead of asking the admin to map every column by hand.
const HEADER_ALIASES: Record<string, string> = {
  id: "id",
  firstname: "firstName", "first name": "firstName", fname: "firstName",
  lastname: "lastName", "last name": "lastName", lname: "lastName",
  email: "email", "email address": "email", "student email": "email",
  grade: "grade", "grade level": "grade",
  school: "school", "school name": "school", organizationname: "school", organization: "school",
  class: "class", classname: "class", "class name": "class", section: "class",
  name: "name",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/_/g, " ");
}

// Maps a raw header row to the official field names a TabImportConfig
// expects. Unrecognized headers are dropped (informational, not blocking —
// matches the "only ask about unknown columns" spec, simplified to "ignore
// them" since every current tab's official fields are all inferable).
function mapHeaders(headers: string[]): (string | null)[] {
  return headers.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);
}

export async function parseImportFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const isXlsx = /\.xlsx?$/i.test(file.name);

  let rawHeaders: string[];
  let rawRows: string[][];

  if (isXlsx) {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    rawHeaders = (data[0] || []).map(String);
    rawRows = data.slice(1).map((r) => r.map((c) => (c == null ? "" : String(c))));
  } else {
    const text = await file.text();
    const parsed = parseCSVText(text);
    rawHeaders = parsed.headers;
    rawRows = parsed.rows;
  }

  const mapped = mapHeaders(rawHeaders);
  const rows = rawRows
    .filter((r) => r.some((c) => c && c.trim() !== "")) // ignore empty rows
    .map((r) => {
      const obj: Record<string, string> = {};
      mapped.forEach((field, i) => {
        if (field) obj[field] = (r[i] || "").trim();
      });
      return obj;
    });

  return { headers: mapped.filter((m): m is string => !!m), rows };
}

export function isOfficialTemplate(headers: string[], config: TabImportConfig): boolean {
  const normalized = headers.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? normalizeHeader(h));
  return config.requiredFields.every((f) => normalized.includes(f));
}

// Small Levenshtein distance, no new npm dependency — used to suggest
// "Did you mean '<existing name>'?" for near-typo school/class/grade names.
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function suggestMatch(value: string, candidates: string[]): string | null {
  const v = value.trim().toLowerCase();
  if (!v || candidates.length === 0) return null;
  if (candidates.some((c) => c.toLowerCase() === v)) return null; // exact match, no suggestion needed
  let best: { name: string; dist: number } | null = null;
  for (const c of candidates) {
    const dist = levenshtein(v, c.toLowerCase());
    if (dist <= 2 && (!best || dist < best.dist)) best = { name: c, dist };
  }
  return best?.name ?? null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validates the parsed rows client-side, catching things the server either
// can't (intra-file duplicate emails — the server only checks one row at a
// time against the DB) or that are better surfaced before upload (fuzzy
// school/class/grade suggestions). Unknown school/class/grade is a warning,
// not a blocking error — the backend auto-creates them.
export function validateRows(
  rows: Record<string, string>[],
  config: TabImportConfig,
  refs: { organizations: string[]; classes: string[]; grades: string[] },
): ImportRow[] {
  const seenEmails = new Set<string>();

  return rows.map((data, index) => {
    const issues: string[] = [];
    let status: ImportRow["status"] = "valid";
    let suggestion: ImportRow["suggestion"];

    for (const field of config.requiredFields) {
      if (!data[field]) {
        issues.push(`Missing ${field}`);
        status = "blocked";
      }
    }

    if (data.email) {
      if (!EMAIL_RE.test(data.email)) {
        issues.push("Invalid email format");
        status = "blocked";
      } else {
        const key = data.email.toLowerCase();
        if (seenEmails.has(key)) {
          issues.push("Duplicate email in this file");
          status = "blocked";
        }
        seenEmails.add(key);
      }
    }

    if (config.hasOrg && data.school) {
      const s = suggestMatch(data.school, refs.organizations);
      if (s) {
        issues.push(`New school "${data.school}" — did you mean "${s}"?`);
        if (status === "valid") status = "warning";
        suggestion = { field: "school", value: s };
      }
    }
    if (config.hasClass && data.class) {
      const s = suggestMatch(data.class, refs.classes);
      if (s) {
        issues.push(`New class "${data.class}" — did you mean "${s}"?`);
        if (status === "valid") status = "warning";
        suggestion = suggestion ?? { field: "class", value: s };
      }
    }
    if (config.hasGrade && data.grade) {
      const s = suggestMatch(data.grade, refs.grades);
      if (s) {
        issues.push(`New grade "${data.grade}" — did you mean "${s}"?`);
        if (status === "valid") status = "warning";
        suggestion = suggestion ?? { field: "grade", value: s };
      }
    }

    return { index, data, status, issues, suggestion };
  });
}

export function buildBatches(rows: ImportRow[], config: TabImportConfig, batchSize = 50): Blob[] {
  const importable = rows.filter((r) => r.status !== "blocked").map((r) => r.data);
  const batches: Blob[] = [];
  for (let i = 0; i < importable.length; i += batchSize) {
    const chunk = importable.slice(i, i + batchSize);
    const csv = arrayToCSV(chunk, config.officialHeaders);
    batches.push(new Blob([csv], { type: "text/csv" }));
  }
  return batches;
}

export function buildTemplateCsv(config: TabImportConfig): string {
  return arrayToCSV([], config.officialHeaders);
}

export function buildExampleCsv(config: TabImportConfig): string {
  return arrayToCSV(config.exampleRows, config.officialHeaders);
}
