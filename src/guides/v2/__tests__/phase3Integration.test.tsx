import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { V2_REGISTRY, validateRegistry } from "../registry";
import { STUDENT_GUIDES } from "../studentContent";
import { TEACHER_GUIDES } from "../teacherContent";
import { PARENT_GUIDES } from "../parentContent";
import { resolveExperience } from "../resolveExperience";
import {
  enabledV2Experiences,
  isTutorialV2Enabled,
  rolloutAtFor,
  setRolloutOverrideFor,
  setTutorialV2Override,
} from "../featureFlag";
import { isGuideEligibleForAccount } from "../eligibility";
import { emitTeacherGuideEvent, subscribeTeacherGuideEvents } from "../teacherSignals";
import { emitParentGuideEvent, subscribeParentGuideEvents } from "../parentSignals";
import {
  emitStudentGuideSignal,
  subscribeStudentGuideSignals,
} from "../studentSignals";
import { TutorialExperience } from "../types";

// Phase 3 acceptance: the three role lanes now share one registry, one queue,
// one eligibility layer and one set of signal buses. These are the properties
// that only break when the lanes are combined.

const ADULT_EXPERIENCES: TutorialExperience[] = ["teacher", "parent"];

beforeEach(() => {
  localStorage.clear();
  setTutorialV2Override(null);
  (["solo", "school-student", "teacher", "parent"] as TutorialExperience[]).forEach(
    (experience) => setRolloutOverrideFor(experience, null),
  );
});

describe("combined registry census", () => {
  it("holds exactly the three authored lanes, with no duplicates", () => {
    expect(STUDENT_GUIDES).toHaveLength(19);
    expect(TEACHER_GUIDES).toHaveLength(10);
    expect(PARENT_GUIDES).toHaveLength(7);
    expect(V2_REGISTRY).toHaveLength(36);

    const ids = V2_REGISTRY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates as one registry", () => {
    expect(validateRegistry(V2_REGISTRY)).toEqual([]);
  });

  it("assigns every guide to a real audience, and no guide to two lanes at once", () => {
    const lanes = {
      student: new Set(["solo", "school-student"]),
      adult: new Set(["teacher", "parent"]),
    };
    V2_REGISTRY.forEach((entry) => {
      expect(entry.experiences.length, entry.id).toBeGreaterThan(0);
      const isStudent = entry.experiences.some((value) => lanes.student.has(value));
      const isAdult = entry.experiences.some((value) => lanes.adult.has(value));
      expect(isStudent && isAdult, `${entry.id} spans lanes`).toBe(false);
      expect(entry.experiences).not.toContain("unsupported");
      expect(entry.experiences).not.toContain("school-admin");
      expect(entry.experiences).not.toContain("super-admin");
    });
  });

  it("keeps teacher and parent guides on their own routes", () => {
    TEACHER_GUIDES.forEach((entry) =>
      expect(
        entry.route.startsWith("/teacher") || entry.route === "/approvals",
        entry.id,
      ).toBe(true),
    );
    PARENT_GUIDES.forEach((entry) =>
      expect(
        entry.route.startsWith("/parent") || entry.route === "/approvals",
        entry.id,
      ).toBe(true),
    );
  });

  it("registers no Admin content yet", () => {
    expect(
      V2_REGISTRY.filter((entry) =>
        entry.experiences.some((value) => value.endsWith("admin")),
      ),
    ).toEqual([]);
  });
});

describe("experience matrix", () => {
  it("routes every role to its own lane", () => {
    expect(resolveExperience({ role: "Student", organizationId: null, classId: null }).experience).toBe("solo");
    expect(resolveExperience({ role: "Student", organizationId: 11, classId: null }).experience).toBe("school-student");
    expect(resolveExperience({ role: "Teacher", organizationId: 11 }).experience).toBe("teacher");
    expect(resolveExperience({ role: "Parent" }).experience).toBe("parent");
    expect(resolveExperience({ role: "Admin", organizationId: 11, isSuperAdmin: false }).experience).toBe("school-admin");
    expect(resolveExperience({ role: "Admin", organizationId: null, isSuperAdmin: true }).experience).toBe("super-admin");
    expect(resolveExperience({ role: "Headmaster" }).experience).toBe("unsupported");
  });

  it("never lets an adult fall into Student content", () => {
    (["teacher", "parent"] as TutorialExperience[]).forEach((experience) => {
      const studentForAdult = STUDENT_GUIDES.filter((entry) =>
        entry.experiences.includes(experience),
      );
      expect(studentForAdult, experience).toEqual([]);
    });
  });

  it("never lets a Student fall into adult content", () => {
    (["solo", "school-student"] as TutorialExperience[]).forEach((experience) => {
      expect(
        [...TEACHER_GUIDES, ...PARENT_GUIDES].filter((entry) =>
          entry.experiences.includes(experience),
        ),
        experience,
      ).toEqual([]);
    });
  });
});

describe("feature flag ownership", () => {
  it("enables one audience without enabling the others", () => {
    setTutorialV2Override(["teacher"]);
    expect(isTutorialV2Enabled("teacher")).toBe(true);
    ["parent", "solo", "school-student", "school-admin", "super-admin"].forEach((experience) =>
      expect(isTutorialV2Enabled(experience as TutorialExperience), experience).toBe(false),
    );

    setTutorialV2Override(["parent"]);
    expect(isTutorialV2Enabled("parent")).toBe(true);
    expect(isTutorialV2Enabled("teacher")).toBe(false);
  });

  it("never enables an Admin audience through a Student or adult rollout", () => {
    setTutorialV2Override(["solo", "school-student", "teacher", "parent"]);
    expect(isTutorialV2Enabled("school-admin")).toBe(false);
    expect(isTutorialV2Enabled("super-admin")).toBe(false);
    expect(isTutorialV2Enabled("unsupported")).toBe(false);
  });

  it("is off by default, and off means off", () => {
    expect(enabledV2Experiences()).toEqual([]);
    expect(isTutorialV2Enabled("teacher")).toBe(false);
    setTutorialV2Override("off");
    expect(isTutorialV2Enabled("parent")).toBe(false);
  });
});

describe("rollout matrix", () => {
  it("maps each audience to its own configured instant", () => {
    setRolloutOverrideFor("solo", "2026-09-08T00:00:00Z");
    setRolloutOverrideFor("teacher", "2026-10-01T00:00:00Z");
    setRolloutOverrideFor("parent", "2026-11-01T00:00:00Z");

    expect(rolloutAtFor("solo")).toBe("2026-09-08T00:00:00Z");
    expect(rolloutAtFor("school-student")).toBe("2026-09-08T00:00:00Z");
    expect(rolloutAtFor("teacher")).toBe("2026-10-01T00:00:00Z");
    expect(rolloutAtFor("parent")).toBe("2026-11-01T00:00:00Z");
    expect(rolloutAtFor("school-admin")).toBeNull();
  });

  it("does not roll out adults when only the Student date is set", () => {
    setRolloutOverrideFor("solo", "2026-09-08T00:00:00Z");
    expect(rolloutAtFor("teacher")).toBeNull();
    expect(rolloutAtFor("parent")).toBeNull();

    const orientation = {
      id: "teacher-orientation",
      bumpPolicy: "new-users-only" as const,
      priority: "orientation" as const,
    };
    expect(
      isGuideEligibleForAccount({
        guide: orientation,
        accountCreatedAt: "2026-12-01T00:00:00Z",
        rolloutAt: rolloutAtFor("teacher"),
      }).reason,
    ).toBe("rollout-not-configured");
  });

  ADULT_EXPERIENCES.forEach((experience) => {
    it(`gates ${experience} first-time onboarding on account age`, () => {
      setRolloutOverrideFor(experience, "2026-10-01T00:00:00Z");
      const guide = {
        id: `${experience}-orientation`,
        bumpPolicy: "new-users-only" as const,
        priority: "orientation" as const,
      };
      const rolloutAt = rolloutAtFor(experience);

      expect(
        isGuideEligibleForAccount({ guide, accountCreatedAt: "2026-05-01T00:00:00Z", rolloutAt })
          .reason,
      ).toBe("account-predates-rollout");
      expect(
        isGuideEligibleForAccount({ guide, accountCreatedAt: "2026-10-01T00:00:00Z", rolloutAt })
          .eligible,
      ).toBe(true);
      expect(
        isGuideEligibleForAccount({ guide, accountCreatedAt: null, rolloutAt }).reason,
      ).toBe("account-age-unknown");
      expect(
        isGuideEligibleForAccount({ guide, accountCreatedAt: "whenever", rolloutAt }).eligible,
      ).toBe(false);
      // A person who asks for it still gets it.
      expect(
        isGuideEligibleForAccount({
          guide,
          accountCreatedAt: "2026-05-01T00:00:00Z",
          rolloutAt,
          mode: "replay",
        }).eligible,
      ).toBe(true);
    });
  });

  it("leaves contextual adult guides available to existing accounts", () => {
    setRolloutOverrideFor("teacher", "2026-10-01T00:00:00Z");
    const contextual = TEACHER_GUIDES.find((entry) => entry.id === "teacher-classes");
    expect(contextual?.bumpPolicy).toBe("all");
    expect(
      isGuideEligibleForAccount({
        guide: {
          id: contextual!.id,
          bumpPolicy: contextual!.bumpPolicy,
          priority: contextual!.priority,
        },
        accountCreatedAt: "2025-01-01T00:00:00Z",
        rolloutAt: rolloutAtFor("teacher"),
      }).eligible,
    ).toBe(true);
  });
});

describe("signal bus isolation", () => {
  it("keeps the three buses separate", () => {
    const teacher = vi.fn();
    const parent = vi.fn();
    const student = vi.fn();
    const unsubscribe = [
      subscribeTeacherGuideEvents(teacher),
      subscribeParentGuideEvents(parent),
      subscribeStudentGuideSignals(student),
    ];

    try {
      act(() => emitTeacherGuideEvent("teacher-decision-recorded"));
      expect(teacher).toHaveBeenCalledTimes(1);
      expect(parent).not.toHaveBeenCalled();
      expect(student).not.toHaveBeenCalled();

      act(() => emitParentGuideEvent("parent-approval-decided"));
      expect(parent).toHaveBeenCalledTimes(1);
      expect(teacher).toHaveBeenCalledTimes(1);
      expect(student).not.toHaveBeenCalled();

      act(() => emitStudentGuideSignal({ type: "mission-completed" }));
      expect(student).toHaveBeenCalledTimes(1);
      expect(teacher).toHaveBeenCalledTimes(1);
      expect(parent).toHaveBeenCalledTimes(1);
    } finally {
      unsubscribe.forEach((stop) => stop());
    }
  });

  it("uses disjoint event names, so a shared screen cannot cross roles", () => {
    const teacherEvents = new Set(
      TEACHER_GUIDES.flatMap((entry) => entry.steps.map((step) => step.successEvent)).filter(
        Boolean,
      ),
    );
    const parentEvents = new Set(
      PARENT_GUIDES.flatMap((entry) => entry.steps.map((step) => step.successEvent)).filter(
        Boolean,
      ),
    );
    const studentEvents = new Set(
      STUDENT_GUIDES.flatMap((entry) => entry.steps.map((step) => step.successEvent)).filter(
        Boolean,
      ),
    );

    [...teacherEvents].forEach((event) => {
      expect(parentEvents.has(event), String(event)).toBe(false);
      expect(studentEvents.has(event), String(event)).toBe(false);
    });
    [...parentEvents].forEach((event) =>
      expect(studentEvents.has(event), String(event)).toBe(false),
    );
    // The approvals screen is shared, so its two decision events must differ.
    expect(teacherEvents.has("teacher-decision-recorded")).toBe(true);
    expect(parentEvents.has("parent-approval-decided")).toBe(true);
  });

  it("drops every listener on unsubscribe, so a role switch cannot keep listening", () => {
    const teacher = vi.fn();
    const stop = subscribeTeacherGuideEvents(teacher);
    stop();
    act(() => emitTeacherGuideEvent("teacher-completed"));
    expect(teacher).not.toHaveBeenCalled();
  });
});

describe("shared wizard defaults", () => {
  // The Teacher default is Assign and the Parent default is Complete, decided in
  // the shared StudentsList wizard from the stored role. This is the regression
  // most likely to be broken by a future shared-component refactor.
  const readDefault = (role: string) => {
    localStorage.setItem("role", role);
    return localStorage.getItem("role") === "Teacher" ? "assign" : "complete";
  };

  it("keeps Assign for a Teacher and Complete for a Parent", () => {
    expect(readDefault("Teacher")).toBe("assign");
    expect(readDefault("Parent")).toBe("complete");
  });

  it("is asserted against the real source, not just this expression", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/pages/teacherorparent/pointsregistration/StudentsList.tsx"),
      "utf8",
    );
    expect(source).toMatch(
      /useState<"assign" \| "complete">\(\s*\(\) =>\s*localStorage\.getItem\("role"\) === "Teacher" \? "assign" : "complete",?\s*\)/,
    );
    const classList = fs.readFileSync(
      path.resolve(process.cwd(), "src/pages/teacherorparent/pointsregistration/ClassList.tsx"),
      "utf8",
    );
    // Teacher-only screen: Assign outright.
    expect(classList).toMatch(/useState<"assign" \| "complete">\("assign"\)/);
  });
});
