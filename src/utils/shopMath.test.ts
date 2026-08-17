import { describe, expect, it } from "vitest";
import { computeMissingByColor, hasAnyShortage } from "./shopMath";

describe("computeMissingByColor", () => {
  it("reports no shortage when every color covers the total cost", () => {
    // Regression: 27/28/29 coins buying 1 water (cost 10 per color) is
    // affordable — the old pooled-budget logic produced an empty "required"
    // list while the purchase was still rejected as insufficient.
    const missing = computeMissingByColor(10, { blue: 27, red: 28, yellow: 29 });

    expect(missing).toEqual({ blue: 0, red: 0, yellow: 0 });
    expect(hasAnyShortage(missing)).toBe(false);
  });

  it("reports a shortage only for the colors that fall short", () => {
    const missing = computeMissingByColor(20, { blue: 5, red: 20, yellow: 0 });

    expect(missing).toEqual({ blue: 15, red: 0, yellow: 20 });
    expect(hasAnyShortage(missing)).toBe(true);
  });

  it("requires the full cost from every color, not a pooled total", () => {
    // 30 blue cannot subsidize red/yellow: each color owes the full 25.
    const missing = computeMissingByColor(25, { blue: 30, red: 10, yellow: 24 });

    expect(missing).toEqual({ blue: 0, red: 15, yellow: 1 });
  });
});
