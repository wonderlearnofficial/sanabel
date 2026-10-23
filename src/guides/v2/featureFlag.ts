import { localStore } from "../../utils/safeStorage";
import { TutorialExperience } from "./types";

// Tutorial V2 rollout switch. Local config only — no cloud flag service.
//
// OFF (the default, and the state this task ships) means the Phase 0 engine
// keeps running exactly as before: nothing in V2 mounts, nothing subscribes,
// nothing persists.
//
// Sources, in precedence order:
//   1. `localStorage["sanabel:tutorialV2"]` — developer override on a device.
//        "on" / "off", or a comma-separated experience list.
//   2. `VITE_TUTORIAL_V2` — build config. "true"/"1"/"on" enables every
//        experience; a comma-separated list enables only those.
//
// Both are read through `localStore`, which is exception-safe in private mode.

const STORAGE_KEY = "sanabel:tutorialV2";
// Deliberately a second, separate key. "The V2 engine is on" and "treat this
// old account as a new production account" are different claims, and a device
// flag must never silently redefine account age in production.
const DEV_ACCOUNT_AGE_KEY = "sanabel:tutorialV2TreatAccountAsNew";
const STUDENT_ROLLOUT_ENV = "VITE_TUTORIAL_V2_STUDENT_ROLLOUT_AT";
const STUDENT_ROLLOUT_STORAGE_KEY = "sanabel:tutorialV2StudentRolloutAt";

// Rollout instants are per audience: Teachers and Parents are onboarded on
// their own date, and reusing the Student date for adults would silently
// decide something product never asked for. An unset key means "not rolled out
// for this audience", which withholds age-gated guides (see `eligibility.ts`).
const ROLLOUT_CONFIG: Partial<
  Record<TutorialExperience, { env: string; storageKey: string }>
> = {
  solo: { env: STUDENT_ROLLOUT_ENV, storageKey: STUDENT_ROLLOUT_STORAGE_KEY },
  "school-student": {
    env: STUDENT_ROLLOUT_ENV,
    storageKey: STUDENT_ROLLOUT_STORAGE_KEY,
  },
  teacher: {
    env: "VITE_TUTORIAL_V2_TEACHER_ROLLOUT_AT",
    storageKey: "sanabel:tutorialV2TeacherRolloutAt",
  },
  parent: {
    env: "VITE_TUTORIAL_V2_PARENT_ROLLOUT_AT",
    storageKey: "sanabel:tutorialV2ParentRolloutAt",
  },
};

const ALL_EXPERIENCES: TutorialExperience[] = [
  "solo",
  "school-student",
  "teacher",
  "parent",
  "school-admin",
  "super-admin",
];

const isExperience = (value: string): value is TutorialExperience =>
  (ALL_EXPERIENCES as string[]).includes(value);

const parseSetting = (raw: string | null | undefined): TutorialExperience[] => {
  if (!raw) return [];
  const value = raw.trim().toLowerCase();
  if (value === "" || value === "off" || value === "false" || value === "0") {
    return [];
  }
  if (value === "on" || value === "true" || value === "1" || value === "all") {
    return [...ALL_EXPERIENCES];
  }
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(isExperience);
};

const readEnv = (name: string): string | undefined => {
  try {
    const env = import.meta.env as Record<string, string | undefined> | undefined;
    return env?.[name] ?? undefined;
  } catch {
    // `import.meta.env` is always defined under Vite; guarded so a non-Vite
    // consumer (a plain node test runner) cannot throw here.
    return undefined;
  }
};

const buildSetting = (): string | undefined => readEnv("VITE_TUTORIAL_V2");

const isDevelopmentBuild = (): boolean => {
  try {
    const env = import.meta.env as { DEV?: boolean; MODE?: string } | undefined;
    return env?.DEV === true || env?.MODE === "development" || env?.MODE === "test";
  } catch {
    return false;
  }
};

/**
 * The instant Tutorial V2 became available to Students, ISO-8601. Accounts
 * created before it never receive automatic first-time onboarding.
 * Unset means "not rolled out yet": age-gated guides stay off (see
 * `eligibility.ts`), which is the safe direction.
 */
export const studentRolloutAt = (): string | null =>
  localStore.getItem(STUDENT_ROLLOUT_STORAGE_KEY) ??
  readEnv(STUDENT_ROLLOUT_ENV) ??
  null;

/**
 * The rollout instant for one audience, or null when that audience has no
 * configured date. Student experiences keep the existing key, so Phase 2A
 * behaviour is unchanged.
 */
export const rolloutAtFor = (
  experience: TutorialExperience | null | undefined,
): string | null => {
  const config = experience ? ROLLOUT_CONFIG[experience] : undefined;
  if (!config) return null;
  return localStore.getItem(config.storageKey) ?? readEnv(config.env) ?? null;
};

/** Test/developer helper, per audience. */
export const setRolloutOverrideFor = (
  experience: TutorialExperience,
  value: string | null,
): void => {
  const config = ROLLOUT_CONFIG[experience];
  if (!config) return;
  if (value === null) {
    localStore.removeItem(config.storageKey);
    return;
  }
  localStore.setItem(config.storageKey, value);
};

/**
 * Development/test only: treat the signed-in account as if it were created
 * after the rollout. Ignored entirely in a production build, so an old
 * production account can never be re-onboarded by a stray localStorage value.
 */
export const isDevAccountAgeOverrideEnabled = (): boolean =>
  isDevelopmentBuild() && localStore.getItem(DEV_ACCOUNT_AGE_KEY) === "true";

/** Test/developer helpers. Not wired to any UI. */
export const setStudentRolloutOverride = (value: string | null): void => {
  if (value === null) {
    localStore.removeItem(STUDENT_ROLLOUT_STORAGE_KEY);
    return;
  }
  localStore.setItem(STUDENT_ROLLOUT_STORAGE_KEY, value);
};

export const setDevAccountAgeOverride = (enabled: boolean): void => {
  if (!enabled) {
    localStore.removeItem(DEV_ACCOUNT_AGE_KEY);
    return;
  }
  localStore.setItem(DEV_ACCOUNT_AGE_KEY, "true");
};

/** Experiences V2 is enabled for right now. Empty array = V2 is off. */
export const enabledV2Experiences = (): TutorialExperience[] => {
  const override = parseSetting(localStore.getItem(STORAGE_KEY));
  if (override.length > 0) return override;
  if (localStore.getItem(STORAGE_KEY)) return []; // explicit "off" wins over build config
  return parseSetting(buildSetting());
};

export const isTutorialV2Enabled = (
  experience?: TutorialExperience | null,
): boolean => {
  const enabled = enabledV2Experiences();
  if (enabled.length === 0) return false;
  if (!experience) return true;
  return enabled.includes(experience);
};

/** Test/developer helper. Not wired to any UI. */
export const setTutorialV2Override = (
  value: "on" | "off" | TutorialExperience[] | null,
): void => {
  if (value === null) {
    localStore.removeItem(STORAGE_KEY);
    return;
  }
  localStore.setItem(
    STORAGE_KEY,
    Array.isArray(value) ? value.join(",") : value,
  );
};
