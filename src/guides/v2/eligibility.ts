import {
  isDevAccountAgeOverrideEnabled,
  rolloutAtFor,
  studentRolloutAt,
} from "./featureFlag";
import { GuideBumpPolicy, GuidePriority, TutorialExperience } from "./types";

// Rollout eligibility by account age.
//
// The rule V2 needs before Student content can auto-run: an account that
// existed before Tutorial V2 shipped must never be dragged through first-time
// orientation or a first-success flow. Phase 1 approximated this with "has no
// earlier version recorded", which cannot tell a genuinely new learner from a
// six-month-old account that simply never saw a guide. This module replaces the
// approximation with the authoritative `Users.createdAt`.
//
// Everything here is pure, and every timestamp comparison in Tutorial V2 goes
// through it — no component parses `accountCreatedAt` itself.

export type EligibilityMode = "auto" | "replay" | "preview";

export type EligibilityReason =
  | "eligible"
  | "manual-request"
  | "policy-not-age-gated"
  | "account-predates-rollout"
  | "account-age-unknown"
  | "rollout-not-configured";

export interface EligibilityVerdict {
  eligible: boolean;
  reason: EligibilityReason;
  /** True when the caller should emit `guide_account_age_unknown`. */
  ageUnknown: boolean;
}

export interface AccountEligibilityInput {
  guide: { id: string; bumpPolicy: GuideBumpPolicy; priority: GuidePriority };
  /** ISO string from the profile response, or null when absent. */
  accountCreatedAt?: string | null;
  /**
   * The rollout instant for this guide's audience.
   *
   * `null` is authoritative and means "this audience has no configured rollout
   * date", which withholds age-gated guides. Only omitting the property
   * entirely falls back, and then only to the audience the caller names — a
   * Teacher or Parent must never inherit the Student date, which is what
   * `rolloutAt ?? studentRolloutAt()` used to do once the adult lanes existed.
   */
  rolloutAt?: string | null;
  /** Used only when `rolloutAt` is omitted. */
  experience?: TutorialExperience | null;
  mode?: EligibilityMode;
}

/** UTC-deterministic parse. Returns null for absent or unparseable values. */
export const parseInstant = (value: string | null | undefined): number | null => {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * First-time onboarding is the age-gated kind: orientation and first-success
 * flows, which the registry already forces to `new-users-only`. Contextual
 * guides (`bumpPolicy: "all"`) stay available to existing accounts, so a bump
 * years from now still reaches them.
 */
const isAgeGated = (guide: AccountEligibilityInput["guide"]): boolean =>
  guide.bumpPolicy === "new-users-only" ||
  guide.priority === "orientation" ||
  guide.priority === "first-success";

export const isGuideEligibleForAccount = ({
  guide,
  accountCreatedAt,
  rolloutAt,
  experience,
  mode = "auto",
}: AccountEligibilityInput): EligibilityVerdict => {
  // A person asked for this guide. Age gating exists to avoid ambushing
  // existing users, not to withhold help they requested; preview is an
  // authorized tester doing the same thing deliberately.
  if (mode === "replay" || mode === "preview") {
    return { eligible: true, reason: "manual-request", ageUnknown: false };
  }

  if (!isAgeGated(guide)) {
    return { eligible: true, reason: "policy-not-age-gated", ageUnknown: false };
  }

  // Development-only escape hatch, deliberately separate from the "V2 engine
  // enabled" flag: enabling the engine must never silently redefine what a new
  // production account is.
  if (isDevAccountAgeOverrideEnabled()) {
    return { eligible: true, reason: "eligible", ageUnknown: false };
  }

  const configuredRollout =
    rolloutAt !== undefined
      ? rolloutAt
      : experience !== undefined
        ? rolloutAtFor(experience)
        : studentRolloutAt();
  const rolloutInstant = parseInstant(configuredRollout);
  if (rolloutInstant === null) {
    // No rollout instant configured yet, so no account can be proven new.
    // Fail safe: automatic first-time onboarding stays off until it is set.
    return { eligible: false, reason: "rollout-not-configured", ageUnknown: false };
  }

  const createdInstant = parseInstant(accountCreatedAt);
  if (createdInstant === null) {
    return { eligible: false, reason: "account-age-unknown", ageUnknown: true };
  }

  // Created at the cutoff counts as new; anything earlier is an existing user.
  if (createdInstant < rolloutInstant) {
    return { eligible: false, reason: "account-predates-rollout", ageUnknown: false };
  }

  return { eligible: true, reason: "eligible", ageUnknown: false };
};
