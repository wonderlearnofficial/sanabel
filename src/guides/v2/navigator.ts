// Navigation hand-off.
//
// Replay must reach a guide's route before starting it — the Phase 0 failure
// was starting a guide whose target lived on another screen. The guide provider
// sits above the router, so a component inside the router (GuideRouteWatcher)
// registers the push function here.

type GuideNavigator = (route: string) => void;

let navigate: GuideNavigator | null = null;

export const registerGuideNavigator = (next: GuideNavigator | null): void => {
  navigate = next;
};

export const canNavigateForGuide = (): boolean => navigate !== null;

/** Returns false when no navigator is registered, so callers can decline. */
export const navigateForGuide = (route: string): boolean => {
  if (!navigate) return false;
  try {
    navigate(route);
    return true;
  } catch {
    return false;
  }
};
