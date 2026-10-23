import { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useGuide } from "./GuideProvider";
import { registerGuideNavigator } from "./v2/navigator";
import { notifyRouteEntry as notifyRouteEntryV2 } from "./v2/routeEntry";

// Renders nothing. Its only job is to tell GuideProvider when the app has
// navigated, because the provider is mounted above the router (it also wraps
// GuideOverlay, which lives outside IonReactRouter) and so cannot use
// `useLocation` itself.
//
// Without this signal the provider can only compare pathnames when a page asks
// for a guide, which mistakes "came back to this route" for "still on this
// route" whenever the route in between asked for nothing.
//
// Mount it inside the router, once.
const GuideRouteWatcher: React.FC = () => {
  const { pathname } = useLocation();
  const history = useHistory();
  const { notifyRouteEntry } = useGuide();

  useEffect(() => {
    notifyRouteEntry(pathname);
    // Tutorial V2 keeps its own route-entry bus (it is consumed by pure
    // modules, not by React context), and both engines are fed from this one
    // navigation signal.
    notifyRouteEntryV2(pathname);
  }, [pathname, notifyRouteEntry]);

  // V2 replay navigates to a guide's route before starting it. The guide
  // providers sit above the router, so the push function is handed over here.
  useEffect(() => {
    registerGuideNavigator((route) => history.push(route));
    return () => registerGuideNavigator(null);
  }, [history]);

  return null;
};

export default GuideRouteWatcher;
