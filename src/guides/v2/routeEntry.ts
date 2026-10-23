// Route-entry bus.
//
// A "route entry" is a visit, not a pathname: coming back to a route after
// passing through another one is a new entry, even when the route in between
// asked for nothing. Repeating the pathname already in effect (a re-render, or
// a remount of the watcher) is not an entry.
//
// `GuideRouteWatcher` lives inside the router and feeds this module, because
// both guide providers are mounted above the router (they also wrap the overlay,
// which renders outside IonReactRouter).

export interface RouteEntry {
  entryId: number;
  path: string;
}

type Listener = (entry: RouteEntry) => void;

let current: RouteEntry = { entryId: 0, path: "" };
const listeners = new Set<Listener>();

export const currentRouteEntry = (): RouteEntry => current;

export const notifyRouteEntry = (path: string): RouteEntry => {
  if (current.path === path) return current;
  current = { entryId: current.entryId + 1, path };
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch {
      // A misbehaving subscriber must not stop navigation tracking.
    }
  });
  return current;
};

export const subscribeToRouteEntries = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Test helper: forget navigation history without touching subscribers' state. */
export const resetRouteEntriesForTest = (): void => {
  current = { entryId: 0, path: "" };
};
