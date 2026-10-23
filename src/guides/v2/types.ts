// Tutorial V2 foundation contracts. Content-free on purpose: role guides land in
// later phases, this file only fixes the shapes they must fit.
//
// Product rules encoded here (docs/TUTORIAL_V2_DESIGN.md, docs/GAMEPLAY_ALIGNMENT.md):
//   * organization membership decides Solo vs School, never class placement
//   * three snabel balances are not the four ihsan mission domains
//   * reward wording comes from `RewardMode`, never from a local classId check

export type TutorialExperience =
  | "solo"
  | "school-student"
  | "teacher"
  | "parent"
  | "school-admin"
  | "super-admin"
  // Malformed or unknown identity data. Not a role: no guide may declare it,
  // nothing auto-starts, and nothing persists. Reward-mode copy still fails
  // closed to approval so no instant-reward wording can leak.
  | "unsupported";

/** How a completed mission becomes a reward, mirroring `requiresMissionApproval`. */
export type RewardMode = "instant" | "approval";

export type TutorialScope = "solo" | "organization" | "platform" | "unsupported";

export interface ExperienceContext {
  experience: TutorialExperience;
  rewardMode: RewardMode;
  scope: TutorialScope;
  /**
   * True for the inconsistent legacy shape (a class with no organization).
   * Resolution fails closed to approval; the tutorial never repairs data and
   * never explains the anomaly to the user.
   */
  dataFault: boolean;
  isImpersonating: boolean;
  isPreview: boolean;
  /** Parents only; 0 when unknown or not applicable. */
  childCount: number;
  locale: "ar" | "en";
  /** Stable per-account key for guide/progress storage. */
  accountKey: string;
  /**
   * `Users.createdAt`, ISO, exactly as the server sent it, or null when the
   * profile response did not carry it. Compared in one place only
   * (`eligibility.ts`); a null or unparseable value fails safe to "not a new
   * account", so automatic first-time onboarding is withheld.
   */
  accountCreatedAt: string | null;
}

export type GuidePriority =
  | "orientation"
  | "first-success"
  | "gameplay-concept"
  | "route-tour"
  | "tip";

/** Lower number wins. Kept explicit so ordering is a value, not a sort comment. */
export const PRIORITY_ORDER: Record<GuidePriority, number> = {
  orientation: 1,
  "first-success": 2,
  "gameplay-concept": 3,
  "route-tour": 4,
  tip: 5,
};

export type GuideAdvanceMode = "interaction" | "next-button";

/**
 * What to do when a step's spotlight target never appears.
 *   "center"  — teach the same thing in a centred card (safe only when the
 *               instruction does not require performing the action)
 *   "park"    — stop, keep the guide unseen, retry on a later route entry
 */
export type MissingTargetFallback = "center" | "park";

export interface GuideStep {
  id: string;
  /** i18n key. `client/` keys are the Arabic string itself (see languages/ar.ts). */
  titleKey: string;
  descriptionKey?: string;
  /** `data-guide-id` of a real element. Absent = centred card. */
  targetId?: string;
  advanceOn?: GuideAdvanceMode;
  /** Defaults to "park" for interaction steps and "center" otherwise. */
  onMissingTarget?: MissingTargetFallback;
  /** Copy variants selected by reward mode; never derived from classId. */
  rewardModeCopy?: Partial<
    Record<RewardMode, { titleKey: string; descriptionKey?: string }>
  >;
  assets?: string[];
  /** Advance only after the real control's request succeeds, never on its initial tap. */
  successEvent?: 'mission-completed' | 'approval-sent' | 'tree-grown' | import('./teacherSignals').TeacherGuideEvent | import('./parentSignals').ParentGuideEvent;
  /** An existing/selected mission exposes its real actionable control. */
  advanceWhenTargetPresent?: string;
}

export type GuidePrerequisite =
  | { kind: "target"; id: string }
  | { kind: "predicate"; id: string };

export type GuideAutoTrigger =
  | { kind: "route-enter" }
  | { kind: "handoff"; from: string }
  | { kind: "predicate"; id: string }
  | { kind: "manual" };

/**
 * "all"            — a version bump re-teaches everyone
 * "new-users-only" — a version bump reaches only accounts that never saw an
 *                    earlier version, so orientation and first-success flows
 *                    cannot mass re-onboard existing users
 */
export type GuideBumpPolicy = "all" | "new-users-only";

export type GuidePersistence =
  | "seen-on-complete"
  | "seen-on-any-end"
  | "never";

export interface GuideRegistryEntry {
  id: string;
  version: number;
  bumpPolicy: GuideBumpPolicy;
  experiences: TutorialExperience[];
  route: string;
  /** Optional local view (tab) key; see `useGuideView`. */
  view?: string;
  autoTrigger: GuideAutoTrigger;
  prerequisites: GuidePrerequisite[];
  priority: GuidePriority;
  steps: GuideStep[];
  replayable: boolean;
  replayTarget?: { route: string; view?: string };
  helpTopicId?: string;
  assets?: string[];
  persistence: GuidePersistence;
  requiresAcknowledgement?: boolean;
}

/** Why a guide ended. Drives persistence and progress handling. */
export type GuideEndReason =
  | "complete"
  | "defer"
  | "preempted"
  | "target-missing"
  | "replay-exit";

export type TutorialTelemetryEvent =
  | "guide_started"
  | "guide_step_viewed"
  | "guide_completed"
  | "guide_deferred"
  | "guide_skipped"
  | "guide_replayed"
  | "guide_target_missing"
  | "guide_scope_conflict"
  // Identity the resolver could not classify (no PII in the payload).
  | "guide_experience_invalid"
  // Automatic first-time onboarding withheld because account age is unknown.
  | "guide_account_age_unknown";

/** Overlay arbitration tiers. A lower tier always wins the screen. */
export const OVERLAY_TIER = {
  blocking: 1,
  requiredOnboarding: 2,
  guide: 3,
  optional: 4,
} as const;

export type OverlayTier = (typeof OVERLAY_TIER)[keyof typeof OVERLAY_TIER];
