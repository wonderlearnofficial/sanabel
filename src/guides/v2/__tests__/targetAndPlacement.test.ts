import { describe, expect, it } from "vitest";
import {
  TARGET_FALLBACK_MS,
  TARGET_PARK_MS,
  TARGET_RETRY_MS,
  evaluateTargetLadder,
  missingTargetFallbackFor,
  nextLadderDeadline,
} from "../targetLadder";
import { computePlacement, overlapsTarget } from "../placement";
import { GuideStep } from "../types";

const readStep: GuideStep = { id: "read", titleKey: "t", descriptionKey: "d" };
const tapStep: GuideStep = {
  id: "tap",
  titleKey: "t",
  targetId: "mission-action",
  advanceOn: "interaction",
};
const spotlightStep: GuideStep = { id: "spot", titleKey: "t", targetId: "shop-water" };

describe("missing target ladder", () => {
  it("resolves immediately when the step has no target", () => {
    const state = evaluateTargetLadder({ step: readStep, targetFound: false, elapsedMs: 0 });
    expect(state.phase).toBe("resolved");
    expect(state.shouldPark).toBe(false);
  });

  it("resolves as soon as the element is found", () => {
    expect(
      evaluateTargetLadder({ step: spotlightStep, targetFound: true, elapsedMs: 9_999 }).phase,
    ).toBe("resolved");
  });

  it("waits, then retries, then falls back to a centred card", () => {
    const at = (elapsedMs: number) =>
      evaluateTargetLadder({ step: spotlightStep, targetFound: false, elapsedMs });
    expect(at(0).phase).toBe("waiting");
    expect(at(TARGET_RETRY_MS).phase).toBe("retry");
    expect(at(TARGET_FALLBACK_MS).phase).toBe("fallback");
    expect(at(TARGET_FALLBACK_MS).useCenteredFallback).toBe(true);
  });

  it("parks instead of hanging when the element never arrives", () => {
    const parked = evaluateTargetLadder({
      step: spotlightStep,
      targetFound: false,
      elapsedMs: TARGET_PARK_MS,
    });
    expect(parked.phase).toBe("parked");
    expect(parked.shouldPark).toBe(true);
    // A parked guide is never treated as understood — the provider ends it with
    // reason "target-missing", which the store refuses to record.
    expect(parked.useCenteredFallback).toBe(false);
  });

  it("never fakes an interaction: a tap step parks rather than showing a card", () => {
    expect(missingTargetFallbackFor(tapStep)).toBe("park");
    const at5s = evaluateTargetLadder({
      step: tapStep,
      targetFound: false,
      elapsedMs: TARGET_FALLBACK_MS,
    });
    expect(at5s.useCenteredFallback).toBe(false);
    expect(at5s.convertToNextButton).toBe(false);
    expect(
      evaluateTargetLadder({ step: tapStep, targetFound: false, elapsedMs: TARGET_PARK_MS })
        .shouldPark,
    ).toBe(true);
  });

  it("lets a step opt into the centred fallback explicitly", () => {
    const optIn: GuideStep = { ...tapStep, onMissingTarget: "center" };
    const state = evaluateTargetLadder({
      step: optIn,
      targetFound: false,
      elapsedMs: TARGET_FALLBACK_MS,
    });
    expect(state.useCenteredFallback).toBe(true);
    // The impossible tap becomes a Next button, so the step can still be read.
    expect(state.convertToNextButton).toBe(true);
  });

  it("arms a finite series of deadlines and then stops", () => {
    expect(nextLadderDeadline(0)).toBe(TARGET_RETRY_MS);
    expect(nextLadderDeadline(TARGET_RETRY_MS)).toBe(TARGET_FALLBACK_MS - TARGET_RETRY_MS);
    expect(nextLadderDeadline(TARGET_FALLBACK_MS)).toBe(TARGET_PARK_MS - TARGET_FALLBACK_MS);
    expect(nextLadderDeadline(TARGET_PARK_MS)).toBeNull();
  });
});

describe("tooltip placement", () => {
  const card = { width: 340, height: 180 };
  const viewports = [
    { name: "360x640", width: 360, height: 640 },
    { name: "390x667", width: 390, height: 667 },
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
  ];

  const withinViewport = (
    placement: { left: number; top: number; width: number },
    viewport: { width: number; height: number },
    height: number,
  ) =>
    placement.left >= 0 &&
    placement.top >= 0 &&
    placement.left + placement.width <= viewport.width &&
    placement.top + height <= viewport.height;

  viewports.forEach((viewport) => {
    it(`keeps the card on screen at ${viewport.name} in both directions`, () => {
      [false, true].forEach((isRTL) => {
        const targets = [
          { top: 8, left: 8, width: 120, height: 40 },
          { top: viewport.height / 2, left: viewport.width - 60, width: 50, height: 40 },
          { top: viewport.height - 60, left: 0, width: viewport.width, height: 56 },
        ];
        targets.forEach((target) => {
          const placement = computePlacement({ target, card, viewport, isRTL });
          expect(
            withinViewport(placement, viewport, card.height),
            `${viewport.name} rtl=${isRTL} top=${target.top}`,
          ).toBe(true);
        });
      });
    });
  });

  it("prefers below the target when there is room", () => {
    const placement = computePlacement({
      target: { top: 100, left: 100, width: 100, height: 40 },
      card,
      viewport: { width: 390, height: 844 },
      isRTL: false,
    });
    expect(placement.side).toBe("bottom");
    expect(placement.top).toBeGreaterThan(140);
  });

  it("flips above the target when the space below is taken", () => {
    const placement = computePlacement({
      target: { top: 700, left: 100, width: 100, height: 40 },
      card,
      viewport: { width: 390, height: 844 },
      isRTL: false,
      reservedBottom: 80,
    });
    expect(placement.side).toBe("top");
    expect(placement.top).toBeGreaterThanOrEqual(0);
  });

  it("mirrors the beside-placement for RTL on a short screen", () => {
    const target = { top: 200, left: 150, width: 60, height: 200 };
    const viewport = { width: 390, height: 420 };
    const tallCard = { width: 200, height: 300 };

    const ltr = computePlacement({ target, card: tallCard, viewport, isRTL: false });
    const rtl = computePlacement({ target, card: tallCard, viewport, isRTL: true });

    expect(["inline-start", "inline-end", "center"]).toContain(ltr.side);
    if (ltr.side === "inline-start" && rtl.side === "inline-start") {
      // Start side is left in LTR and right in RTL: the two must differ.
      expect(ltr.left).not.toBe(rtl.left);
    }
    [ltr, rtl].forEach((placement) => {
      expect(placement.left).toBeGreaterThanOrEqual(0);
      expect(placement.left + placement.width).toBeLessThanOrEqual(viewport.width);
    });
  });

  it("falls back to a centred card when nothing fits", () => {
    const placement = computePlacement({
      target: { top: 10, left: 0, width: 390, height: 380 },
      card: { width: 340, height: 360 },
      viewport: { width: 390, height: 420 },
      isRTL: false,
    });
    expect(placement.side).toBe("center");
    expect(placement.top).toBeGreaterThanOrEqual(0);
  });

  it("centres with no target and never goes negative on a tiny viewport", () => {
    const placement = computePlacement({
      target: null,
      card: { width: 340, height: 600 },
      viewport: { width: 360, height: 400 },
      isRTL: true,
    });
    expect(placement.side).toBe("center");
    expect(placement.top).toBeGreaterThanOrEqual(0);
    expect(placement.left).toBeGreaterThanOrEqual(0);
    expect(placement.width).toBeLessThanOrEqual(360);
  });

  it("respects safe-area insets", () => {
    const placement = computePlacement({
      target: { top: 30, left: 20, width: 100, height: 40 },
      card,
      viewport: { width: 390, height: 844, safeTop: 47, safeBottom: 34 },
      isRTL: false,
    });
    expect(placement.top).toBeGreaterThanOrEqual(0);
    expect(placement.top + card.height).toBeLessThanOrEqual(844 - 34);
  });

  it("does not cover the spotlight it belongs to", () => {
    const target = { top: 300, left: 100, width: 120, height: 44 };
    const viewport = { width: 390, height: 844 };
    const placement = computePlacement({ target, card, viewport, isRTL: false });
    expect(overlapsTarget(placement, target, card.height)).toBe(false);
  });
});
