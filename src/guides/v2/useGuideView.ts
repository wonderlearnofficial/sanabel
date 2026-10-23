import { useEffect } from "react";
import { enterGuideView, leaveGuideView } from "./viewRegistry";

/**
 * Declares which local view (tab, panel) a screen is currently showing, so
 * guide eligibility can be route + view rather than route alone.
 *
 * One line per screen:
 *   useGuideView("student.progress.tree");
 *
 * Passing a falsy id is a no-op, so a screen can declare a view conditionally
 * without branching around the hook.
 */
export const useGuideView = (viewId: string | null | undefined): void => {
  useEffect(() => {
    if (!viewId) return undefined;
    enterGuideView(viewId);
    return () => leaveGuideView(viewId);
  }, [viewId]);
};
