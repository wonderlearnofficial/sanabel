import { isPredicateRegistered } from "./predicates";
import {
  GuideRegistryEntry,
  PRIORITY_ORDER,
  TutorialExperience,
} from "./types";

// The V2 guide registry and its validator.
//
// Phase 1 deliberately ships NO role content: the production registry is empty,
// so enabling the feature flag changes what the engine *can* do, not what a real
// user is shown. Role guides arrive in the Student/Teacher/Parent/Admin phases
// and are validated by the same rules used here.

import { STUDENT_GUIDES } from './studentContent';
import { PARENT_GUIDES } from './parentContent';
import { TEACHER_GUIDES } from './teacherContent';
export const V2_REGISTRY: GuideRegistryEntry[] = [...STUDENT_GUIDES, ...TEACHER_GUIDES, ...PARENT_GUIDES];

const EXPERIENCES: TutorialExperience[] = [
  "solo",
  "school-student",
  "teacher",
  "parent",
  "school-admin",
  "super-admin",
];

// A target id is a `data-guide-id` value: lower-case, dash-separated, no spaces
// or quotes (it goes straight into a CSS attribute selector).
const TARGET_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export interface RegistryProblem {
  guideId: string;
  problem: string;
}

/**
 * Registry invariants. Called by tests against both the production registry and
 * the fixtures the engine tests use, so content authored in a later phase
 * cannot introduce a duplicate id, an unversioned guide, an unknown predicate,
 * or an unreachable replay target.
 */
export const validateRegistry = (
  registry: GuideRegistryEntry[],
): RegistryProblem[] => {
  const problems: RegistryProblem[] = [];
  const seenIds = new Set<string>();

  registry.forEach((entry) => {
    const report = (problem: string) =>
      problems.push({ guideId: entry.id || "(missing id)", problem });

    if (!entry.id) report("missing id");
    if (seenIds.has(entry.id)) report("duplicate id");
    seenIds.add(entry.id);

    if (!Number.isInteger(entry.version) || entry.version < 1) {
      report("version must be a positive integer");
    }
    if (entry.bumpPolicy !== "all" && entry.bumpPolicy !== "new-users-only") {
      report("missing or invalid bumpPolicy");
    }
    // A bumped orientation or first-success flow must never re-onboard existing
    // users; only small contextual guides may re-fire.
    if (
      (entry.priority === "orientation" || entry.priority === "first-success") &&
      entry.bumpPolicy !== "new-users-only"
    ) {
      report("orientation/first-success guides require bumpPolicy new-users-only");
    }

    if (!Array.isArray(entry.experiences) || entry.experiences.length === 0) {
      report("must declare at least one experience");
    }
    entry.experiences?.forEach((experience) => {
      if (!EXPERIENCES.includes(experience)) {
        report(`unknown experience "${experience}"`);
      }
    });

    if (!entry.route || !entry.route.startsWith("/")) {
      report("route must be an absolute path");
    }
    if (!(entry.priority in PRIORITY_ORDER)) report("invalid priority");

    if (!Array.isArray(entry.steps) || entry.steps.length === 0) {
      report("must have at least one step");
    }
    const stepIds = new Set<string>();
    entry.steps?.forEach((step) => {
      if (!step.id) report("step is missing an id");
      if (stepIds.has(step.id)) report(`duplicate step id "${step.id}"`);
      stepIds.add(step.id);
      if (!step.titleKey) report(`step "${step.id}" is missing a titleKey`);
      if (step.targetId && !TARGET_ID_PATTERN.test(step.targetId)) {
        report(`step "${step.id}" has an invalid target id "${step.targetId}"`);
      }
      if (step.advanceOn === "interaction" && !step.targetId) {
        report(`step "${step.id}" advances on interaction but has no target`);
      }
    });

    if (entry.autoTrigger?.kind === "predicate") {
      if (!isPredicateRegistered(entry.autoTrigger.id)) {
        report(`unknown trigger predicate "${entry.autoTrigger.id}"`);
      }
    }
    if (entry.autoTrigger?.kind === "handoff" && !entry.autoTrigger.from) {
      report("handoff trigger is missing its source guide id");
    }

    entry.prerequisites?.forEach((prerequisite) => {
      if (prerequisite.kind === "predicate" && !isPredicateRegistered(prerequisite.id)) {
        report(`unknown prerequisite predicate "${prerequisite.id}"`);
      }
      if (prerequisite.kind === "target" && !TARGET_ID_PATTERN.test(prerequisite.id)) {
        report(`invalid prerequisite target id "${prerequisite.id}"`);
      }
    });

    if (entry.replayable) {
      const target = entry.replayTarget ?? { route: entry.route, view: entry.view };
      if (!target.route.startsWith("/")) {
        report("replayTarget.route must be an absolute path");
      }
      if (entry.view && !entry.replayTarget) {
        // Replay has to be able to select the view, not just the route.
        report("a view-scoped guide must declare an explicit replayTarget");
      }
    } else if (entry.replayTarget) {
      report("replayTarget on a non-replayable guide");
    }

    if (entry.requiresAcknowledgement && entry.persistence === "never") {
      report("an acknowledged guide must record that it was acknowledged");
    }

    if (
      entry.persistence !== "seen-on-complete" &&
      entry.persistence !== "seen-on-any-end" &&
      entry.persistence !== "never"
    ) {
      report("invalid persistence policy");
    }
  });

  // Handoff sources must exist in the same registry, or the successor can never
  // become eligible.
  registry.forEach((entry) => {
    if (entry.autoTrigger?.kind !== "handoff") return;
    const source = entry.autoTrigger.from;
    if (!registry.some((candidate) => candidate.id === source)) {
      problems.push({
        guideId: entry.id,
        problem: `handoff source "${source}" is not registered`,
      });
    }
  });

  return problems;
};

export const findGuide = (
  registry: GuideRegistryEntry[],
  guideId: string,
): GuideRegistryEntry | null =>
  registry.find((entry) => entry.id === guideId) ?? null;

/** Target ids the registry actually depends on; used by the anchor test. */
export const registryTargetIds = (registry: GuideRegistryEntry[]): string[] => {
  const ids = new Set<string>();
  registry.forEach((entry) => {
    entry.steps.forEach((step) => {
      if (step.targetId) ids.add(step.targetId);
    });
    entry.prerequisites.forEach((prerequisite) => {
      if (prerequisite.kind === "target") ids.add(prerequisite.id);
    });
  });
  return [...ids];
};
