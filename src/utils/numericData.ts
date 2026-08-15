export const TASK_CATEGORY_TITLES = [
  "سنابل الإحسان في العلاقة مع الله",
  "سنابل الإحسان في العلاقة مع النفس",
  "سنابل الإحسان في العلاقة مع الأسرة والمجتمع",
  "سنابل الإحسان في العلاقة مع الأرض والكون",
] as const;

export type TaskCategoryTitle = (typeof TASK_CATEGORY_TITLES)[number];
export type CategoryCounts = Record<TaskCategoryTitle, number>;

export const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeCategoryCounts = (value: unknown): CategoryCounts => {
  const source = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

  return TASK_CATEGORY_TITLES.reduce((counts, title) => {
    counts[title] = toFiniteNumber(source[title]);
    return counts;
  }, {} as CategoryCounts);
};
