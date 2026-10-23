import { describe, expect, it } from "vitest";
import {
  AUTO_GUIDE_COOLDOWN_MS,
  MAX_AUTO_GUIDES_PER_SESSION,
  claimAutoSlot,
  decideAutoGuide,
  eligibleGuides,
  ineligibleReason,
  initialAutoBudget,
  recordAutoGuideEnd,
} from "../queue";
import { resolveExperience } from "../resolveExperience";
import { GuideRegistryEntry } from "../types";

const soloContext = resolveExperience({
  role: "Student",
  organizationId: null,
  classId: null,
  userId: 7,
});

const schoolContext = resolveExperience({
  role: "Student",
  organizationId: 11,
  classId: 4,
  userId: 8,
});

const guide = (over: Partial<GuideRegistryEntry>): GuideRegistryEntry => ({
  id: "g",
  version: 1,
  bumpPolicy: "all",
  experiences: ["solo"],
  route: "/student/home",
  autoTrigger: { kind: "route-enter" },
  prerequisites: [],
  priority: "route-tour",
  steps: [{ id: "s1", titleKey: "t" }],
  replayable: true,
  persistence: "seen-on-complete",
  ...over,
});

const env = (over: Partial<Parameters<typeof decideAutoGuide>[0]> = {}) => ({
  context: soloContext,
  registry: [guide({ id: "tour" })],
  path: "/student/home",
  activeViews: [] as string[],
  facts: {},
  isSeen: () => false,
  hasTarget: () => true,
  completedHandoffs: [] as string[],
  budget: initialAutoBudget(),
  routeEntryId: 1,
  now: 10_000,
  guideActive: false,
  overlayBusy: false,
  ...over,
});

describe("eligibility", () => {
  it("rejects a guide for another experience", () => {
    expect(
      ineligibleReason(guide({ experiences: ["teacher"] }), env()),
    ).toBe("experience-mismatch");
  });

  it("rejects a guide for another route", () => {
    expect(ineligibleReason(guide({ route: "/student/progress" }), env())).toBe(
      "route-mismatch",
    );
  });

  it("rejects a seen guide", () => {
    expect(ineligibleReason(guide({}), env({ isSeen: () => true }))).toBe(
      "already-seen",
    );
  });

  it("never auto-starts a manual guide", () => {
    expect(
      ineligibleReason(guide({ autoTrigger: { kind: "manual" } }), env()),
    ).toBe("manual-only");
  });

  it("waits for a handoff source to complete", () => {
    const entry = guide({ autoTrigger: { kind: "handoff", from: "orientation" } });
    expect(ineligibleReason(entry, env())).toBe("handoff-pending");
    expect(
      ineligibleReason(entry, env({ completedHandoffs: ["orientation"] })),
    ).toBeNull();
  });

  it("honours a named trigger predicate", () => {
    const entry = guide({ autoTrigger: { kind: "predicate", id: "xpAboveZero" } });
    expect(ineligibleReason(entry, env({ facts: { xp: 0 } }))).toBe(
      "predicate-unsatisfied",
    );
    expect(ineligibleReason(entry, env({ facts: { xp: 5 } }))).toBeNull();
  });

  it("never satisfies a predicate that is only declared, not implemented", () => {
    const entry = guide({
      autoTrigger: { kind: "predicate", id: "assignmentFlowSeen" },
    });
    expect(ineligibleReason(entry, env())).toBe("predicate-unsatisfied");
  });

  it("requires a prerequisite target to exist", () => {
    const entry = guide({ prerequisites: [{ kind: "target", id: "shop-water" }] });
    expect(ineligibleReason(entry, env({ hasTarget: () => false }))).toBe(
      "prerequisite-unsatisfied",
    );
    expect(ineligibleReason(entry, env())).toBeNull();
  });

  it("uses the reward-mode predicates rather than class data", () => {
    const approvalOnly = guide({
      experiences: ["school-student"],
      autoTrigger: { kind: "predicate", id: "approvalRewardMode" },
    });
    expect(
      ineligibleReason(approvalOnly, env({ context: schoolContext })),
    ).toBeNull();
    expect(
      ineligibleReason(
        { ...approvalOnly, experiences: ["solo"] },
        env({ context: soloContext }),
      ),
    ).toBe("predicate-unsatisfied");
  });
});

describe("view keys", () => {
  const treeGuide = guide({
    id: "tree",
    route: "/student/progress",
    view: "student.progress.tree",
    replayTarget: { route: "/student/progress", view: "student.progress.tree" },
  });
  const levelGuide = guide({
    id: "level",
    route: "/student/progress",
    view: "student.progress.level",
    replayTarget: { route: "/student/progress", view: "student.progress.level" },
  });

  it("separates two guides on the same route by their view", () => {
    const onTree = env({
      registry: [treeGuide, levelGuide],
      path: "/student/progress",
      activeViews: ["student.progress.tree"],
    });
    expect(eligibleGuides(onTree).map((entry) => entry.id)).toEqual(["tree"]);

    const onLevel = env({
      registry: [treeGuide, levelGuide],
      path: "/student/progress",
      activeViews: ["student.progress.level"],
    });
    expect(eligibleGuides(onLevel).map((entry) => entry.id)).toEqual(["level"]);
  });

  it("starts nothing when the route matches but no view is mounted", () => {
    const noView = env({
      registry: [treeGuide, levelGuide],
      path: "/student/progress",
      activeViews: [],
    });
    expect(eligibleGuides(noView)).toEqual([]);
    expect(ineligibleReason(treeGuide, noView)).toBe("view-mismatch");
  });
});

describe("priority and determinism", () => {
  it("orders by priority tier", () => {
    const registry = [
      guide({ id: "tip", priority: "tip" }),
      guide({ id: "tour", priority: "route-tour" }),
      guide({ id: "concept", priority: "gameplay-concept" }),
      guide({ id: "first", priority: "first-success", bumpPolicy: "new-users-only" }),
      guide({ id: "orient", priority: "orientation", bumpPolicy: "new-users-only" }),
    ];
    expect(eligibleGuides(env({ registry })).map((entry) => entry.id)).toEqual([
      "orient",
      "first",
      "concept",
      "tour",
      "tip",
    ]);
  });

  it("breaks ties on authored registry order, stably", () => {
    const registry = [
      guide({ id: "second", priority: "route-tour" }),
      guide({ id: "third", priority: "route-tour" }),
      guide({ id: "first", priority: "route-tour" }),
    ];
    const ids = () => eligibleGuides(env({ registry })).map((entry) => entry.id);
    expect(ids()).toEqual(["second", "third", "first"]);
    expect(ids()).toEqual(ids());
  });

  it("picks the highest priority guide, and leaves the loser eligible", () => {
    const registry = [
      guide({ id: "tour", priority: "route-tour" }),
      guide({ id: "orient", priority: "orientation", bumpPolicy: "new-users-only" }),
    ];
    const decision = decideAutoGuide(env({ registry }));
    expect(decision.guide?.id).toBe("orient");
    // Carryover: nothing marked the loser seen or dropped it.
    expect(eligibleGuides(env({ registry })).map((entry) => entry.id)).toContain(
      "tour",
    );
  });
});

describe("automatic budget", () => {
  it("allows one automatic guide per route entry", () => {
    let budget = initialAutoBudget();
    const first = decideAutoGuide(env({ budget }));
    expect(first.guide?.id).toBe("tour");

    budget = claimAutoSlot(budget, { routeEntryId: 1, accountKey: soloContext.accountKey });
    const second = decideAutoGuide(
      env({
        budget,
        registry: [guide({ id: "tour" }), guide({ id: "other" })],
      }),
    );
    expect(second.guide).toBeNull();
    expect(second.blocked).toBe("route-entry-spent");
  });

  it("frees the slot on the next route entry", () => {
    const budget = claimAutoSlot(initialAutoBudget(), {
      routeEntryId: 1,
      accountKey: soloContext.accountKey,
    });
    const decision = decideAutoGuide(env({ budget, routeEntryId: 2 }));
    expect(decision.guide?.id).toBe("tour");
  });

  it("does not inherit another account's claim", () => {
    const budget = claimAutoSlot(initialAutoBudget(), {
      routeEntryId: 1,
      accountKey: "u999",
    });
    expect(decideAutoGuide(env({ budget })).guide?.id).toBe("tour");
  });

  it("stops after three automatic guides in a session", () => {
    let budget = initialAutoBudget();
    for (let index = 0; index < MAX_AUTO_GUIDES_PER_SESSION; index += 1) {
      const decision = decideAutoGuide(env({ budget, routeEntryId: index + 1 }));
      expect(decision.guide).not.toBeNull();
      budget = claimAutoSlot(budget, {
        routeEntryId: index + 1,
        accountKey: soloContext.accountKey,
      });
    }
    const blocked = decideAutoGuide(env({ budget, routeEntryId: 99 }));
    expect(blocked.guide).toBeNull();
    expect(blocked.blocked).toBe("session-budget-spent");
  });

  it("holds a 90 second cooldown between automatic guides", () => {
    const budget = recordAutoGuideEnd(initialAutoBudget(), {
      now: 100_000,
      wasAuto: true,
    });
    const tooSoon = decideAutoGuide(
      env({ budget, routeEntryId: 2, now: 100_000 + AUTO_GUIDE_COOLDOWN_MS - 1 }),
    );
    expect(tooSoon.blocked).toBe("cooldown");

    const later = decideAutoGuide(
      env({ budget, routeEntryId: 2, now: 100_000 + AUTO_GUIDE_COOLDOWN_MS }),
    );
    expect(later.guide?.id).toBe("tour");
  });

  it("does not start a cooldown for a manual replay", () => {
    const budget = recordAutoGuideEnd(initialAutoBudget(), {
      now: 100_000,
      wasAuto: false,
    });
    expect(budget.lastGuideEndedAt).toBeNull();
    expect(decideAutoGuide(env({ budget, routeEntryId: 2, now: 100_001 })).guide?.id).toBe(
      "tour",
    );
  });

  it("counts a multi-step guide once, not once per step", () => {
    const multi = guide({
      id: "first-success",
      priority: "first-success",
      bumpPolicy: "new-users-only",
      steps: [
        { id: "s1", titleKey: "a" },
        { id: "s2", titleKey: "b" },
        { id: "s3", titleKey: "c" },
      ],
    });
    const budget = claimAutoSlot(initialAutoBudget(), {
      routeEntryId: 1,
      accountKey: soloContext.accountKey,
    });
    expect(budget.sessionStarts).toBe(1);
    expect(decideAutoGuide(env({ registry: [multi], budget, routeEntryId: 1 })).blocked).toBe(
      "route-entry-spent",
    );
  });
});

describe("hard blocks", () => {
  it("never auto-starts in an impersonated or preview session", () => {
    const impersonating = resolveExperience({
      role: "Student",
      organizationId: null,
      classId: null,
      isImpersonating: true,
    });
    expect(decideAutoGuide(env({ context: impersonating })).blocked).toBe(
      "read-only-session",
    );

    const preview = resolveExperience({
      role: "Student",
      organizationId: null,
      classId: null,
      isPreview: true,
    });
    expect(decideAutoGuide(env({ context: preview })).blocked).toBe(
      "read-only-session",
    );
  });

  it("yields to a higher-priority overlay", () => {
    expect(decideAutoGuide(env({ overlayBusy: true })).blocked).toBe("overlay-busy");
  });

  it("never runs two guides at once", () => {
    expect(decideAutoGuide(env({ guideActive: true })).blocked).toBe("guide-active");
  });
});
