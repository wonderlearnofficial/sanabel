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

// RFC4180-ish CSV parser: handles quoted fields (with embedded commas,
// escaped "" quotes, and embedded newlines) and CRLF/LF line endings. A plain
// `line.split(",")` breaks the moment any field — a school name, an address —
// contains a comma: every column after it shifts by one, which can garble the
// email column enough to fail validation and silently drop the whole row.
function parseCSVText(text: string): { headers: string[]; rows: string[][] } {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    table.push(row);
    row = [];
  };

  while (i < withoutBom.length) {
    const c = withoutBom[i];
    if (inQuotes) {
      if (c === '"') {
        if (withoutBom[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      endField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  // Last field/row (file may or may not end with a newline).
  if (field !== "" || row.length > 0) endRow();

  const nonEmpty = table.filter((r) => !(r.length === 1 && r[0] === ""));
  const headers = (nonEmpty[0] || []).map((h) => h.trim());
  const rows = nonEmpty.slice(1).map((r) => r.map((c) => c.trim()));
  return { headers, rows };
}

// Aliases per official field name. Mirrors the flexibility of the server's
// getImportField (server/src/helpers/importFieldLookup.ts) so a school's own
// column names ("First Name", "Student Email", ...) map automatically
// instead of asking the admin to map every column by hand. Keyed by field so
// resolution stays tab-aware — e.g. "classname" (a header) resolves to the
// Classes tab's own "classname" field, not the Students tab's "class" field,
// since aliases are only consulted against the active config's own fields.
const FIELD_ALIASES: Record<string, string[]> = {
  id: ["id"],
  firstName: ["firstname", "first name", "fname"],
  lastName: ["lastname", "last name", "lname"],
  email: ["email", "email address", "student email"],
  grade: ["grade", "grade level"],
  school: ["school", "school name", "organizationname", "organization"],
  class: ["class", "classname", "class name", "section"],
  classname: ["classname", "class name", "class"],
  name: ["name"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/_/g, " ");
}

// Maps a raw header row to the official field names a TabImportConfig
// expects. An exact (case-insensitive) match against the tab's own official
// field names always wins first; aliases are only consulted for headers that
// don't already match one of this tab's fields verbatim. Unrecognized
// headers are dropped (informational, not blocking — matches the "only ask
// about unknown columns" spec, simplified to "ignore them" since every
// current tab's official fields are all inferable).
function mapHeaders(headers: string[], officialHeaders: string[]): (string | null)[] {
  return headers.map((h) => {
    const norm = normalizeHeader(h);
    const exact = officialHeaders.find((f) => f.toLowerCase() === norm);
    if (exact) return exact;
    for (const field of officialHeaders) {
      if ((FIELD_ALIASES[field] || []).includes(norm)) return field;
    }
    return null;
  });
}

export async function parseImportFile(
  file: File,
  officialHeaders: string[],
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
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

  const mapped = mapHeaders(rawHeaders, officialHeaders);
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

// `headers` here are already-resolved official field names (parseImportFile's
// return value), so this just checks every required field was recognized.
export function isOfficialTemplate(headers: string[], config: TabImportConfig): boolean {
  return config.requiredFields.every((f) => headers.includes(f));
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

export function buildBatches(
  rows: ImportRow[],
  config: TabImportConfig,
  batchSize = 50,
): { blob: Blob; rows: Record<string, string>[] }[] {
  const importable = rows.filter((r) => r.status !== "blocked").map((r) => r.data);
  const batches: { blob: Blob; rows: Record<string, string>[] }[] = [];
  for (let i = 0; i < importable.length; i += batchSize) {
    const chunk = importable.slice(i, i + batchSize);
    const csv = arrayToCSV(chunk, config.officialHeaders);
    batches.push({ blob: new Blob([csv], { type: "text/csv" }), rows: chunk });
  }
  return batches;
}

export function buildTemplateCsv(config: TabImportConfig): string {
  return arrayToCSV([], config.officialHeaders);
}

export function buildExampleCsv(config: TabImportConfig): string {
  return arrayToCSV(config.exampleRows, config.officialHeaders);
}
