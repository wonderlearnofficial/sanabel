import { ExperienceContext } from "./types";

// Named pure predicates. The registry references these by id, so a guide's
// trigger condition is always reviewable, testable and greppable — never an
// anonymous closure buried in content.
//
// Phase 1 implements only what the foundation needs. Predicates whose data is
// not yet available to the guide layer are declared as `pending` so the
// registry can still name them, and `validateRegistry` can still prove a name
// resolves, while an unimplemented predicate is never treated as satisfied.

export interface PredicateInput {
  context: ExperienceContext;
  /** Snapshot of the gameplay/session facts the guide layer is allowed to read. */
  facts: PredicateFacts;
}

export interface PredicateFacts {
  parentChildrenKnown?: boolean;
  teacherStudentCount?: number;
  teacherClassCount?: number;
  teacherPendingCount?: number;
  teacherSelectedCount?: number;
  teacherWizardOpen?: boolean;
  teacherConfirming?: boolean;
  teacherAction?: 'assign' | 'complete';
  studentClassAvailable?: boolean;
  approvedApprovalCount?: number;
  deniedApprovalCount?: number;
  xp?: number;
  water?: number;
  fertilizer?: number;
  waterNeeded?: number;
  fertilizerNeeded?: number;
  treeProgress?: number;
  pendingApprovalCount?: number;
  decidedApprovalCount?: number;
  assignedMissionCount?: number;
  linkedChildCount?: number;
  seenGuideIds?: string[];
}

export type GuidePredicate = (input: PredicateInput) => boolean;

interface PredicateDefinition {
  id: string;
  /** false = declared for later phases; never satisfied, never crashes. */
  implemented: boolean;
  evaluate: GuidePredicate;
}

const never: GuidePredicate = () => false;

const definitions: PredicateDefinition[] = [
  { id: 'parentChildrenKnown', implemented: true, evaluate: ({ context, facts }) => context.experience === 'parent' && facts.parentChildrenKnown === true },
  { id: 'teacherHasStudents', implemented: true, evaluate: ({ context, facts }) => context.experience === 'teacher' && (facts.teacherStudentCount ?? 0) > 0 },
  { id: 'teacherHasClasses', implemented: true, evaluate: ({ context, facts }) => context.experience === 'teacher' && (facts.teacherClassCount ?? 0) > 0 },
  { id: 'teacherHasPending', implemented: true, evaluate: ({ context, facts }) => context.experience === 'teacher' && (facts.teacherPendingCount ?? 0) > 0 },
  { id: 'teacherCompleting', implemented: true, evaluate: ({ context, facts }) => context.experience === 'teacher' && facts.teacherAction === 'complete' && facts.teacherConfirming === true },
  { id: 'teacherBulkReady', implemented: true, evaluate: ({ context, facts }) => context.experience === 'teacher' && (facts.teacherSelectedCount ?? 0) > 1 && (facts.seenGuideIds ?? []).includes('teacher-first-assignment:v1') },
  {
    id: 'hasStudentClass', implemented: true,
    evaluate: ({ context, facts }) => context.experience === 'school-student' && facts.studentClassAvailable === true,
  },
  {
    id: "always",
    implemented: true,
    evaluate: () => true,
  },
  {
    id: "xpAboveZero",
    implemented: true,
    evaluate: ({ facts }) => (facts.xp ?? 0) > 0,
  },
  {
    // Growth is manual and consumes water + fertilizer; the guide only reads
    // whether the real grow action would be accepted.
    id: "canGrowTree",
    implemented: true,
    evaluate: ({ facts }) =>
      (facts.waterNeeded ?? 0) > 0 &&
      (facts.fertilizerNeeded ?? 0) > 0 &&
      (facts.water ?? 0) >= (facts.waterNeeded ?? 0) &&
      (facts.fertilizer ?? 0) >= (facts.fertilizerNeeded ?? 0),
  },
  {
    id: "hasPendingRequest",
    implemented: true,
    evaluate: ({ facts }) => (facts.pendingApprovalCount ?? 0) > 0,
  },
  {
    id: "hasDecidedRequest",
    implemented: true,
    evaluate: ({ facts }) => (facts.decidedApprovalCount ?? 0) > 0,
  },
  {
    id: "hasAssignedMission",
    implemented: true,
    evaluate: ({ facts }) => (facts.assignedMissionCount ?? 0) > 0,
  },
  {
    id: "noLinkedChild",
    implemented: true,
    evaluate: ({ context, facts }) =>
      (facts.linkedChildCount ?? context.childCount) === 0,
  },
  {
    id: "hasLinkedChild",
    implemented: true,
    evaluate: ({ context, facts }) =>
      (facts.linkedChildCount ?? context.childCount) > 0,
  },
  {
    id: "multipleChildren",
    implemented: true,
    evaluate: ({ context, facts }) =>
      (facts.linkedChildCount ?? context.childCount) > 1,
  },
  {
    id: "approvalRewardMode",
    implemented: true,
    evaluate: ({ context }) => context.rewardMode === "approval",
  },
  {
    id: "instantRewardMode",
    implemented: true,
    evaluate: ({ context }) => context.rewardMode === "instant",
  },
  // Declared for later phases: these need signals the guide layer does not
  // read yet (wizard-local state, and a seen-set query that belongs to the
  // Teacher content phase).
  { id: "assignmentFlowSeen", implemented: false, evaluate: never },
  { id: "completeModeSelected", implemented: false, evaluate: never },
];

const byId = new Map(definitions.map((definition) => [definition.id, definition]));

export const predicateIds = (): string[] => definitions.map((d) => d.id);

export const isPredicateRegistered = (id: string): boolean => byId.has(id);

export const isPredicateImplemented = (id: string): boolean =>
  byId.get(id)?.implemented === true;

/** Unknown or not-yet-implemented predicates evaluate to false, never throw. */
export const evaluatePredicate = (id: string, input: PredicateInput): boolean => {
  const definition = byId.get(id);
  if (!definition || !definition.implemented) return false;
  try {
    return definition.evaluate(input);
  } catch {
    return false;
  }
};
