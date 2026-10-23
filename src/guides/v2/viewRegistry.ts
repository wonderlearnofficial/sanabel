// View keys.
//
// A route is not always a screen. `/student/progress` is one route with four
// local tabs (`StudentProgress.tsx` keeps the selection in component state), so
// route-keyed eligibility cannot tell "opened Medals" from "opened Tree" — the
// bug that left two Progress tabs asking for one guide id.
//
// Each screen declares what it is currently showing with `useGuideView`, and the
// registry can match `route` plus `view`.

type Listener = (views: string[]) => void;

const active = new Map<string, number>();
const listeners = new Set<Listener>();

const snapshot = (): string[] => [...active.keys()];

const publish = () => {
  const views = snapshot();
  listeners.forEach((listener) => {
    try {
      listener(views);
    } catch {
      // Never let a subscriber break view tracking.
    }
  });
};

/** Marks a view as mounted. Reference counted: StrictMode double-mounts are safe. */
export const enterGuideView = (viewId: string): void => {
  active.set(viewId, (active.get(viewId) ?? 0) + 1);
  publish();
};

export const leaveGuideView = (viewId: string): void => {
  const count = active.get(viewId) ?? 0;
  if (count <= 1) active.delete(viewId);
  else active.set(viewId, count - 1);
  publish();
};

export const activeGuideViews = (): string[] => snapshot();

export const isGuideViewActive = (viewId: string): boolean => active.has(viewId);

export const subscribeToGuideViews = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const resetGuideViewsForTest = (): void => {
  active.clear();
};
