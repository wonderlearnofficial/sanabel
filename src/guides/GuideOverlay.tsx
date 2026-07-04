import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useGuide } from "./GuideProvider";

// Spotlight guide: dims the page with a cutout around the step's real
// element (data-guide-id) and anchors a small tooltip next to it. Steps with
// advanceOn:"interaction" wait for the user to actually tap the element —
// teach by doing. Steps without a target render a centered card.

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;

const GuideOverlay: React.FC = () => {
  const {
    activeGuide,
    activeStep,
    activeStepIndex,
    totalSteps,
    isAutoStarted,
    advance,
    back,
    finish,
  } = useGuide();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const targetId = activeStep?.targetId;
  const isInteraction = activeStep?.advanceOn === "interaction";

  const measure = useCallback(() => {
    if (!targetId) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(
      `[data-guide-id="${targetId}"]`
    );
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [targetId]);

  // Find + track the target. Poll so cross-page steps wait quietly until
  // their element mounts (e.g. the request button appears pages later).
  useEffect(() => {
    if (!activeStep) return;
    measure();
    const interval = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [activeStep, measure]);

  // Interaction steps advance when the user taps the real element.
  useEffect(() => {
    if (!activeStep || !isInteraction || !targetId) return;
    const handler = (e: Event) => {
      // closest(): several sibling elements may carry the same guide id
      // (e.g. one action button per mission row) — tapping any counts.
      if (
        e.target instanceof Element &&
        e.target.closest(`[data-guide-id="${targetId}"]`)
      )
        advance();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [activeStep, isInteraction, targetId, advance]);

  useEffect(() => {
    if (!activeStep) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeStep, finish]);

  useEffect(() => {
    if (activeStep && isAutoStarted && !isInteraction && cardRef.current) {
      cardRef.current.focus();
    }
  }, [activeStep, isAutoStarted, isInteraction]);

  if (!activeGuide || !activeStep) return null;
  // Target step whose element hasn't mounted yet: wait invisibly.
  if (targetId && !rect) return null;

  const isLastStep = activeStepIndex === totalSteps - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Tooltip position: below the target if there's room, else above.
  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + PAD + 180 < vh;
    const width = Math.min(340, vw - 24);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), vw - width - 12);
    cardStyle = {
      position: "fixed",
      width,
      left,
      ...(below
        ? { top: rect.top + rect.height + PAD + 8 }
        : { bottom: vh - rect.top + PAD + 8 }),
    };
  } else {
    cardStyle = {
      position: "fixed",
      width: Math.min(340, vw - 24),
      left: "50%",
      top: "40%",
      transform: "translate(-50%, -50%)",
    };
  }

  const anim = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.1 } }
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.97 },
        transition: { duration: 0.2 },
      };

  return (
    <AnimatePresence>
      {/* Dim + spotlight cutout. pointer-events none: never blocks the app. */}
      {rect ? (
        <div
          key="guide-spot"
          className="pointer-events-none fixed z-[9990] rounded-xl transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            outline: "2px solid rgba(255,255,255,0.85)",
          }}
        />
      ) : (
        <div key="guide-dim" className="pointer-events-none fixed inset-0 z-[9990] bg-black/45" />
      )}

      <motion.div
        key={`guide-card-${activeStep.id}`}
        ref={cardRef}
        role="dialog"
        aria-labelledby={`guide-title-${activeStep.id}`}
        tabIndex={-1}
        dir={isRTL ? "rtl" : "ltr"}
        className="z-[9999] rounded-xl border border-black/5 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-gray-800 focus:outline-none"
        style={cardStyle}
        {...anim}
      >
        <div className="flex items-start justify-between gap-2">
          <h2
            id={`guide-title-${activeStep.id}`}
            className="text-base font-bold text-gray-900 break-words dark:text-white"
          >
            {t(activeStep.titleKey)}
          </h2>
          <button
            type="button"
            onClick={finish}
            aria-label={t("تخطي")}
            className="-mt-1 -me-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {activeStep.descriptionKey && (
          <p className="mt-1 text-sm leading-6 text-gray-600 break-words dark:text-gray-300">
            {t(activeStep.descriptionKey)}
          </p>
        )}

        {totalSteps > 1 && (
          <div className="mt-3 flex items-center gap-1.5">
            {activeGuide.steps.map((step, index) => (
              <span
                key={step.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeStepIndex
                    ? "w-5 bg-blueprimary"
                    : "w-1.5 bg-gray-200 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          {isInteraction ? (
            <span className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blueprimary/10 px-3 py-2 text-sm font-medium text-blueprimary">
              {t("اضغط على العنصر المضيء للمتابعة")}
            </span>
          ) : (
            <>
              <div>
                {activeStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t("السابق")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isLastStep && (
                  <button
                    type="button"
                    onClick={finish}
                    className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t("تخطي")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={advance}
                  className="min-h-[44px] rounded-lg bg-blueprimary px-4 py-2 text-sm font-bold text-white hover:opacity-90 active:scale-95"
                >
                  {isLastStep ? t("إنهاء") : t("التالي")}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuideOverlay;
