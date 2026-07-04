import { useEffect } from "react";
import { useGuide } from "./GuideProvider";

// The one-liner a page adds for progressive disclosure: fires `guideId` the
// first time `conditionMet` is true, and waits for any currently-active guide
// to finish before trying (re-evaluated whenever `activeGuide` changes).
export const useAutoStartGuide = (guideId: string, conditionMet: boolean) => {
  const { requestGuide, activeGuide, isGuideSeen } = useGuide();

  useEffect(() => {
    if (!conditionMet || isGuideSeen(guideId) || activeGuide) return;
    requestGuide(guideId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionMet, guideId, activeGuide, isGuideSeen]);
};
