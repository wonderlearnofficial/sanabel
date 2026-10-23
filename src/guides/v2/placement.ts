// Tooltip placement, computed from measured geometry rather than a guessed
// card height (the Phase 0 overlay assumed 180px, which clipped long Arabic copy
// on 640px-tall devices).
//
// Pure and synchronous so it can be unit-tested at every supported viewport:
// 360x640, 390x667, 390x844, 768x1024.

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
  safeTop?: number;
  safeBottom?: number;
}

export type PlacementSide = "top" | "bottom" | "inline-start" | "inline-end" | "center";

export interface PlacementInput {
  target: Rect | null;
  card: { width: number; height: number };
  viewport: Viewport;
  isRTL: boolean;
  /** Reserved space at the bottom of the screen (mobile navigation bar). */
  reservedBottom?: number;
}

export interface PlacementResult {
  side: PlacementSide;
  left: number;
  top: number;
  width: number;
}

export const SPOTLIGHT_PADDING = 6;
const GAP = 8;
const EDGE = 12;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

const cardWidthFor = (viewport: Viewport, requested: number): number =>
  Math.min(requested, Math.max(200, viewport.width - EDGE * 2));

const centred = (input: PlacementInput): PlacementResult => {
  const width = cardWidthFor(input.viewport, input.card.width);
  const safeTop = input.viewport.safeTop ?? 0;
  const safeBottom = (input.viewport.safeBottom ?? 0) + (input.reservedBottom ?? 0);
  const usable = input.viewport.height - safeTop - safeBottom;
  const top =
    input.card.height >= usable
      ? safeTop + EDGE
      : safeTop + Math.max(EDGE, (usable - input.card.height) / 2);
  return {
    side: "center",
    left: (input.viewport.width - width) / 2,
    top,
    width,
  };
};

/**
 * Picks the first placement that fits: below the target, above it, then beside
 * it on the reading-start/end side, then a centred card. The card never leaves
 * the viewport and never covers the spotlighted element.
 */
export const computePlacement = (input: PlacementInput): PlacementResult => {
  const { target, viewport, card } = input;
  if (!target) return centred(input);

  const width = cardWidthFor(viewport, card.width);
  const safeTop = viewport.safeTop ?? 0;
  const safeBottom = (viewport.safeBottom ?? 0) + (input.reservedBottom ?? 0);
  const minTop = safeTop + EDGE;
  const maxTop = viewport.height - safeBottom - EDGE - card.height;

  const spotTop = target.top - SPOTLIGHT_PADDING;
  const spotBottom = target.top + target.height + SPOTLIGHT_PADDING;

  const fitsBelow = spotBottom + GAP + card.height <= viewport.height - safeBottom - EDGE;
  const fitsAbove = spotTop - GAP - card.height >= minTop;

  const horizontalCentre = clamp(
    target.left + target.width / 2 - width / 2,
    EDGE,
    Math.max(EDGE, viewport.width - width - EDGE),
  );

  if (fitsBelow) {
    return { side: "bottom", left: horizontalCentre, top: spotBottom + GAP, width };
  }
  if (fitsAbove) {
    return { side: "top", left: horizontalCentre, top: spotTop - GAP - card.height, width };
  }

  // Vertical space is exhausted (short screens, tall cards). Try beside the
  // target, preferring the reading-start side so the card does not cover the
  // control the user is being asked to use.
  const startSideLeft = input.isRTL
    ? target.left + target.width + SPOTLIGHT_PADDING + GAP
    : target.left - SPOTLIGHT_PADDING - GAP - width;
  const endSideLeft = input.isRTL
    ? target.left - SPOTLIGHT_PADDING - GAP - width
    : target.left + target.width + SPOTLIGHT_PADDING + GAP;

  const verticalBeside = clamp(
    target.top + target.height / 2 - card.height / 2,
    minTop,
    maxTop,
  );

  if (startSideLeft >= EDGE && startSideLeft + width <= viewport.width - EDGE) {
    return { side: "inline-start", left: startSideLeft, top: verticalBeside, width };
  }
  if (endSideLeft >= EDGE && endSideLeft + width <= viewport.width - EDGE) {
    return { side: "inline-end", left: endSideLeft, top: verticalBeside, width };
  }

  return centred(input);
};

/** True when a computed card would overlap the spotlight it belongs to. */
export const overlapsTarget = (
  placement: PlacementResult,
  target: Rect,
  cardHeight: number,
): boolean => {
  const cardBottom = placement.top + cardHeight;
  const cardRight = placement.left + placement.width;
  const targetBottom = target.top + target.height + SPOTLIGHT_PADDING;
  const targetRight = target.left + target.width + SPOTLIGHT_PADDING;
  const targetTop = target.top - SPOTLIGHT_PADDING;
  const targetLeft = target.left - SPOTLIGHT_PADDING;
  return (
    placement.top < targetBottom &&
    cardBottom > targetTop &&
    placement.left < targetRight &&
    cardRight > targetLeft
  );
};
