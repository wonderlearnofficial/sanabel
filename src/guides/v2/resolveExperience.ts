import { requiresMissionApproval } from "../../utils/studentGameplayMode";
import { ExperienceContext, RewardMode, TutorialExperience, TutorialScope } from "./types";

// The single place that decides which tutorial experience a session is in.
// Components must never re-derive this, and must never read `classId` to decide
// reward wording: organization membership is the product rule, and a class-only
// legacy record fails closed to approval (docs/GAMEPLAY_ALIGNMENT.md §5-8).

export interface ResolveExperienceInput {
  role: string | null | undefined;
  /** Student.organizationId, or the Admin scope from `GET /admin/me`. */
  organizationId?: number | null;
  /** Student.classId. Class features only — never a reward-mode switch. */
  classId?: number | null;
  /** Admin only, from the server's derived `isSuperAdmin`. */
  isSuperAdmin?: boolean | null;
  isImpersonating?: boolean;
  isPreview?: boolean;
  childCount?: number;
  locale?: string | null;
  /** Prefer the numeric account id; email is the fallback identity. */
  userId?: number | null;
  email?: string | null;
  /** `Users.createdAt` as an ISO string, straight from the profile response. */
  accountCreatedAt?: string | null;
}

const toLocale = (locale: string | null | undefined): "ar" | "en" =>
  locale === "en" ? "en" : "ar";

const toAccountKey = (input: ResolveExperienceInput): string => {
  if (typeof input.userId === "number" && Number.isFinite(input.userId)) {
    return `u${input.userId}`;
  }
  return input.email ? `e:${input.email}` : "anonymous";
};

const studentContext = (
  input: ResolveExperienceInput,
): { experience: TutorialExperience; rewardMode: RewardMode; scope: TutorialScope; dataFault: boolean } => {
  const hasOrganization = input.organizationId != null;
  const hasClass = input.classId != null;
  // Same predicate the server enforces, so tutorial copy can never promise a
  // reward the API will refuse.
  const approvalRequired = requiresMissionApproval({
    organizationId: input.organizationId ?? null,
    classId: input.classId ?? null,
  });

  return {
    experience: approvalRequired ? "school-student" : "solo",
    rewardMode: approvalRequired ? "approval" : "instant",
    scope: approvalRequired ? "organization" : "solo",
    // A class without an organization is inconsistent data, not a mode.
    dataFault: !hasOrganization && hasClass,
  };
};

export const resolveExperience = (
  input: ResolveExperienceInput,
): ExperienceContext => {
  const base = {
    accountCreatedAt: input.accountCreatedAt ?? null,
    isImpersonating: input.isImpersonating === true,
    isPreview: input.isPreview === true,
    childCount: Math.max(0, Math.trunc(input.childCount ?? 0)),
    locale: toLocale(input.locale),
    accountKey: toAccountKey(input),
  };

  switch (input.role) {
    case "Student": {
      const student = studentContext(input);
      return { ...base, ...student };
    }
    case "Teacher":
      return {
        ...base,
        experience: "teacher",
        rewardMode: "instant",
        scope: "organization",
        dataFault: false,
      };
    case "Parent":
      return {
        ...base,
        experience: "parent",
        rewardMode: "instant",
        scope: "solo",
        dataFault: false,
      };
    case "Admin": {
      // Authoritative scope only: the server derives `isSuperAdmin` from the
      // Admins row, and a null organization means platform scope. Never infer
      // admin scope from grade or class.
      const isSuperAdmin =
        input.isSuperAdmin === true ||
        (input.isSuperAdmin == null && input.organizationId == null);
      return {
        ...base,
        experience: isSuperAdmin ? "super-admin" : "school-admin",
        rewardMode: "instant",
        scope: isSuperAdmin ? "platform" : "organization",
        dataFault: false,
      };
    }
    default: {
      // Unknown, missing or malformed role. This is not a tutorial audience:
      // guessing a role would show a learner the wrong app. Nothing
      // auto-starts, nothing persists, and no registry guide may declare this
      // experience. Reward wording still fails closed to approval so no
      // instant-reward copy can leak from a shared component.
      return {
        ...base,
        experience: "unsupported",
        rewardMode: "approval",
        scope: "unsupported",
        dataFault: false,
      };
    }
  }
};

/** True when the session has no tutorial audience at all. */
export const isUnsupportedExperience = (context: ExperienceContext): boolean =>
  context.experience === "unsupported";

/** Copy helper so no component writes its own reward-mode branch. */
export const isInstantReward = (context: ExperienceContext): boolean =>
  context.rewardMode === "instant";

/** True when guide state must stay read-only for this session. */
export const isReadOnlyForGuideState = (context: ExperienceContext): boolean =>
  context.isImpersonating || context.isPreview;
