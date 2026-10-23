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
import { localStore } from "../utils/safeStorage";
import { isTutorialV2Enabled } from "./v2/featureFlag";
import { resolveExperience } from "./v2/resolveExperience";

interface GuideContextValue {
  activeGuide: GuideConfig | null;
  activeStep: GuideStepConfig | null;
  activeStepIndex: number;
  totalSteps: number;
  // true when the guide auto-started (focus moves to card); false on replay.
  isAutoStarted: boolean;
  requestGuide: (guideId: string) => void;
  /**
   * Starts a guide on demand (Settings list / page help). Returns false when
   * the guide cannot run here — an unknown id, or a spotlight step whose
   * element is not on this page — in which case nothing is activated and the
   * caller is responsible for telling the user why.
   */
  replayGuide: (guideId: string) => boolean;
  advance: () => void;
  back: () => void;
  // Ends the guide and marks it permanently seen (Finish / Skip / Escape).
  // Skipped guides stay replayable from Settings.
  finish: () => void;
  isGuideSeen: (guideId: string) => boolean;
  /**
   * Reports the route the app has navigated to. Each new pathname is a fresh
   * route entry, which restores this route's single automatic-guide slot.
   * Called by `GuideRouteWatcher`, which lives inside the router; repeating the
   * pathname already in effect (a re-render or a remount) is a no-op.
   */
  notifyRouteEntry: (path: string) => void;
}

const GuideContext = createContext<GuideContextValue | undefined>(undefined);

const storageKey = (email: string) => `seenGuides-${email}`;

// An admin previewing a Student holds a real Student token, so every write this
// provider makes would land on that Student's own record. Impersonated sessions
// are therefore read-only for guide state: nothing auto-starts and nothing is
// marked seen. The server refuses the write too (`imp` token claim).
const isImpersonatedSession = () =>
  localStore.getItem("isImpersonated") === "true";

// This provider sits above the router, so the current route is read from the
// browser rather than from `useLocation`.
const currentRoutePath = () =>
  typeof window !== "undefined" ? window.location.pathname : "";

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
  // One automatic guide per route entry, so re-renders on the same screen
  // cannot chain a second overlay while a later route can still teach its own
  // thing. Replaces the previous one-guide-per-browser-session key, which
  // starved every later guide for the rest of the session.
  //
  // The claim is cleared by `notifyRouteEntry`, not by comparing pathnames at
  // request time: a route the user passes through without any guide request
  // would otherwise leave the previous claim standing, and coming back to that
  // route would look like the same visit.
  const autoStartClaimRef = useRef<{ path: string; email: string } | null>(null);
  // Last pathname reported by the router watcher. `null` means no watcher has
  // reported yet (dev-only screens render outside the router).
  const lastRoutePathRef = useRef<string | null>(null);

  // Source of truth is the backend (`user.seenGuides`); localStorage is only
  // an instant-read cache to avoid a flash of an already-seen guide.
  useEffect(() => {
    if (!user?.email) {
      setSeenGuides(new Set());
      return;
    }
    const cached = localStore.getJson<string[]>(
      storageKey(user.email),
      [],
      (value): value is string[] =>
        Array.isArray(value) && value.every((guideId) => typeof guideId === "string"),
    );
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
      // Read-only for the impersonated account: no local cache write, no PATCH.
      if (isImpersonatedSession()) return;
      setSeenGuides((prev) => {
        if (prev.has(guideId)) return prev;
        const next = new Set(prev);
        next.add(guideId);
        localStore.setItem(storageKey(user.email), JSON.stringify(Array.from(next)));
        return next;
      });
      const token = localStore.getItem("token");
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

  // A new pathname is a new route entry: this route gets its automatic-guide
  // slot back. The same pathname repeated is a re-render or a remount of the
  // watcher, which must not hand out a second guide on one visit.
  const notifyRouteEntry = useCallback((path: string) => {
    if (lastRoutePathRef.current === path) return;
    lastRoutePathRef.current = path;
    autoStartClaimRef.current = null;
  }, []);

  // Auto-start path: seen-check, plus at most ONE auto guide per route entry,
  // so guides never chain back-to-back on one screen.
  const requestGuide = useCallback(
    (guideId: string) => {
      if (activeGuideIdRef.current || seenGuides.has(guideId)) return;
      if (!user?.email) return;
      if (isImpersonatedSession()) return;
      // Tutorial V2 owns the overlay for any experience it is enabled for, so
      // the two engines can never both auto-start. With the flag off (the
      // default) this is a no-op and Phase 0 behaviour is unchanged.
      if (isTutorialV2Enabled(resolveExperience({
        role: user.role,
        organizationId: user.organizationId ?? null,
        classId: user.classId ?? null,
        userId: user.id,
        email: user.email,
      }).experience)) {
        return;
      }
      const path = currentRoutePath();
      const claim = autoStartClaimRef.current;
      // With a watcher reporting navigation, holding a claim at all means this
      // route entry has already shown its guide. Without one, fall back to
      // comparing pathnames so a missing watcher can never degrade into "one
      // guide for the whole app session".
      const routeEntriesWatched = lastRoutePathRef.current !== null;
      if (
        claim &&
        claim.email === user.email &&
        (routeEntriesWatched || claim.path === path)
      ) {
        return;
      }
      const guide = ALL_GUIDES.find((g) => g.id === guideId);
      if (!guide || guide.steps.length === 0) return;
      autoStartClaimRef.current = { path, email: user.email };
      startGuide(guideId, true);
    },
    [seenGuides, startGuide, user?.email]
  );

  // Manual replay (Settings / page help): ignores the seen-check and the
  // auto-start claim, and never mutates the seen set — replaying is not
  // "unseeing".
  //
  // A spotlight step waits for its element to mount, so replaying a targeted
  // guide from a page that has no such element left an active-but-invisible
  // guide that blocked every later guide. Refuse instead, and let the caller
  // explain. Only the first targeted step is checked: a guide may legitimately
  // follow the user across routes once it has started.
  const replayGuide = useCallback(
    (guideId: string) => {
      const guide = ALL_GUIDES.find((g) => g.id === guideId);
      if (!guide || guide.steps.length === 0) return false;
      const firstTargetId = guide.steps.find((step) => step.targetId)?.targetId;
      if (
        firstTargetId &&
        !document.querySelector(`[data-guide-id="${firstTargetId}"]`)
      ) {
        return false;
      }
      startGuide(guideId, false);
      return true;
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
      notifyRouteEntry,
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
      notifyRouteEntry,
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
