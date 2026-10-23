import { useEffect } from "react";
import { useOptionalGuideV2 } from "./GuideProviderV2";

/**
 * The one line a screen adds. It carries no policy: eligibility, budget,
 * cooldown, priority and view matching all live in the queue, so a page can
 * never encode tutorial rules by accident.
 *
 *   useGuideAutoStart();                       // this route's guides
 *   useGuideAutoStart(profileLoaded);          // wait for the data a guide needs
 *
 * Safe when V2 is off or the provider is absent: it does nothing.
 */
export const useGuideAutoStart = (ready: boolean = true): void => {
  const guides = useOptionalGuideV2();
  const enabled = guides?.enabled === true;
  const requestAutoStart = guides?.requestAutoStart;
  const routeSignal = guides?.context.accountKey;
  const activeGuideId = guides?.active?.guide.id ?? null;
  const factsSignal = guides?.facts;

  useEffect(() => {
    if (!enabled || !ready || !requestAutoStart) return;
    requestAutoStart();
    // Re-evaluated when the account, the active guide or the readable facts
    // change; the queue itself is idempotent and cheap.
  }, [enabled, ready, requestAutoStart, routeSignal, activeGuideId, factsSignal]);
};
