import { beforeEach, describe, expect, it } from "vitest";
import {
  isGuideEligibleForAccount,
  parseInstant,
} from "../eligibility";
import {
  setDevAccountAgeOverride,
  setStudentRolloutOverride,
  studentRolloutAt,
} from "../featureFlag";
import { GuideBumpPolicy, GuidePriority } from "../types";

// The rollout gate: an account that existed before Tutorial V2 shipped must
// never be dragged through first-time onboarding. This is the case the Phase 1
// "has no earlier version recorded" approximation could not see.

const ROLLOUT = "2026-09-08T00:00:00Z";
const ROLLOUT_MS = Date.parse(ROLLOUT);

const guide = (
  bumpPolicy: GuideBumpPolicy = "new-users-only",
  priority: GuidePriority = "orientation",
) => ({ id: "solo-orientation", bumpPolicy, priority });

const verdictFor = (
  accountCreatedAt: string | null | undefined,
  options: Partial<Parameters<typeof isGuideEligibleForAccount>[0]> = {},
) =>
  isGuideEligibleForAccount({
    guide: guide(),
    accountCreatedAt,
    rolloutAt: ROLLOUT,
    ...options,
  });

beforeEach(() => {
  localStorage.clear();
  setStudentRolloutOverride(null);
  setDevAccountAgeOverride(false);
});

describe("account age cutoff", () => {
  it("withholds first-time onboarding from an account created six months before rollout", () => {
    const verdict = verdictFor("2026-03-08T00:00:00Z");
    expect(verdict.eligible).toBe(false);
    expect(verdict.reason).toBe("account-predates-rollout");
  });

  it("treats one second before the cutoff as an existing account", () => {
    expect(verdictFor(new Date(ROLLOUT_MS - 1000).toISOString()).eligible).toBe(false);
  });

  it("treats the cutoff instant itself as new", () => {
    const verdict = verdictFor(ROLLOUT);
    expect(verdict.eligible).toBe(true);
    expect(verdict.reason).toBe("eligible");
  });

  it("treats one second after the cutoff as new", () => {
    expect(verdictFor(new Date(ROLLOUT_MS + 1000).toISOString()).eligible).toBe(true);
  });

  it("compares in UTC regardless of how the instant is written", () => {
    // Same instant, three notations: all must land on the same side.
    expect(verdictFor("2026-09-08T00:00:00.000Z").eligible).toBe(true);
    expect(verdictFor("2026-09-08T02:00:00+02:00").eligible).toBe(true);
    expect(verdictFor("2026-09-07T22:00:00-02:00").eligible).toBe(true);
  });

  it("fails safe when the account timestamp is missing", () => {
    [null, undefined, ""].forEach((value) => {
      const verdict = verdictFor(value as string | null | undefined);
      expect(verdict.eligible).toBe(false);
      expect(verdict.reason).toBe("account-age-unknown");
      expect(verdict.ageUnknown).toBe(true);
    });
  });

  it("fails safe when the account timestamp is unparseable", () => {
    ["not-a-date", "0000-13-45T99:99:99Z", "1757289600"].forEach((value) => {
      const verdict = verdictFor(value);
      expect(verdict.eligible, value).toBe(false);
    });
  });

  it("withholds age-gated guides while no rollout instant is configured", () => {
    const verdict = isGuideEligibleForAccount({
      guide: guide(),
      accountCreatedAt: "2027-01-01T00:00:00Z",
      rolloutAt: null,
    });
    expect(verdict.eligible).toBe(false);
    expect(verdict.reason).toBe("rollout-not-configured");
  });
});

describe("bump policy semantics", () => {
  it("gates new-users-only guides on account age", () => {
    expect(
      isGuideEligibleForAccount({
        guide: guide("new-users-only", "route-tour"),
        accountCreatedAt: "2026-01-01T00:00:00Z",
        rolloutAt: ROLLOUT,
      }).eligible,
    ).toBe(false);
  });

  it("keeps contextual bumpPolicy:all guides available to an existing account", () => {
    const verdict = isGuideEligibleForAccount({
      guide: { id: "solo-shop-intro", bumpPolicy: "all", priority: "gameplay-concept" },
      accountCreatedAt: "2026-01-01T00:00:00Z",
      rolloutAt: ROLLOUT,
    });
    expect(verdict.eligible).toBe(true);
    expect(verdict.reason).toBe("policy-not-age-gated");
  });

  it("gates orientation and first-success even if their policy were mislabelled", () => {
    (["orientation", "first-success"] as GuidePriority[]).forEach((priority) => {
      expect(
        isGuideEligibleForAccount({
          guide: { id: "x", bumpPolicy: "all", priority },
          accountCreatedAt: "2026-01-01T00:00:00Z",
          rolloutAt: ROLLOUT,
        }).eligible,
        priority,
      ).toBe(false);
    });
  });

  it("does not suppress a bumpPolicy:all guide when age is unknown", () => {
    const verdict = isGuideEligibleForAccount({
      guide: { id: "solo-shop-intro", bumpPolicy: "all", priority: "route-tour" },
      accountCreatedAt: null,
      rolloutAt: ROLLOUT,
    });
    expect(verdict.eligible).toBe(true);
  });
});

describe("manual requests", () => {
  it("allows replay of an age-gated guide on an old account", () => {
    const verdict = verdictFor("2026-01-01T00:00:00Z", { mode: "replay" });
    expect(verdict.eligible).toBe(true);
    expect(verdict.reason).toBe("manual-request");
  });

  it("allows preview on an old account and on an account with no timestamp", () => {
    expect(verdictFor("2026-01-01T00:00:00Z", { mode: "preview" }).eligible).toBe(true);
    expect(verdictFor(null, { mode: "preview" }).eligible).toBe(true);
  });
});

describe("configuration and dev override", () => {
  it("reads the rollout instant from the device override when set", () => {
    expect(studentRolloutAt()).toBeNull();
    setStudentRolloutOverride(ROLLOUT);
    expect(studentRolloutAt()).toBe(ROLLOUT);
  });

  it("uses the configured rollout instant when the caller passes none", () => {
    setStudentRolloutOverride(ROLLOUT);
    expect(
      isGuideEligibleForAccount({
        guide: guide(),
        accountCreatedAt: "2026-01-01T00:00:00Z",
      }).eligible,
    ).toBe(false);
    expect(
      isGuideEligibleForAccount({
        guide: guide(),
        accountCreatedAt: "2026-10-01T00:00:00Z",
      }).eligible,
    ).toBe(true);
  });

  it("lets a development override treat an old account as new", () => {
    // Vitest runs in development/test mode, which is the only place this is
    // honoured; a production build ignores the key entirely.
    setDevAccountAgeOverride(true);
    expect(verdictFor("2026-01-01T00:00:00Z").eligible).toBe(true);
  });

  it("keeps the engine switch separate from the account-age override", () => {
    // Turning the engine on must not redefine account age.
    localStorage.setItem("sanabel:tutorialV2", "on");
    expect(verdictFor("2026-01-01T00:00:00Z").eligible).toBe(false);
  });
});

describe("instant parsing", () => {
  it("returns null for absent or malformed values and a number otherwise", () => {
    expect(parseInstant(null)).toBeNull();
    expect(parseInstant(undefined)).toBeNull();
    expect(parseInstant("   ")).toBeNull();
    expect(parseInstant("nope")).toBeNull();
    expect(parseInstant(ROLLOUT)).toBe(ROLLOUT_MS);
  });
});
