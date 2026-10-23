import { GuideStep, MissingTargetFallback } from "./types";

// Finite target resolution. No V2 guide may hang invisibly with an active guide
// held forever — the Phase 0 failure mode (`if (targetId && !rect) return null`
// plus an unbounded poll).
//
// Tiers, from docs/TUTORIAL_V2_DESIGN.md §42, restated as a deterministic state
// machine so fake timers can drive every transition:
//
//   0 -  2500 ms  waiting   : re-measure; the element may still be mounting
//   2500 ms       retry     : one more observation window
//   5000 ms       fallback  : centred card, or park when the step needs the
//                             real element to be tapped
//   8000 ms       park      : give up on this entry, keep the guide unseen
//
// Parking clears the active guide, so nothing is starved behind it.

export const TARGET_RETRY_MS = 2_500;
export const TARGET_FALLBACK_MS = 5_000;
export const TARGET_PARK_MS = 8_000;

export type TargetPhase = "resolved" | "waiting" | "retry" | "fallback" | "parked";

export interface TargetLadderState {
  phase: TargetPhase;
  /** Show a centred card carrying the step's own copy. */
  useCenteredFallback: boolean;
  /** Convert an interaction step to a Next button (only when safe). */
  convertToNextButton: boolean;
  /** The guide must end with reason "target-missing" (never marked seen). */
  shouldPark: boolean;
}

export const missingTargetFallbackFor = (step: GuideStep): MissingTargetFallback => {
  if (step.onMissingTarget) return step.onMissingTarget;
  // An interaction step cannot be satisfied without its element, and pretending
  // the tap happened would teach the wrong thing. Default to parking.
  return step.advanceOn === "interaction" ? "park" : "center";
};

export const evaluateTargetLadder = ({
  step,
  targetFound,
  elapsedMs,
}: {
  step: GuideStep;
  targetFound: boolean;
  elapsedMs: number;
}): TargetLadderState => {
  if (!step.targetId || targetFound) {
    return {
      phase: "resolved",
      useCenteredFallback: false,
      convertToNextButton: false,
      shouldPark: false,
    };
  }

  const fallback = missingTargetFallbackFor(step);

  if (elapsedMs < TARGET_RETRY_MS) {
    return {
      phase: "waiting",
      useCenteredFallback: false,
      convertToNextButton: false,
      shouldPark: false,
    };
  }
  if (elapsedMs < TARGET_FALLBACK_MS) {
    return {
      phase: "retry",
      useCenteredFallback: false,
      convertToNextButton: false,
      shouldPark: false,
    };
  }
  if (elapsedMs < TARGET_PARK_MS && fallback === "center") {
    return {
      phase: "fallback",
      useCenteredFallback: true,
      // The instruction can be taught without performing the action, so the
      // step gets a Next button instead of an impossible tap.
      convertToNextButton: step.advanceOn === "interaction",
      shouldPark: false,
    };
  }
  if (elapsedMs < TARGET_PARK_MS) {
    // "park" steps do not linger in a fallback state; they wait out the window
    // in case the element mounts late, then give up.
    return {
      phase: "retry",
      useCenteredFallback: false,
      convertToNextButton: false,
      shouldPark: false,
    };
  }

  return {
    phase: "parked",
    useCenteredFallback: false,
    convertToNextButton: false,
    shouldPark: true,
  };
};

/** Next timer to arm, or null when the ladder has nothing left to do. */
export const nextLadderDeadline = (elapsedMs: number): number | null => {
  if (elapsedMs < TARGET_RETRY_MS) return TARGET_RETRY_MS - elapsedMs;
  if (elapsedMs < TARGET_FALLBACK_MS) return TARGET_FALLBACK_MS - elapsedMs;
  if (elapsedMs < TARGET_PARK_MS) return TARGET_PARK_MS - elapsedMs;
  return null;
};
