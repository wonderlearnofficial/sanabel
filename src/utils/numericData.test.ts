import { describe, expect, it } from "vitest";
import {
  normalizeCategoryCounts,
  TASK_CATEGORY_TITLES,
  toFiniteNumber,
} from "./numericData";

describe("numeric API normalization", () => {
  it("never exposes NaN for missing or invalid values", () => {
    expect(toFiniteNumber(undefined)).toBe(0);
    expect(toFiniteNumber("NaN")).toBe(0);
    expect(toFiniteNumber(Infinity)).toBe(0);
    expect(toFiniteNumber("12")).toBe(12);
  });

  it("fills all four task categories when the API returns an empty object", () => {
    const counts = normalizeCategoryCounts({});

    expect(Object.keys(counts)).toEqual(TASK_CATEGORY_TITLES);
    expect(Object.values(counts)).toEqual([0, 0, 0, 0]);
  });
});
