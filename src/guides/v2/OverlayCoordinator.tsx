import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OVERLAY_TIER, OverlayTier } from "./types";

// One arbiter for "who owns the screen".
//
//   tier 1  blocking platform requirement — permissions, force update,
//           maintenance, expired session
//   tier 2  required onboarding — Student avatar creation
//   tier 3  guide overlay
//   tier 4  optional tips and toasts
//
// Invariants: never two competing blocking overlays; a guide interrupted by a
// higher tier is not marked seen and keeps its progress (the guide layer reads
// `blockedByHigherTier` and ends with reason "preempted").

interface Claim {
  id: number;
  tier: OverlayTier;
  label: string;
}

interface OverlayCoordinatorValue {
  claims: Claim[];
  highestTier: OverlayTier | null;
  /** True when something above the guide tier is on screen. */
  blockedByHigherTier: boolean;
  /** True while a guide holds the screen (used to gate optional tips/toasts). */
  guideActive: boolean;
  claim: (tier: OverlayTier, label: string) => () => void;
}

const OverlayCoordinatorContext = createContext<OverlayCoordinatorValue | undefined>(
  undefined,
);

export const OverlayCoordinatorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const nextId = useRef(1);

  const claim = useCallback((tier: OverlayTier, label: string) => {
    const id = nextId.current++;
    setClaims((previous) => [...previous, { id, tier, label }]);
    return () => {
      setClaims((previous) => previous.filter((entry) => entry.id !== id));
    };
  }, []);

  const value = useMemo<OverlayCoordinatorValue>(() => {
    const tiers = claims.map((entry) => entry.tier);
    const highestTier = tiers.length > 0 ? (Math.min(...tiers) as OverlayTier) : null;
    return {
      claims,
      highestTier,
      blockedByHigherTier:
        highestTier !== null && highestTier < OVERLAY_TIER.guide,
      guideActive: tiers.includes(OVERLAY_TIER.guide),
      claim,
    };
  }, [claims, claim]);

  return (
    <OverlayCoordinatorContext.Provider value={value}>
      {children}
    </OverlayCoordinatorContext.Provider>
  );
};

/**
 * Safe outside the provider: components that may render before it is mounted
 * (or in isolation in a test) get a permissive, inert coordinator rather than a
 * thrown error.
 */
export const useOverlayCoordinator = (): OverlayCoordinatorValue => {
  const context = useContext(OverlayCoordinatorContext);
  return (
    context ?? {
      claims: [],
      highestTier: null,
      blockedByHigherTier: false,
      guideActive: false,
      claim: () => () => undefined,
    }
  );
};

/**
 * Declarative claim for an existing modal: one hook call, no redesign.
 * `PermissionsStartupModal` uses this to announce that it owns the screen.
 */
export const useOverlayClaim = (
  isOpen: boolean,
  tier: OverlayTier,
  label: string,
): void => {
  const { claim } = useOverlayCoordinator();
  useEffect(() => {
    if (!isOpen) return undefined;
    return claim(tier, label);
  }, [isOpen, tier, label, claim]);
};

/**
 * For optional, deferrable UI (tips, celebratory toasts): true when it should
 * hold off because a guide is on screen. Phase 1 exposes the capability; the
 * reward-toast call sites adopt it in the Student content phase.
 */
export const useOptionalOverlaySuppressed = (): boolean => {
  const { guideActive, blockedByHigherTier } = useOverlayCoordinator();
  return guideActive || blockedByHigherTier;
};
