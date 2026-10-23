import { describe, expect, it } from "vitest";
import { TEACHER_GUIDES, teacherCopy } from "../teacherContent";
import { teacherMutationEvent } from "../teacherSignals";
import { teacherRegistryForRoute, teacherResumeIndex } from "../teacherRuntime";
import { teacherHelpGuides, teacherReplayGuides } from "../../../pages/teacherorparent/TeacherHelpV2";
import { validateRegistry } from "../registry";
import { resolveExperience } from "../resolveExperience";
import { eligibleGuides, initialAutoBudget } from "../queue";
import { evaluatePredicate } from "../predicates";

// Phase 3A shipped the Teacher content but deferred its own suite to
// integration. This is that suite: content invariants, real-success mapping,
// the one-student first-success guard, bulk and approval gating, and Help
// filtering — all without touching gameplay.

const teacherContext = (over: Record<string, unknown> = {}) =>
  resolveExperience({ role: "Teacher", organizationId: 11, userId: 3, ...over });

const guideById = (id: string) => {
  const entry = TEACHER_GUIDES.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`missing teacher guide ${id}`);
  return entry;
};

const queueEnv = (facts: Record<string, unknown>, path: string, views: string[] = []) => ({
  context: teacherContext(),
  registry: TEACHER_GUIDES,
  path,
  activeViews: views,
  facts,
  isSeen: () => false,
  hasTarget: () => true,
  completedHandoffs: [] as string[],
  budget: initialAutoBudget(),
  routeEntryId: 1,
  now: 0,
  guideActive: false,
  overlayBusy: false,
});

describe("teacher registry", () => {
  it("registers ten guides, all for the teacher experience only", () => {
    expect(TEACHER_GUIDES).toHaveLength(10);
    TEACHER_GUIDES.forEach((entry) => {
      expect(entry.experiences, entry.id).toEqual(["teacher"]);
    });
    expect(new Set(TEACHER_GUIDES.map((entry) => entry.id)).size).toBe(10);
  });

  it("passes the shared registry validator", () => {
    expect(validateRegistry(TEACHER_GUIDES)).toEqual([]);
  });

  it("keeps orientation and first-success age-gated", () => {
    ["teacher-orientation", "teacher-first-assignment"].forEach((id) => {
      expect(guideById(id).bumpPolicy, id).toBe("new-users-only");
    });
  });

  it("gives every authored key both languages, with no fabricated numbers", () => {
    Object.entries(teacherCopy).forEach(([key, pair]) => {
      const [arabic, english] = pair as readonly [string, string];
      expect(arabic.trim(), key).not.toBe("");
      expect(english.trim(), key).not.toBe("");
      expect(/[؀-ۿ]/.test(arabic), `${key} arabic`).toBe(true);
      expect(/[؀-ۿ]/.test(english), `${key} english`).toBe(false);
      // No invented XP, reward or price values in adult copy.
      expect(arabic.replace(/\{\{[^}]+\}\}/g, ""), key).not.toMatch(/\d/);
      expect(english.replace(/\{\{[^}]+\}\}/g, ""), key).not.toMatch(/\d/);
    });
  });
});

describe("teacher copy does not leak other roles", () => {
  const arabic = Object.values(teacherCopy).map((pair) => (pair as readonly string[])[0]).join(" ");
  const english = Object.values(teacherCopy)
    .map((pair) => (pair as readonly string[])[1])
    .join(" ")
    .toLowerCase();

  it("teaches no Parent concept", () => {
    ["link a child", "linked child", "switch child", "your child"].forEach((phrase) =>
      expect(english, phrase).not.toContain(phrase),
    );
    ["اربط طفلك", "تبديل الطفل", "طفلك"].forEach((phrase) =>
      expect(arabic, phrase).not.toContain(phrase),
    );
  });

  it("teaches no Student wallet, shop or tree onboarding", () => {
    ["snabel", "shop", "olive tree", "water", "fertilizer"].forEach((phrase) =>
      expect(english, phrase).not.toContain(phrase),
    );
  });

  it("teaches no Admin tooling", () => {
    ["organization", "import", "system health", "data quality"].forEach((phrase) =>
      expect(english, phrase).not.toContain(phrase),
    );
  });

  it("keeps the three verbs distinct in both languages", () => {
    expect(teacherCopy.modeBody[1].toLowerCase()).toContain("assign");
    expect(teacherCopy.modeBody[1].toLowerCase()).toMatch(/reward|complete/);
    expect(teacherCopy.distinctionBody[1].toLowerCase()).toContain("assign");
    expect(teacherCopy.distinctionBody[0]).toMatch(/إسناد|أسند/);
    expect(teacherCopy.decisionBody[0]).toMatch(/موافق|تأكيد|رفض/);
  });
});

describe("real-success mapping", () => {
  it("treats a 200 that assigned nothing as no success", () => {
    expect(teacherMutationEvent("assign", 1, { results: [{ status: "failed" }] })).toBeNull();
    expect(teacherMutationEvent("assign", 1, { summary: { created: 0, existing: 0 } })).toBeNull();
    expect(teacherMutationEvent("assign", 1, {})).toBeNull();
    expect(teacherMutationEvent("complete", 1, { results: [{ status: "unauthorized" }] })).toBeNull();
  });

  it("reports a single-student assignment separately from a bulk one", () => {
    expect(teacherMutationEvent("assign", 1, { results: [{ status: "created" }] })).toBe(
      "teacher-assigned-single",
    );
    expect(
      teacherMutationEvent("assign", 3, {
        results: [{ status: "created" }, { status: "created" }, { status: "existing" }],
      }),
    ).toBe("teacher-assigned");
    // One selected student whose row already existed still counts as done.
    expect(teacherMutationEvent("assign", 1, { summary: { existing: 1 } })).toBe(
      "teacher-assigned-single",
    );
  });

  it("never reports an assignment as a completion", () => {
    expect(teacherMutationEvent("complete", 1, { results: [{ status: "completed" }] })).toBe(
      "teacher-completed",
    );
    expect(teacherMutationEvent("complete", 2, { summary: { already_completed: 2 } })).toBe(
      "teacher-completed",
    );
    expect(teacherMutationEvent("assign", 1, { results: [{ status: "created" }] })).not.toBe(
      "teacher-completed",
    );
  });

  it("only the confirm step listens for the assignment event", () => {
    const flow = guideById("teacher-first-assignment");
    const confirm = flow.steps.find((step) => step.id === "confirm");
    expect(confirm?.successEvent).toBe("teacher-assigned-single");
    // A tap alone cannot satisfy it: the step declares a success event, which
    // the overlay honours instead of the click handler.
    expect(confirm?.advanceOn).toBe("interaction");
    expect(flow.steps.filter((step) => step.successEvent === "teacher-assigned")).toEqual([]);
  });
});

describe("first-success guards", () => {
  it("needs students before it is offered at all", () => {
    const withoutStudents = queueEnv({ teacherStudentCount: 0 }, "/teacher/home");
    expect(eligibleGuides(withoutStudents).map((entry) => entry.id)).not.toContain(
      "teacher-first-assignment",
    );
    const withStudents = queueEnv({ teacherStudentCount: 4 }, "/teacher/home");
    expect(eligibleGuides(withStudents).map((entry) => entry.id)).toContain(
      "teacher-first-assignment",
    );
  });

  it("follows the wizard onto the student list route", () => {
    const moved = teacherRegistryForRoute(TEACHER_GUIDES, "/teacher/studentslist");
    expect(moved.find((entry) => entry.id === "teacher-first-assignment")?.route).toBe(
      "/teacher/studentslist",
    );
    // Other guides keep their own route.
    expect(moved.find((entry) => entry.id === "teacher-orientation")?.route).toBe(
      "/teacher/home",
    );
  });

  it("rebuilds transient selection on resume instead of trusting it", () => {
    // Wizard closed: fall back to the first wizard step, never a stale selection.
    expect(teacherResumeIndex(4, "/teacher/studentslist", { teacherWizardOpen: false })).toBe(1);
    // Wizard open: keep the position.
    expect(teacherResumeIndex(4, "/teacher/studentslist", { teacherWizardOpen: true })).toBe(4);
    // A finished assignment keeps its recap.
    expect(teacherResumeIndex(5, "/teacher/home", { teacherWizardOpen: false })).toBe(5);
  });
});

describe("bulk and approval gating", () => {
  it("offers the bulk guide only once the predicate says so", () => {
    // Bulk needs more than one selected student AND the first assignment
    // already completed, so it can never precede the single-student lesson.
    expect(evaluatePredicate("teacherBulkReady", {
      context: teacherContext(),
      facts: { teacherSelectedCount: 3, seenGuideIds: [] },
    })).toBe(false);
    expect(evaluatePredicate("teacherBulkReady", {
      context: teacherContext(),
      facts: { teacherSelectedCount: 1, seenGuideIds: ["teacher-first-assignment:v1"] },
    })).toBe(false);
    expect(evaluatePredicate("teacherBulkReady", {
      context: teacherContext(),
      facts: {
        teacherSelectedCount: 3,
        seenGuideIds: ["teacher-first-assignment:v1"],
      },
    })).toBe(true);

    const notReady = queueEnv({ teacherSelectedCount: 1 }, "/teacher/studentslist");
    expect(eligibleGuides(notReady).map((entry) => entry.id)).not.toContain(
      "teacher-bulk-assignment",
    );
  });

  it("offers no approval guide without a real pending request", () => {
    const noPending = queueEnv({ teacherPendingCount: 0 }, "/approvals");
    expect(eligibleGuides(noPending).map((entry) => entry.id)).not.toContain(
      "teacher-approval-decision",
    );
    const pending = queueEnv({ teacherPendingCount: 2 }, "/approvals");
    expect(eligibleGuides(pending).map((entry) => entry.id)).toContain(
      "teacher-approval-decision",
    );
  });

  it("advances the decision step only on a recorded decision", () => {
    const decision = guideById("teacher-approval-decision");
    expect(decision.steps[0].successEvent).toBe("teacher-decision-recorded");
    expect(decision.steps[1].successEvent).toBeUndefined();
  });

  it("keeps direct completion behind its own predicate and its own event", () => {
    const direct = guideById("teacher-direct-complete");
    expect(direct.autoTrigger).toEqual({ kind: "predicate", id: "teacherCompleting" });
    expect(direct.steps[0].successEvent).toBe("teacher-completed");
  });
});

describe("teacher help", () => {
  it("lists teacher guides only, and nothing for another role", () => {
    expect(teacherHelpGuides(teacherContext()).map((entry) => entry.id)).toEqual(
      TEACHER_GUIDES.map((entry) => entry.id),
    );
    expect(teacherHelpGuides(resolveExperience({ role: "Parent" }))).toEqual([]);
    expect(
      teacherHelpGuides(resolveExperience({ role: "Student", organizationId: null })),
    ).toEqual([]);
  });

  it("hides state-dependent replays until their state exists", () => {
    const quiet = teacherReplayGuides(teacherContext(), { teacherStudentCount: 4 }).map(
      (entry) => entry.id,
    );
    expect(quiet).not.toContain("teacher-approval-decision");
    expect(quiet).not.toContain("teacher-bulk-assignment");

    const busy = teacherReplayGuides(teacherContext(), {
      teacherStudentCount: 4,
      teacherPendingCount: 2,
    }).map((entry) => entry.id);
    expect(busy).toContain("teacher-approval-decision");
  });
});
