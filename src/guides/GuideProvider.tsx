import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { useUserContext } from "../context/StudentUserProvider";
import { ALL_GUIDES } from "./guideConfigs";
import { GuideConfig, GuideStepConfig } from "./types";

interface GuideContextValue {
  activeGuide: GuideConfig | null;
  activeStep: GuideStepConfig | null;
  activeStepIndex: number;
  totalSteps: number;
  // true when the guide auto-started (focus moves to card); false on replay.
  isAutoStarted: boolean;
  requestGuide: (guideId: string) => void;
  replayGuide: (guideId: string) => void;
  advance: () => void;
  back: () => void;
  // Ends the guide and marks it permanently seen (Finish / Skip / Escape).
  // Skipped guides stay replayable from Settings.
  finish: () => void;
  isGuideSeen: (guideId: string) => boolean;
}

const GuideContext = createContext<GuideContextValue | undefined>(undefined);

const storageKey = (email: string) => `seenGuides-${email}`;
const SESSION_AUTO_KEY = "guideAutoShownThisSession";

export const GuideProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUserContext();
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isAutoStarted, setIsAutoStarted] = useState(false);
  const [seenGuides, setSeenGuides] = useState<Set<string>>(new Set());
  // A ref (not state) so a second requestGuide call in the same render batch
  // sees the claim immediately.
  const activeGuideIdRef = useRef<string | null>(null);

  // Source of truth is the backend (`user.seenGuides`); localStorage is only
  // an instant-read cache to avoid a flash of an already-seen guide.
  useEffect(() => {
    if (!user?.email) {
      setSeenGuides(new Set());
      return;
    }
    let cached: string[] = [];
    try {
      cached = JSON.parse(localStorage.getItem(storageKey(user.email)) || "[]");
    } catch {
      cached = [];
    }
    setSeenGuides(new Set([...cached, ...(user.seenGuides || [])]));
  }, [user?.email, user?.seenGuides]);

  const activeGuide = useMemo(
    () =>
      activeGuideId
        ? ALL_GUIDES.find((guide) => guide.id === activeGuideId) || null
        : null,
    [activeGuideId]
  );
  const activeStep = activeGuide ? activeGuide.steps[activeStepIndex] || null : null;
  const totalSteps = activeGuide?.steps.length || 0;

  const isGuideSeen = useCallback(
    (guideId: string) => seenGuides.has(guideId),
    [seenGuides]
  );

  const markSeen = useCallback(
    (guideId: string) => {
      if (!user?.email) return;
      setSeenGuides((prev) => {
        if (prev.has(guideId)) return prev;
        const next = new Set(prev);
        next.add(guideId);
        localStorage.setItem(storageKey(user.email), JSON.stringify(Array.from(next)));
        return next;
      });
      const token = localStorage.getItem("token");
      if (!token) return;
      axios
        .patch(
          `${API_BASE_URL}/users/seen-guides`,
          { guideId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {
          // Fire-and-forget: worst case is one extra, harmless replay next session.
        });
    },
    [user?.email]
  );

  const startGuide = useCallback((guideId: string, auto: boolean) => {
    activeGuideIdRef.current = guideId;
    setActiveGuideId(guideId);
    setActiveStepIndex(0);
    setIsAutoStarted(auto);
  }, []);

  // Auto-start path: seen-check plus at most ONE auto guide per browser
  // session, so guides never chain back-to-back across pages.
  const requestGuide = useCallback(
    (guideId: string) => {
      if (activeGuideIdRef.current || seenGuides.has(guideId)) return;
      if (sessionStorage.getItem(SESSION_AUTO_KEY)) return;
      const guide = ALL_GUIDES.find((g) => g.id === guideId);
      if (!guide || guide.steps.length === 0) return;
      sessionStorage.setItem(SESSION_AUTO_KEY, guideId);
      startGuide(guideId, true);
    },
    [seenGuides, startGuide]
  );

  // Manual replay (Settings / page help): ignores guards and never mutates
  // the seen set — replaying is not "unseeing".
  const replayGuide = useCallback(
    (guideId: string) => {
      const guide = ALL_GUIDES.find((g) => g.id === guideId);
      if (!guide || guide.steps.length === 0) return;
      startGuide(guideId, false);
    },
    [startGuide]
  );

  const finish = useCallback(() => {
    if (activeGuideId) markSeen(activeGuideId);
    activeGuideIdRef.current = null;
    setActiveGuideId(null);
    setActiveStepIndex(0);
  }, [activeGuideId, markSeen]);

  const advance = useCallback(() => {
    if (!activeGuide) return;
    if (activeStepIndex >= activeGuide.steps.length - 1) {
      finish();
    } else {
      setActiveStepIndex((index) => index + 1);
    }
  }, [activeGuide, activeStepIndex, finish]);

  const back = useCallback(() => {
    setActiveStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const value: GuideContextValue = useMemo(
    () => ({
      activeGuide,
      activeStep,
      activeStepIndex,
      totalSteps,
      isAutoStarted,
      requestGuide,
      replayGuide,
      advance,
      back,
      finish,
      isGuideSeen,
    }),
    [
      activeGuide,
      activeStep,
      activeStepIndex,
      totalSteps,
      isAutoStarted,
      requestGuide,
      replayGuide,
      advance,
      back,
      finish,
      isGuideSeen,
    ]
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
};

export const useGuide = () => {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
};
