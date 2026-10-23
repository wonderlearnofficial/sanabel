import { PredicateFacts, evaluatePredicate } from "./predicates";
import {
  ExperienceContext,
  GuideRegistryEntry,
  PRIORITY_ORDER,
} from "./types";

// Auto-start policy, as pure functions over an explicit state object so every
// rule is unit-testable without React.
//
// Budget (docs/TUTORIAL_V2_DESIGN.md §26, tightened by the Phase 1 brief):
//   * at most 1 automatic guide per route entry
//   * at most 3 automatic guides per app session
//   * 90 s cooldown between two automatic guides
//   * a multi-route first-success guide is ONE guide, counted once
// Manual replay obeys none of these — it is a user request.

export const MAX_AUTO_GUIDES_PER_SESSION = 3;
export const AUTO_GUIDE_COOLDOWN_MS = 90_000;

export interface AutoBudgetState {
  /** Route entry id (from `routeEntry.ts`) that already spent its slot. */
  claimedEntryId: number | null;
  /** Account the claim belongs to, so switching users cannot inherit it. */
  claimedAccountKey: string | null;
  sessionStarts: number;
  lastGuideEndedAt: number | null;
}

export const initialAutoBudget = (): AutoBudgetState => ({
  claimedEntryId: null,
  claimedAccountKey: null,
  sessionStarts: 0,
  lastGuideEndedAt: null,
});

export type IneligibleReason =
  | "experience-mismatch"
  | "account-not-eligible"
  | "route-mismatch"
  | "view-mismatch"
  | "already-seen"
  | "manual-only"
  | "handoff-pending"
  | "predicate-unsatisfied"
  | "prerequisite-unsatisfied";

export type BlockedReason =
  | "unsupported-experience"
  | "read-only-session"
  | "overlay-busy"
  | "guide-active"
  | "route-entry-spent"
  | "session-budget-spent"
  | "cooldown"
  | "nothing-eligible";

export interface QueueEnvironment {
  context: ExperienceContext;
  registry: GuideRegistryEntry[];
  path: string;
  activeViews: string[];
  facts: PredicateFacts;
  /** From the guide store, already legacy- and version-aware. */
  isSeen: (entry: GuideRegistryEntry) => boolean;
  /** True when a spotlight target exists right now. */
  hasTarget: (targetId: string) => boolean;
  /** Guide ids whose handoff source has completed in this session. */
  completedHandoffs: string[];
  /**
   * Rollout gate by account age (`eligibility.ts`). Separate from `isSeen`: an
   * ineligible guide is not "seen", it is simply not offered automatically, and
   * a manual replay of it is still allowed.
   */
  isAccountEligible?: (entry: GuideRegistryEntry) => boolean;
}

export interface AutoDecisionEnvironment extends QueueEnvironment {
  budget: AutoBudgetState;
  routeEntryId: number;
  now: number;
  /** A guide is on screen already. */
  guideActive: boolean;
  /** A tier 1/2 overlay owns the screen. */
  overlayBusy: boolean;
}

export const ineligibleReason = (
  entry: GuideRegistryEntry,
  env: QueueEnvironment,
): IneligibleReason | null => {
  if (!entry.experiences.includes(env.context.experience)) {
    return "experience-mismatch";
  }
  if (env.isAccountEligible && !env.isAccountEligible(entry)) {
    return "account-not-eligible";
  }
  if (entry.route !== env.path) return "route-mismatch";
  if (entry.view && !env.activeViews.includes(entry.view)) return "view-mismatch";
  if (env.isSeen(entry)) return "already-seen";

  switch (entry.autoTrigger.kind) {
    case "manual":
      return "manual-only";
    case "handoff":
      if (!env.completedHandoffs.includes(entry.autoTrigger.from)) {
        return "handoff-pending";
      }
      break;
    case "predicate":
      if (
        !evaluatePredicate(entry.autoTrigger.id, {
          context: env.context,
          facts: env.facts,
        })
      ) {
        return "predicate-unsatisfied";
      }
      break;
    case "route-enter":
    default:
      break;
  }

  for (const prerequisite of entry.prerequisites) {
    if (prerequisite.kind === "target" && !env.hasTarget(prerequisite.id)) {
      return "prerequisite-unsatisfied";
    }
    if (
      prerequisite.kind === "predicate" &&
      !evaluatePredicate(prerequisite.id, {
        context: env.context,
        facts: env.facts,
      })
    ) {
      return "prerequisite-unsatisfied";
    }
  }

  return null;
};

/**
 * Eligible guides, best first. Ordering is priority, then registry order — a
 * stable, authored tie-break, so the same state always picks the same guide.
 */
export const eligibleGuides = (env: QueueEnvironment): GuideRegistryEntry[] =>
  env.registry
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => ineligibleReason(entry, env) === null)
    .sort((a, b) => {
      const byPriority =
        PRIORITY_ORDER[a.entry.priority] - PRIORITY_ORDER[b.entry.priority];
      return byPriority !== 0 ? byPriority : a.index - b.index;
    })
    .map(({ entry }) => entry);

export interface AutoDecision {
  guide: GuideRegistryEntry | null;
  blocked: BlockedReason | null;
}

/**
 * Whether an automatic guide may start right now, and which one.
 *
 * A guide that loses the slot is simply not selected: nothing is marked seen and
 * nothing is dropped, so it is offered again on a later valid route entry
 * (carryover).
 */
export const decideAutoGuide = (env: AutoDecisionEnvironment): AutoDecision => {
  // Malformed identity is not an audience: no experience matches, and guessing
  // one would show a learner the wrong app.
  if (env.context.experience === "unsupported") {
    return { guide: null, blocked: "unsupported-experience" };
  }
  if (env.context.isImpersonating || env.context.isPreview) {
    return { guide: null, blocked: "read-only-session" };
  }
  if (env.overlayBusy) return { guide: null, blocked: "overlay-busy" };
  if (env.guideActive) return { guide: null, blocked: "guide-active" };

  const { budget } = env;
  if (
    budget.claimedEntryId === env.routeEntryId &&
    budget.claimedAccountKey === env.context.accountKey
  ) {
    return { guide: null, blocked: "route-entry-spent" };
  }
  if (budget.sessionStarts >= MAX_AUTO_GUIDES_PER_SESSION) {
    return { guide: null, blocked: "session-budget-spent" };
  }
  if (
    budget.lastGuideEndedAt !== null &&
    env.now - budget.lastGuideEndedAt < AUTO_GUIDE_COOLDOWN_MS
  ) {
    return { guide: null, blocked: "cooldown" };
  }

  const [next] = eligibleGuides(env);
  if (!next) return { guide: null, blocked: "nothing-eligible" };
  return { guide: next, blocked: null };
};

/** Records that an automatic guide started. Manual replay never calls this. */
export const claimAutoSlot = (
  budget: AutoBudgetState,
  { routeEntryId, accountKey }: { routeEntryId: number; accountKey: string },
): AutoBudgetState => ({
  ...budget,
  claimedEntryId: routeEntryId,
  claimedAccountKey: accountKey,
  sessionStarts: budget.sessionStarts + 1,
});

/**
 * Starts the cooldown. Only an automatic guide's end does: a manual replay must
 * not delay the next automatic guide, and an interrupted guide has not taught
 * anything yet.
 */
export const recordAutoGuideEnd = (
  budget: AutoBudgetState,
  { now, wasAuto }: { now: number; wasAuto: boolean },
): AutoBudgetState =>
  wasAuto ? { ...budget, lastGuideEndedAt: now } : budget;
