// Shop balance math for the water/fertilizer store.
//
// The store charges the SAME total cost from EACH of the three sanabel
// colors — a purchase with total cost N needs N blue AND N red AND N yellow.
// Mirrors server/src/helpers/shopPricing.ts, which is the source of truth.

export interface SanabelCounts {
  blue: number;
  red: number;
  yellow: number;
}

export const computeMissingByColor = (
  totalCost: number,
  counts: SanabelCounts,
): SanabelCounts => ({
  blue: Math.max(0, totalCost - counts.blue),
  red: Math.max(0, totalCost - counts.red),
  yellow: Math.max(0, totalCost - counts.yellow),
});

export const hasAnyShortage = (missing: SanabelCounts): boolean =>
  missing.blue > 0 || missing.red > 0 || missing.yellow > 0;
