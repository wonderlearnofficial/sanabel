import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/StudentUserProvider";
import { localStore } from "../../utils/safeStorage";
import { toFiniteNumber } from "../../utils/numericData";
import { isTutorialV2Enabled, rolloutAtFor } from "./featureFlag";
import { isGuideEligibleForAccount } from "./eligibility";
import { GuideStore, createGuideStore } from "./guideStore";
import { ProgressStore, createProgressStore } from "./progressStore";
import { openHelpTopic } from "./helpFallback";
import { canNavigateForGuide, navigateForGuide } from "./navigator";
import { canSelectGuideView, requestGuideView } from "./GuideViewController";
import { useOverlayCoordinator } from "./OverlayCoordinator";
import { PredicateFacts, evaluatePredicate } from "./predicates";
import { readGuideFacts, subscribeToGuideFacts } from "./facts";
import {
  AutoBudgetState,
  claimAutoSlot,
  decideAutoGuide,
  initialAutoBudget,
  recordAutoGuideEnd,
} from "./queue";
import { V2_REGISTRY, findGuide } from "./registry";
import { resolveExperience } from "./resolveExperience";
import { currentRouteEntry, subscribeToRouteEntries } from "./routeEntry";
import { emitTutorialEvent } from "./telemetry";
import { studentGuideAllowed, waitForStudentReplay } from './studentReplay';
import { parentRegistryForRoute, parentResumeIndex } from './parentRuntime';
import { teacherRegistryForRoute, teacherResumeIndex, waitForTeacherReplay } from './teacherRuntime';
import {
  activeGuideViews,
  subscribeToGuideViews,
} from "./viewRegistry";
import {
  ExperienceContext,
  GuideEndReason,
  GuideRegistryEntry,
  GuideStep,
  OVERLAY_TIER,
} from "./types";

// V2 orchestration. Everything decidable is decided by the pure modules
// (`queue`, `placement`, `targetLadder`, `resolveExperience`); this provider
// only holds React state and wires the signals together.
//
// With the feature flag off it subscribes to nothing, arms no timer and renders
// no overlay: the Phase 0 engine keeps running untouched.

export interface ActiveGuideState {
  guide: GuideRegistryEntry;
  stepIndex: number;
  /** auto = queue, replay/preview = user or admin initiated. */
  origin: "auto" | "replay" | "preview";
  startedAt: number;
}

export interface GuideV2ContextValue {
  enabled: boolean;
  context: ExperienceContext;
  registry: GuideRegistryEntry[];
  active: ActiveGuideState | null;
  activeStep: GuideStep | null;
  facts: PredicateFacts;
  /** Page hook entry point; the queue decides whether anything starts. */
  requestAutoStart: () => void;
  /** User-initiated. Navigates and selects the view first; false when it cannot run. */
  replayGuide: (guideId: string) => boolean;
  /** Display-only run that never persists (admin preview foundation). */
  previewGuide: (guideId: string) => boolean;
  advance: () => void;
  back: () => void;
  complete: () => void;
  defer: () => void;
  endBecauseTargetMissing: () => void;
  isSeen: (guideId: string) => boolean;
}

const GuideV2Context = createContext<GuideV2ContextValue | undefined>(undefined);

const isImpersonatedSession = () =>
  localStore.getItem("isImpersonated") === "true";

const GuideProviderV2Session: React.FC<{
  children: React.ReactNode;
  /** Tests inject a fixture registry; production uses `V2_REGISTRY`. */
  registry?: GuideRegistryEntry[];
  now?: () => number;
}> = ({ children, registry = V2_REGISTRY, now = Date.now }) => {
  const { user } = useUserContext();
  const { i18n } = useTranslation();
  const coordinator = useOverlayCoordinator();

  const [previewing, setPreviewing] = useState(false);
  const [active, setActive] = useState<ActiveGuideState | null>(null);
  const [facts, setFacts] = useState<PredicateFacts>(() => readGuideFacts());
  const [routeEntry, setRouteEntry] = useState(() => currentRouteEntry());
  const [views, setViews] = useState<string[]>(() => activeGuideViews());

  const budgetRef = useRef<AutoBudgetState>(initialAutoBudget());
  const completedHandoffsRef = useRef<string[]>([]);
  const activeRef = useRef<ActiveGuideState | null>(null);
  const studentReplayPending = useRef(0);
  const replaySequence = useRef(0);
  useEffect(() => () => { replaySequence.current++; studentReplayPending.current = 0; }, [user?.id]);
  activeRef.current = active;

  const context = useMemo<ExperienceContext>(
    () =>
      resolveExperience({
        role: user?.role,
        organizationId: user?.organizationId ?? null,
        classId: user?.classId ?? null,
        isImpersonating: isImpersonatedSession(),
        isPreview: previewing,
        locale: i18n.language,
        userId: user?.id ?? null,
        email: user?.email ?? null,
        accountCreatedAt: (user as { accountCreatedAt?: string | null } | null)
          ?.accountCreatedAt ?? null,
      }),
    [
      user?.role,
      user?.organizationId,
      user?.classId,
      user?.id,
      user?.email,
      (user as { accountCreatedAt?: string | null } | null)?.accountCreatedAt,
      i18n.language,
      previewing,
    ],
  );

  const enabled = isTutorialV2Enabled(context.experience);

  const store = useMemo<GuideStore | null>(() => {
    if (!enabled || !user) return null;
    return createGuideStore({
      identity: {
        accountKey: context.accountKey,
        // Phase 0 cached under the email key; keep reading it so a returning
        // user is not re-taught while the server round-trip is in flight.
        legacyCacheKey: user.email ? `seenGuides-${user.email}` : undefined,
      },
      serverEntries: user.seenGuides || [],
      readOnly: context.isImpersonating || context.isPreview,
    });
  }, [enabled, user, context.accountKey, context.isImpersonating, context.isPreview]);

  const progress = useMemo<ProgressStore | null>(
    () =>
      enabled
        ? createProgressStore({
            accountKey: context.accountKey,
            readOnly: context.isImpersonating || context.isPreview,
            now,
          })
        : null,
    [enabled, context.accountKey, context.isImpersonating, context.isPreview, now],
  );

  // Signals. All three unsubscribe on unmount, and none is armed while the
  // flag is off.
  useEffect(() => {
    if (!enabled) return undefined;
    setRouteEntry(currentRouteEntry());
    return subscribeToRouteEntries(setRouteEntry);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    setViews(activeGuideViews());
    return subscribeToGuideViews(setViews);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    setFacts(readGuideFacts());
    return subscribeToGuideFacts(setFacts);
  }, [enabled]);

  // Gameplay numbers the tutorial may read, straight from the profile the app
  // already loaded. No extra request, no gameplay mutation.
  const derivedFacts = useMemo<PredicateFacts>(
    () => ({
      ...facts,
      xp: toFiniteNumber(user?.xp),
      water: toFiniteNumber(user?.water),
      fertilizer: toFiniteNumber(user?.fertilizer),
      waterNeeded: toFiniteNumber(user?.waterNeeded),
      fertilizerNeeded: toFiniteNumber(user?.fertilizerNeeded),
      treeProgress: toFiniteNumber(user?.treeProgress),
      seenGuideIds: store?.knownEntries() ?? [],
    }),
    [facts, user, store],
  );

  const isSeen = useCallback(
    (guideId: string) => {
      const entry = findGuide(registry, guideId);
      if (!entry || !store) return false;
      return store.isSeen({
        guideId: entry.id,
        version: entry.version,
        bumpPolicy: entry.bumpPolicy,
      });
    },
    [registry, store],
  );

  // Rollout gate: an account that existed before Tutorial V2 shipped never gets
  // automatic first-time onboarding. Age comparison lives in `eligibility.ts`;
  // this only reports the verdict and, once per session, the unknown-age case.
  const ageUnknownReportedRef = useRef(false);
  const isAccountEligible = useCallback(
    (entry: GuideRegistryEntry) => {
      const verdict = isGuideEligibleForAccount({
        guide: {
          id: entry.id,
          bumpPolicy: entry.bumpPolicy,
          priority: entry.priority,
        },
        accountCreatedAt: context.accountCreatedAt,
        // Per audience: Teachers and Parents roll out on their own date.
        rolloutAt: rolloutAtFor(context.experience),
        mode: "auto",
      });
      if (verdict.ageUnknown && !ageUnknownReportedRef.current) {
        ageUnknownReportedRef.current = true;
        emitTutorialEvent(
          "guide_account_age_unknown",
          { guideId: entry.id, version: entry.version, experience: context.experience },
          { suppressed: context.isPreview || context.isImpersonating },
        );
      }
      return verdict.eligible;
    },
    [context.accountCreatedAt, context.experience, context.isImpersonating, context.isPreview],
  );

  const hasTarget = useCallback(
    (targetId: string) =>
      typeof document !== "undefined" &&
      document.querySelector(`[data-guide-id="${targetId}"]`) !== null,
    [],
  );

  const startGuide = useCallback(
    (entry: GuideRegistryEntry, origin: ActiveGuideState["origin"], stepIndex = 0) => {
      setActive({ guide: entry, stepIndex, origin, startedAt: now() });
      emitTutorialEvent(
        "guide_started",
        {
          guideId: entry.id,
          version: entry.version,
          experience: context.experience,
          trigger: origin === "auto" ? "auto" : "replay",
        },
        { suppressed: origin === 'preview' || context.isPreview || context.isImpersonating },
      );
    },
    [context.experience, context.isImpersonating, context.isPreview, now],
  );

  const requestAutoStart = useCallback(() => {
    if (studentReplayPending.current) return;
    if (!enabled || !store) return;
    const decision = decideAutoGuide({
      context,
      registry: parentRegistryForRoute(teacherRegistryForRoute(registry, routeEntry.path), routeEntry.path).map(entry =>
        (entry.id === 'solo-first-mission' || entry.id === 'school-first-mission') && routeEntry.path === '/student/challenges'
          ? { ...entry, route: routeEntry.path } : entry),
      path: routeEntry.path,
      activeViews: views,
      facts: derivedFacts,
      isSeen: (entry) =>
        store.isSeen({
          guideId: entry.id,
          version: entry.version,
          bumpPolicy: entry.bumpPolicy,
        }),
      hasTarget,
      completedHandoffs: completedHandoffsRef.current,
      isAccountEligible,
      budget: budgetRef.current,
      routeEntryId: routeEntry.entryId,
      now: now(),
      guideActive: activeRef.current !== null,
      overlayBusy: coordinator.blockedByHigherTier,
    });
    if (!decision.guide) return;

    // Resume a multi-step flow where the learner left it, when the stored
    // position is still valid for this version.
    const saved = progress?.load();
    let stepIndex =
      saved &&
      saved.guideId === decision.guide.id &&
      saved.version === decision.guide.version &&
      saved.stepIndex < decision.guide.steps.length
        ? saved.stepIndex
        : decision.guide.priority === 'first-success' && routeEntry.path === '/student/challenges' ? 1 : 0;

    if (decision.guide.id === 'teacher-first-assignment') {
      stepIndex = teacherResumeIndex(stepIndex, routeEntry.path, derivedFacts);
      if (stepIndex > 0 && stepIndex < 5 && routeEntry.path === '/teacher/home') navigateForGuide('/teacher/studentslist');
    }
      if (decision.guide.id.startsWith('parent-')) stepIndex = parentResumeIndex(decision.guide.id, stepIndex);
      budgetRef.current = claimAutoSlot(budgetRef.current, {
      routeEntryId: routeEntry.entryId,
      accountKey: context.accountKey,
    });
    if (stepIndex > 0 && decision.guide.priority === 'first-success' && routeEntry.path === '/student/home') {
      navigateForGuide('/student/challenges');
    }
    startGuide(decision.guide, "auto", stepIndex);
  }, [
    enabled,
    store,
    context,
    registry,
    routeEntry,
    views,
    derivedFacts,
    hasTarget,
    isAccountEligible,
    coordinator.blockedByHigherTier,
    progress,
    now,
    startGuide,
  ]);

  const endActive = useCallback(
    (reason: GuideEndReason) => {
      const current = activeRef.current;
      if (!current) return;
      const { guide, origin, stepIndex, startedAt } = current;

      if (store && origin !== "preview") {
        store.markEnded({
          guideId: guide.id,
          version: guide.version,
          persistence: guide.persistence,
          reason: origin === "replay" ? "replay-exit" : reason,
        });
      }

      if (reason === "complete") {
        if (origin === 'auto' && guide.priority === 'first-success') progress?.clear();
        if (origin === 'auto' && !completedHandoffsRef.current.includes(guide.id)) {
          completedHandoffsRef.current = [...completedHandoffsRef.current, guide.id];
        }
      } else if (progress && origin === "auto" && guide.priority === 'first-success') {
        // Deferred, preempted or target-missing: keep the position so the flow
        // resumes instead of restarting, and leave the guide unseen.
        progress.save(
          {
            guideId: guide.id,
            version: guide.version,
            stepId: guide.steps[stepIndex]?.id ?? guide.steps[0].id,
            stepIndex,
          },
          guide.steps.length,
        );
      }

      budgetRef.current = recordAutoGuideEnd(budgetRef.current, {
        now: now(),
        wasAuto: origin === "auto",
      });

      const suppressed = context.isPreview || context.isImpersonating || origin === "preview";
      const event =
        reason === "complete"
          ? "guide_completed"
          : reason === "target-missing"
            ? "guide_target_missing"
            : "guide_deferred";
      emitTutorialEvent(
        event,
        {
          guideId: guide.id,
          version: guide.version,
          stepId: guide.steps[stepIndex]?.id,
          stepIndex,
          reason,
          durationMs: now() - startedAt,
        },
        { suppressed },
      );

      setActive(null);
      if (origin === "preview") setPreviewing(false);
    },
    [store, progress, now, context.isPreview, context.isImpersonating],
  );

  const complete = useCallback(() => endActive("complete"), [endActive]);
  const defer = useCallback(() => endActive("defer"), [endActive]);
  const endBecauseTargetMissing = useCallback(
    () => endActive("target-missing"),
    [endActive],
  );

  const advance = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;
    if (current.stepIndex >= current.guide.steps.length - 1) {
      complete();
      return;
    }
    const nextIndex = current.stepIndex + 1;
    setActive({ ...current, stepIndex: nextIndex });
    if (current.origin === "auto" && current.guide.priority === 'first-success') {
      progress?.save(
        {
          guideId: current.guide.id,
          version: current.guide.version,
          stepId: current.guide.steps[nextIndex].id,
          stepIndex: nextIndex,
        },
        current.guide.steps.length,
      );
    }
    emitTutorialEvent(
      "guide_step_viewed",
      {
        guideId: current.guide.id,
        version: current.guide.version,
        stepId: current.guide.steps[nextIndex].id,
        stepIndex: nextIndex,
      },
      { suppressed: context.isPreview || context.isImpersonating },
    );
  }, [complete, progress, context.isPreview, context.isImpersonating]);

  const back = useCallback(() => {
    const current = activeRef.current;
    if (!current || current.stepIndex === 0) return;
    setActive({ ...current, stepIndex: current.stepIndex - 1 });
  }, []);

  // Manual replay: user initiated, so it ignores the automatic budget and the
  // cooldown. It navigates and selects the view first, and refuses rather than
  // starting a guide whose first spotlight is on another screen.
  const startOnDemand = useCallback(
    (guideId: string, origin: "replay" | "preview"): boolean => {
      if (!enabled) return false;
      const entry = findGuide(registry, guideId);
      if (!entry || entry.steps.length === 0) return false;
      if (origin === "replay" && !entry.replayable) return false;

      if (entry.experiences.length === 1 && entry.experiences[0] === 'teacher') {
        if (context.experience !== 'teacher') return false;
        if (origin === 'preview') {
          if (activeRef.current) endActive('preempted');
          setPreviewing(true);
          startGuide({ ...entry, steps: entry.steps.map(step => ({ ...step, targetId: undefined, advanceOn: 'next-button' })) }, 'preview');
          return true;
        }
        const predicates = [...entry.prerequisites, entry.autoTrigger].filter(p => p.kind === 'predicate');
        if (predicates.some(p => p.kind === 'predicate' && !evaluatePredicate(p.id, { context, facts: derivedFacts }))) {
          openHelpTopic(entry.helpTopicId); return false;
        }
        const destination = entry.replayTarget ?? { route: entry.route, view: entry.view };
        const sequence = ++replaySequence.current;
        studentReplayPending.current = sequence;
        if (window.location.pathname !== destination.route && !navigateForGuide(destination.route)) {
          studentReplayPending.current = 0; openHelpTopic(entry.helpTopicId); return false;
        }
        void waitForTeacherReplay(entry, () => replaySequence.current !== sequence).then(ready => {
          if (replaySequence.current !== sequence) return;
          studentReplayPending.current = 0;
          if (!ready) { openHelpTopic(entry.helpTopicId); return; }
          if (activeRef.current) endActive('preempted');
          startGuide(entry, 'replay');
          emitTutorialEvent('guide_replayed', { guideId: entry.id, version: entry.version, trigger: 'replay' }, { suppressed: context.isImpersonating });
        });
        return true;
      }

      // Student replay waits for lazy routes and local tabs before starting.
      // Rollout/account-age decisions above remain owned by the eligibility layer.
      if (entry.id.startsWith('solo-') || entry.id.startsWith('school-') || entry.id.startsWith('parent-')) {
        if (origin === 'preview') {
          if (activeRef.current) endActive('preempted');
          setPreviewing(true);
          // Display-only preview must work without any live gameplay controls.
          startGuide({ ...entry, steps: entry.steps.map(step => ({ ...step, targetId: undefined, advanceOn: 'next-button' })) }, 'preview');
          return true;
        }
        if (!studentGuideAllowed(entry, context, derivedFacts) || (entry.autoTrigger.kind === 'predicate' && !evaluatePredicate(entry.autoTrigger.id, { context, facts: derivedFacts }))) {
          openHelpTopic(entry.helpTopicId);
          return false;
        }
        const destination = entry.replayTarget ?? { route: entry.route, view: entry.view };
        const sequence = ++replaySequence.current;
        studentReplayPending.current = sequence;
        if (window.location.pathname !== destination.route && !navigateForGuide(destination.route)) {
          studentReplayPending.current = 0;
          openHelpTopic(entry.helpTopicId);
          return false;
        }
        void waitForStudentReplay(entry, () => replaySequence.current !== sequence).then(ready => {
          if (replaySequence.current !== sequence) return;
          studentReplayPending.current = 0;
          if (!ready) { openHelpTopic(entry.helpTopicId); return; }
          if (entry.experiences.includes('parent') && !studentGuideAllowed(entry, context, readGuideFacts())) {
            openHelpTopic(entry.helpTopicId); return;
          }
          if (activeRef.current) endActive('preempted');
          startGuide(entry, origin);
          emitTutorialEvent('guide_replayed', { guideId: entry.id, version: entry.version, trigger: 'replay' }, { suppressed: context.isImpersonating });
        });
        return true;
      }

      const target = entry.replayTarget ?? { route: entry.route, view: entry.view };
      const onRoute =
        typeof window !== "undefined"
          ? window.location.pathname === target.route
          : routeEntry.path === target.route;

      if (!onRoute) {
        if (!canNavigateForGuide()) {
          openHelpTopic(entry.helpTopicId);
          return false;
        }
        navigateForGuide(target.route);
      }
      if (target.view) {
        if (!canSelectGuideView(target.view)) {
          openHelpTopic(entry.helpTopicId);
          return false;
        }
        requestGuideView(target.view);
      }

      const firstTargetId = entry.steps.find((step) => step.targetId)?.targetId;
      if (firstTargetId && !hasTarget(firstTargetId)) {
        // The overlay's ladder handles a late-mounting element only for a guide
        // that has already started; refusing here keeps the engine free.
        openHelpTopic(entry.helpTopicId);
        return false;
      }

      // An optional guide already on screen yields to the user's request; its
      // progress is preserved and it stays unseen.
      if (activeRef.current) endActive("preempted");

      if (origin === "preview") setPreviewing(true);
      startGuide(entry, origin);
      emitTutorialEvent(
        "guide_replayed",
        { guideId: entry.id, version: entry.version, trigger: "replay" },
        { suppressed: origin === "preview" },
      );
      return true;
    },
    [enabled, registry, routeEntry.path, hasTarget, endActive, startGuide, context, derivedFacts],
  );

  const replayGuide = useCallback(
    (guideId: string) => startOnDemand(guideId, "replay"),
    [startOnDemand],
  );
  const previewGuide = useCallback(
    (guideId: string) => startOnDemand(guideId, "preview"),
    [startOnDemand],
  );

  // A blocking overlay (permissions, force update) takes the screen: the guide
  // steps aside without being marked seen, keeping its progress.
  useEffect(() => {
    if (!enabled) return;
    if (coordinator.blockedByHigherTier && activeRef.current) {
      endActive("preempted");
    }
  }, [enabled, coordinator.blockedByHigherTier, endActive]);

  // Hold the guide tier while an overlay is on screen, so optional tips and
  // toasts can tell.
  const releaseClaim = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;
    if (active && !releaseClaim.current) {
      releaseClaim.current = coordinator.claim(OVERLAY_TIER.guide, "guide");
    }
    if (!active && releaseClaim.current) {
      releaseClaim.current();
      releaseClaim.current = null;
    }
    return undefined;
  }, [enabled, active, coordinator]);

  useEffect(
    () => () => {
      releaseClaim.current?.();
      releaseClaim.current = null;
    },
    [],
  );

  const activeStep = active ? active.guide.steps[active.stepIndex] ?? null : null;

  const value = useMemo<GuideV2ContextValue>(
    () => ({
      enabled,
      context,
      registry,
      active,
      activeStep,
      facts: derivedFacts,
      requestAutoStart,
      replayGuide,
      previewGuide,
      advance,
      back,
      complete,
      defer,
      endBecauseTargetMissing,
      isSeen,
    }),
    [
      enabled,
      context,
      registry,
      active,
      activeStep,
      derivedFacts,
      requestAutoStart,
      replayGuide,
      previewGuide,
      advance,
      back,
      complete,
      defer,
      endBecauseTargetMissing,
      isSeen,
    ],
  );

  return <GuideV2Context.Provider value={value}>{children}</GuideV2Context.Provider>;
};

// A mounted app can change accounts without a page reload. Reset the entire
// orchestration lifetime so an old overlay/replay cannot write through the new
// account's store or carry its budget and handoffs into that account.
export const GuideProviderV2: React.FC<React.ComponentProps<typeof GuideProviderV2Session>> = props => {
  const { user } = useUserContext();
  const invalidExperienceReportedRef = useRef(false);
  const impersonating = isImpersonatedSession();
  // Keep the diagnostic lifetime outside account-specific orchestration.
  useEffect(() => {
    if (!user || ['Student', 'Teacher', 'Parent', 'Admin'].includes(user.role)) return;
    if (invalidExperienceReportedRef.current) return;
    invalidExperienceReportedRef.current = true;
    emitTutorialEvent('guide_experience_invalid', { experience: 'unsupported' }, { suppressed: impersonating });
  }, [user, impersonating]);
  const sessionKey = JSON.stringify([
    user?.id ?? user?.email ?? null, user?.role ?? null,
    user?.organizationId ?? null, user?.classId ?? null, impersonating,
  ]);
  return <GuideProviderV2Session key={sessionKey} {...props} />;
};

export const useGuideV2 = (): GuideV2ContextValue => {
  const context = useContext(GuideV2Context);
  if (!context) {
    throw new Error("useGuideV2 must be used within a GuideProviderV2");
  }
  return context;
};

/** Safe in components that may render outside the provider (legacy screens). */
export const useOptionalGuideV2 = (): GuideV2ContextValue | null =>
  useContext(GuideV2Context) ?? null;
