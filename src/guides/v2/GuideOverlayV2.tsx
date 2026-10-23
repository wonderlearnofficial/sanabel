import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOptionalGuideV2 } from "./GuideProviderV2";
import { Rect, SPOTLIGHT_PADDING, computePlacement } from "./placement";
import {
  evaluateTargetLadder,
  nextLadderDeadline,
} from "./targetLadder";
import { GuideStep, RewardMode } from "./types";
import { subscribeStudentGuideSignals } from './studentSignals';
import { studentGuideVisual, studentVisuals } from './studentContent';
import { openHelpTopic } from './helpFallback';
import { chromeKey } from './chromeCopy';
import { calculateLevel } from '../../utils/LevelCalculator';

// V2 overlay. Differences from the Phase 0 overlay that matter:
//   * placement is measured, never a guessed card height
//   * a missing target runs a finite ladder and then parks — no invisible hang
//   * reward wording comes from `rewardMode`, never from a local classId check
//   * dialog semantics, focus management and reduced motion are first-class
//   * observation is scoped to the active step and torn down with it

const BASE_CARD_WIDTH = 340;

const resolveStepCopy = (
  step: GuideStep,
  rewardMode: RewardMode,
): { titleKey: string; descriptionKey?: string } => {
  const variant = step.rewardModeCopy?.[rewardMode];
  if (variant) return variant;
  return { titleKey: step.titleKey, descriptionKey: step.descriptionKey };
};

const measureTarget = (targetId: string | undefined): Rect | null => {
  if (!targetId) return null;
  const element = document.querySelector<HTMLElement>(
    `[data-guide-id="${targetId}"]`,
  );
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
};

const GuideOverlayV2: React.FC = () => {
  const guides = useOptionalGuideV2();
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const stepStartedAt = useRef<number>(0);

  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: BASE_CARD_WIDTH, height: 180 });
  const [elapsed, setElapsed] = useState(0);
  const [gameplayDialog, setGameplayDialog] = useState(false);

  const active = guides?.active ?? null;
  const step = guides?.activeStep ?? null;
  const enabled = guides?.enabled === true;
  const targetId = step?.targetId;
  const isRTL = i18n.language !== "en";
  const isStudentGuide = active?.guide.id.startsWith('solo-') || active?.guide.id.startsWith('school-');
  const dismiss = useCallback(() => {
    if (active?.guide.priority === 'first-success' || step?.successEvent) guides?.defer();
    else if (active?.guide.persistence === 'seen-on-any-end') guides?.complete();
    else if ((active?.guide.steps.length ?? 0) > 1) guides?.defer();
    else guides?.complete();
  }, [active, step, guides]);
  useEffect(() => {
    if (!step?.advanceWhenTargetPresent || active?.origin === 'preview') return;
    let advanced = false;
    const inspect = () => {
      if (advanced || !document.querySelector(`[data-guide-id="${step.advanceWhenTargetPresent}"]`)) return;
      advanced = true;
      guides?.advance();
    };
    // Scoped to the mission-selection step; disconnected as soon as a real
    // actionable mission appears or the learner leaves this guide.
    const observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-guide-id'] });
    inspect();
    return () => observer.disconnect();
  }, [step, active?.origin, guides]);
  useEffect(() => subscribeStudentGuideSignals(signal => {
    if (signal.type === 'dialog') { setGameplayDialog(signal.open); return; }
    if (!active || !isStudentGuide || active.origin === 'preview') return;
    if (signal.type === 'no-approver' && active.guide.id === 'school-first-mission') guides?.defer();
    else if (signal.type === step?.successEvent) guides?.advance();
  }), [active, step, guides, isStudentGuide]);

  // Remember what had focus so it can be handed back when the guide ends.
  useEffect(() => {
    if (!active) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [active?.guide.id]);

  // Step lifecycle: reset the ladder clock and re-measure.
  useEffect(() => {
    if (!step) return;
    stepStartedAt.current = Date.now();
    setElapsed(0);
    setRect(measureTarget(step.targetId));
  }, [step?.id, step?.targetId, active?.guide.id]);

  // Target observation, scoped to the active step only. A ResizeObserver on the
  // target plus a coarse ladder tick — no app-wide MutationObserver, no 100ms
  // polling, nothing left armed once the guide ends.
  useEffect(() => {
    if (!active || !step || !targetId) return undefined;

    let cancelled = false;
    const remeasure = () => {
      if (cancelled) return;
      setRect(measureTarget(targetId));
      setElapsed(Date.now() - stepStartedAt.current);
    };

    remeasure();

    const element = document.querySelector<HTMLElement>(
      `[data-guide-id="${targetId}"]`,
    );
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(remeasure) : null;
    if (element && resizeObserver) resizeObserver.observe(element);

    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);

    // One timer at a time, aimed at the next ladder deadline rather than a
    // permanent interval.
    let timer: number | undefined;
    const arm = () => {
      const delay = nextLadderDeadline(Date.now() - stepStartedAt.current);
      if (delay === null) return;
      timer = window.setTimeout(() => {
        remeasure();
        arm();
      }, Math.max(250, delay));
    };
    arm();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [active?.guide.id, step?.id, targetId]);

  // Measure our own card so placement uses real height.
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    if (height > 0 && (Math.abs(height - cardSize.height) > 1 || Math.abs(width - cardSize.width) > 1)) {
      setCardSize({ width: width || BASE_CARD_WIDTH, height });
    }
  }, [step?.id, rect, cardSize.height, cardSize.width]);

  const ladder = step
    ? evaluateTargetLadder({ step, targetFound: rect !== null, elapsedMs: elapsed })
    : null;

  // Park: the element never arrived. End the guide (unseen, progress kept) so
  // nothing is starved behind an invisible overlay.
  useEffect(() => {
    if (!active || !ladder?.shouldPark) return;
    // The provider emits the end event once, with preview/impersonation guards.
    guides?.endBecauseTargetMissing();
    if (active.origin === 'replay') openHelpTopic(active.guide.helpTopicId);
  }, [active, ladder?.shouldPark, step?.id, guides]);

  const isInteraction =
    step?.advanceOn === "interaction" && !ladder?.convertToNextButton;

  // Interaction steps advance on a real tap of the real control. The guide
  // never performs the action itself.
  useEffect(() => {
    if (!active || !isInteraction || !targetId || step?.successEvent || step?.advanceWhenTargetPresent || active.origin === 'preview') return undefined;
    const handler = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.closest(`[data-guide-id="${targetId}"]`)
      ) {
        guides?.advance();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [active, isInteraction, targetId, guides]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active) return;
      if (gameplayDialog) return;
      if (event.key === 'Tab' && !isInteraction) {
        const controls = cardRef.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]');
        if (controls?.length) {
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if (event.key === "Escape") {
        // Escape is "not now" for a multi-step flow and "understood" for a
        // single card, matching the skip semantics in the design.
        dismiss();
      }
    },
    [active, dismiss, gameplayDialog, isInteraction],
  );

  useEffect(() => {
    if (!active) return undefined;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onKeyDown]);

  // Focus: the card for a read-and-continue step, the real control for an
  // interaction step, so a keyboard user can actually perform the action. The
  // application is never made wholly inert.
  useEffect(() => {
    if (!active || !step) return;
    if (isInteraction && targetId) {
      const element = document.querySelector<HTMLElement>(
        `[data-guide-id="${targetId}"]`,
      );
      const parentControl = active.guide.experiences.includes('parent') && element && !element.matches('button, input, [tabindex]')
        ? element.querySelector<HTMLElement>('input, button:not(:disabled), [tabindex="0"]') : null;
      (parentControl ?? element)?.focus?.({ preventScroll: false });
      return;
    }
    cardRef.current?.focus();
  }, [active?.guide.id, step?.id, isInteraction, targetId, rect !== null]);

  if (!enabled || !active || !step || !ladder) return null;
  if (gameplayDialog && isStudentGuide && active.origin !== 'preview') return null;
  if (ladder.phase === "waiting" || ladder.phase === "retry") {
    // Still resolving. Nothing is rendered yet, but the ladder is armed and
    // will either resolve, fall back or park — it cannot wait forever.
    if (!rect && step.targetId) return null;
  }

  const showSpotlight = rect !== null && !ladder.useCenteredFallback;
  const copy = resolveStepCopy(step, guides.context.rewardMode);
  const placement = computePlacement({
    target: showSpotlight ? rect : null,
    card: { width: BASE_CARD_WIDTH, height: cardSize.height },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    isRTL,
    reservedBottom: 0,
  });

  const isLastStep = active.stepIndex === active.guide.steps.length - 1;
  const totalSteps = active.guide.steps.length;
  const visualKey = isStudentGuide ? studentGuideVisual(step.id) : undefined;
  const visuals = visualKey ? studentVisuals[visualKey] : [];
  const level = calculateLevel(guides.facts.xp ?? 0);
  const animation = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.1 },
      }
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.2 },
      };

  return (
    <>
      {showSpotlight && rect ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed z-[9990] rounded-xl ${
            prefersReducedMotion ? "" : "transition-all duration-300"
          }`}
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            outline: "2px solid rgba(255,255,255,0.85)",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9990] bg-black/45"
        />
      )}

      <motion.div
        ref={cardRef}
        role="dialog"
        // A guide that asks for a real tap must not trap focus inside itself.
        aria-modal={isInteraction ? undefined : true}
        aria-labelledby={`guide2-title-${step.id}`}
        aria-describedby={copy.descriptionKey ? `guide2-body-${step.id}` : undefined}
        tabIndex={-1}
        dir={isRTL ? "rtl" : "ltr"}
        data-guide-placement={placement.side}
        data-guide-preview={active.origin === "preview" ? "true" : undefined}
        className="z-[9999] rounded-xl border border-black/5 bg-white p-4 shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprimary dark:border-white/10 dark:bg-gray-800"
        style={{
          position: "fixed",
          left: placement.left,
          top: placement.top,
          width: placement.width,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
        }}
        {...animation}
      >
        {active.origin === "preview" && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-600">
            {t(chromeKey('preview'))}
          </p>
        )}

        <div className="flex items-start justify-between gap-2">
          <h2
            id={`guide2-title-${step.id}`}
            className="text-base font-bold text-gray-900 break-words dark:text-white"
          >
            {t(copy.titleKey)}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t(active.guide.priority === 'first-success' || step.successEvent ? chromeKey('later') : chromeKey('skip'))}
            className="-mt-1 -me-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blueprimary dark:hover:bg-gray-700"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {copy.descriptionKey && (
          <p
            id={`guide2-body-${step.id}`}
            className="mt-1 text-sm leading-6 text-gray-600 break-words dark:text-gray-300"
          >
            {t(copy.descriptionKey)}
          </p>
        )}
        {visuals.length > 0 && <div className={`mt-3 grid gap-2 ${visualKey === 'domains' ? 'grid-cols-2' : 'grid-flow-col auto-cols-fr'}`}>
          {visuals.map(visual => <figure key={visual.label} className="text-center text-xs text-gray-700 dark:text-gray-200">
            <img src={visual.src} alt="" className="mx-auto h-12 w-12 object-contain" />
            <figcaption>{t(`tutorial.student.${visual.label}`)}</figcaption>
          </figure>)}
        </div>}
        {isStudentGuide && step.id === 'xp' && <p className="mt-2 text-sm" dir={isRTL ? 'rtl' : 'ltr'}>{t('tutorial.student.xpLive', { level: level.level, current: level.remainingXp, needed: level.xpForNextLevel })}</p>}

        {totalSteps > 1 && (
          <>
            <p className="sr-only" aria-live="polite">
              {/* Shared overlay chrome, like every other label here: one key that both
                   catalogues define. The previous role check fell back to a raw
                   Arabic literal, which is in neither catalogue, so a Teacher
                   card announced "خطوة 1 / 2" in the English UI. */}
              {`${t(chromeKey('step'))} ${active.stepIndex + 1} / ${totalSteps}`}
            </p>
            <div aria-hidden="true" className="mt-3 flex items-center gap-1.5">
              {active.guide.steps.map((entry, index) => (
                <span
                  key={entry.id}
                  className={`h-1.5 rounded-full transition-all ${
                    index === active.stepIndex
                      ? "w-5 bg-blueprimary"
                      : "w-1.5 bg-gray-200 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          {isInteraction && active.origin !== 'preview' ? (
            <><span className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blueprimary/10 px-3 py-2 text-sm font-medium text-blueprimary">
              {t(chromeKey('tap'))}
            </span><button type="button" onClick={guides.defer} className="min-h-[44px] shrink-0 rounded-lg px-3 py-2 text-sm text-gray-600 focus-visible:ring-2">{t(chromeKey('later'))}</button></>
          ) : (
            <>
              <div>
                {active.stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={guides.back}
                    className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blueprimary dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t(chromeKey('previous'))}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isLastStep && !active.guide.requiresAcknowledgement && (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blueprimary dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t(active.guide.priority === 'orientation' ? chromeKey('skip') : chromeKey('later'))}
                  </button>
                )}
                <button
                  type="button"
                  onClick={isLastStep ? guides.complete : guides.advance}
                  className="min-h-[44px] rounded-lg bg-blueprimary px-4 py-2 text-sm font-bold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blueprimary active:scale-95"
                >
                  {isLastStep ? t(chromeKey('understood')) : t(chromeKey('next'))}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default GuideOverlayV2;
