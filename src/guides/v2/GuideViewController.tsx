import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";

// Page-scoped bridge that lets replay ask a screen to show a particular local
// view before a guide starts — without lifting tab state into global store.
//
// A screen that owns tabs registers a selector:
//
//   useGuideViewSelector({
//     "student.progress.tree": () => setTab(3),
//     "student.progress.level": () => setTab(2),
//   });
//
// Replay calls `requestGuideView(viewId)`, which returns false when no screen
// can honour it — the caller then declines to start the guide rather than
// waiting for a view that will never appear.

type Selector = () => void;

const selectors = new Map<string, Selector>();

export const requestGuideView = (viewId: string | undefined): boolean => {
  if (!viewId) return true;
  const selector = selectors.get(viewId);
  if (!selector) return false;
  try {
    selector();
    return true;
  } catch {
    return false;
  }
};

export const canSelectGuideView = (viewId: string | undefined): boolean =>
  !viewId || selectors.has(viewId);

export const useGuideViewSelector = (map: Record<string, Selector>): void => {
  // Keep the latest callbacks without re-registering on every render.
  const latest = useRef(map);
  latest.current = map;

  const viewIds = useMemo(() => Object.keys(map).sort().join("|"), [map]);

  useEffect(() => {
    const ids = viewIds ? viewIds.split("|") : [];
    ids.forEach((viewId) => {
      selectors.set(viewId, () => latest.current[viewId]?.());
    });
    return () => {
      ids.forEach((viewId) => selectors.delete(viewId));
    };
  }, [viewIds]);
};

export const resetGuideViewSelectorsForTest = (): void => {
  selectors.clear();
};

// Optional context form, for screens that prefer passing the selector down.
interface GuideViewControllerValue {
  selectView: (viewId: string) => boolean;
}

const GuideViewControllerContext = createContext<GuideViewControllerValue>({
  selectView: requestGuideView,
});

export const GuideViewControllerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useMemo<GuideViewControllerValue>(
    () => ({ selectView: requestGuideView }),
    [],
  );
  return (
    <GuideViewControllerContext.Provider value={value}>
      {children}
    </GuideViewControllerContext.Provider>
  );
};

export const useGuideViewController = (): GuideViewControllerValue =>
  useContext(GuideViewControllerContext);
