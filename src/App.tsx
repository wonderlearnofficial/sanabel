import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// Helper for route-level code splitting compatible with IonRouterOutlet
const lazyRoute = (factory: () => Promise<{ default: React.ComponentType<any> }>) => {
  const LazyComponent = lazy(factory);
  return (props: any) => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// BOOT-CRITICAL PAGES (Statically imported for instant boot and initial navigation)
import SplashScreen from "./pages/common/onboarding/SplashScreen";
import OnBoarding from "./pages/common/onboarding/Onboarding";
import ChooseSignMethod from "./pages/common/onboarding/ChooseSignMethod";
import SignupStudent from "./pages/common/signup/student/SignupStudent";
import SignupParentOrTeacher from "./pages/common/signup/parent_teacher/SignupParentOrTeacher";
import Login from "./pages/common/login/Login";
import ImpersonateHandoff from "./pages/auth/ImpersonateHandoff";
import StudentHome from "./pages/student/StudentHome";
import NoInternetPage from "./pages/common/NoInternet";

// Navbars
import StudentNavbar from "./components/navbar/StudentNavbar";
import TeacherNavbar from "./components/navbar/TeacherNavbar";
import ParentNavbar from "./components/navbar/ParentNavbar";

// ROUTE-ONLY & HEAVY-OPTIONAL PAGES (Code-split into on-demand chunks)
// Notifications
const Notifications = lazyRoute(() => import("./pages/Notifications/Notifications"));

// Student Secondary
const StudentToDoList = lazyRoute(() => import("./pages/student/StudentToDoList"));
const StudentProfile = lazyRoute(() => import("./pages/student/StudentProfile"));
const StudentProfileEdit = lazyRoute(() => import("./pages/student/profile/StudentProfileEdit"));
const StudentSettings = lazyRoute(() => import("./pages/student/profile/StudentSettings"));
const StudentPrivacyPolicy = lazyRoute(() => import("./pages/student/profile/StudentPrivacyPolicy"));
const StudentHelpCenter = lazyRoute(() => import("./pages/student/profile/StudentHelpCenter"));
const StudentLeaderboards = lazyRoute(() => import("./pages/student/StudentLeaderboards"));
const Leaderboards = StudentLeaderboards;
const CreateAvatar = lazyRoute(() => import("./pages/student/onboarding/CreateAvatar"));
const AvatarReady = lazyRoute(() => import("./pages/student/onboarding/AvatarReady"));
const StudentChallenges = lazyRoute(() => import("./pages/student/StudentChallenges"));
const ChooseSanabelType = lazyRoute(() => import("./pages/student/challenges/ChooseSanabelType"));
const ChooseSanabel = lazyRoute(() => import("./pages/student/challenges/ChooseSanabel"));
const SanabelMissionsPage = lazyRoute(() => import("./pages/student/challenges/SanabelMissionsPage"));
const SanabelReminder = lazyRoute(() => import("./pages/student/challenges/SanabelReminder"));
const StudentProgress = lazyRoute(() => import("./pages/student/StudentProgress"));
const StudentProfilePassword = lazyRoute(() => import("./pages/student/profile/StudentProfilePassword"));

// Teacher Secondary
const TeacherHome = lazyRoute(() => import("./pages/teacherorparent/TeacherHome"));
const TeacherProfile = lazyRoute(() => import("./pages/teacherorparent/profile/Profile"));
const TeacherChooseSanabelType = lazyRoute(() => import("./pages/teacherorparent/challenges/ChooseSanabelType"));
const TeacherChooseSanabel = lazyRoute(() => import("./pages/teacherorparent/challenges/ChooseSanabel"));
const TeacherSanabelMissionsPage = lazyRoute(() => import("./pages/teacherorparent/challenges/SanabelMissionsPage"));
const SanabelTest = lazyRoute(() => import("./pages/teacherorparent/challenges/SanabelTest"));
const TeacherView = lazyRoute(() => import("./pages/teacherorparent/TeacherView"));
const StudentDetails = lazyRoute(() => import("./pages/teacherorparent/studentdetails/StudentDetails"));
const ClassDetails = lazyRoute(() => import("./pages/teacherorparent/teacherviewdetails/ClassDetails"));
const StudentsList = lazyRoute(() => import("./pages/teacherorparent/pointsregistration/StudentsList"));
const TeamsList = lazyRoute(() => import("./pages/teacherorparent/pointsregistration/TeamsList"));
const ClassList = lazyRoute(() => import("./pages/teacherorparent/pointsregistration/ClassList"));

// Parent Secondary
const ParentHome = lazyRoute(() => import("./pages/teacherorparent/ParentHome"));
const ParentInvite = lazyRoute(() => import("./pages/teacherorparent/ParentInvite"));
const ParentView = lazyRoute(() => import("./pages/teacherorparent/ParentView"));

// Auth Recovery
const ForgotPassword = lazyRoute(() => import("./pages/common/login/ForgotPassword"));
const ChangePassword = lazyRoute(() => import("./pages/common/login/ChangePassword"));

// Standalone Tools
const Avatar = lazyRoute(() => import("./Avatar"));
const Simulation = lazyRoute(() => import("./Simulation"));

// Admin Redirect Screen for Mobile App
import AdminRedirectScreen from "./pages/auth/AdminRedirectScreen";

// Dev-only tools
const DevLogin = lazyRoute(() => import("./pages/dev/DevLogin"));
const TestPage = lazyRoute(() => import("./pages/dev/TestPage"));
import { AppUpdateChecker } from "./components/updates/AppUpdateChecker";
import { initAppNotificationsOnStartup } from "./services/appNotificationManager";
import PermissionsStartupModal from "./components/PermissionsStartupModal";
import ImpersonationBanner from "./components/ImpersonationBanner";
import { API_BASE_URL } from "./config/api";
import { useTheme } from "./context/ThemeContext";
import { UserProvider } from "./context/StudentUserProvider";
import { useTranslation } from "react-i18next";
import "./i18n";
import { NotificationProvider } from "./pages/Notifications/NotificationContext";
import { GuideProvider } from "./guides/GuideProvider";
import GuideOverlay from "./guides/GuideOverlay";
import GuideRouteWatcher from "./guides/GuideRouteWatcher";
import { OverlayCoordinatorProvider } from "./guides/v2/OverlayCoordinator";
import { GuideProviderV2 } from "./guides/v2/GuideProviderV2";
import StudentGuideBridge from './guides/v2/StudentGuideBridge';
import ParentGuideBridge from './guides/v2/ParentGuideBridge';
import ParentHelpV2, { ParentHelpDispatch } from './pages/teacherorparent/ParentHelpV2';
import TeacherGuideBridge from './guides/v2/TeacherGuideBridge';
import TeacherHelpV2, { TeacherHelpDispatch, TeacherReplayCompatibility } from './pages/teacherorparent/TeacherHelpV2';
import StudentHelpV2, { StudentReplayCompatibility } from './pages/student/StudentHelpV2';
import GuideOverlayV2 from "./guides/v2/GuideOverlayV2";
import GuideReplayList from "./guides/GuideReplayList";
import { localStore } from "./utils/safeStorage";

setupIonicReact();

// Custom hook for internet connection detection
export const useInternetConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const failedChecks = useRef(0);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;
    let checkInFlight = false;
    let disposed = false;

    const handleOnline = () => {
      failedChecks.current = 0;
      if (!disposed) setIsOnline(true);
    };

    const handleOffline = () => {
      if (!disposed) setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Additional check with a ping to ensure real connectivity
    const checkRealConnection = async () => {
      if (disposed || checkInFlight || document.visibilityState === "hidden") return;
      if (!navigator.onLine) {
        failedChecks.current = 2;
        if (!disposed) setIsOnline(false);
        return;
      }

      checkInFlight = true;
      activeController = new AbortController();
      const timeoutId = setTimeout(() => activeController?.abort(), 5000);
      try {
        // Verify the API itself. Requests to unrelated hosts (previously
        // Google) can be blocked by iOS privacy controls and falsely mark an
        // otherwise healthy Sanabel session as offline.
        const response = await fetch(`${API_BASE_URL}/health/live`, {
          method: "GET",
          cache: "no-store",
          signal: activeController.signal,
        });

        if (!response.ok) throw new Error(`Health check failed (${response.status})`);
        failedChecks.current = 0;
        if (!disposed) setIsOnline(true);
      } catch {
        if (disposed) return;
        failedChecks.current += 1;
        // A suspended iPhone radio or one Railway timeout must not replace the
        // whole app. Confirm the failure once before showing offline state.
        if (!navigator.onLine || failedChecks.current >= 2) {
          setIsOnline(false);
        } else {
          retryTimer = setTimeout(() => void checkRealConnection(), 2000);
        }
      } finally {
        clearTimeout(timeoutId);
        activeController = null;
        checkInFlight = false;
      }
    };

    // Check connection every 30 seconds
    const intervalId = setInterval(checkRealConnection, 30000);
    const handleVisible = () => {
      if (document.visibilityState === "visible") void checkRealConnection();
    };
    window.addEventListener("focus", checkRealConnection);
    document.addEventListener("visibilitychange", handleVisible);

    // Initial check
    checkRealConnection();

    // Cleanup
    return () => {
      disposed = true;
      activeController?.abort();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", checkRealConnection);
      document.removeEventListener("visibilitychange", handleVisible);
      clearInterval(intervalId);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return isOnline;
};

const App: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const isOnline = useInternetConnection();

  if (!localStore.getItem("language")) {
    localStore.setItem("language", "ar");
  }

  if (!localStore.getItem("dir")) {
    localStore.setItem("dir", "rtl");
  }
  const role = localStore.getItem("role");

  useEffect(() => {
    // Automatically prompt and initialize notifications on startup for all users (student, teacher, parent, guest)
    initAppNotificationsOnStartup();
  }, []);

  // Show No Internet page if offline
  if (!isOnline) {
    return <NoInternetPage />;
  }

  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
        <OverlayCoordinatorProvider>
        <GuideProvider>
        {/* Tutorial V2 runs only for experiences its feature flag
            enables; with the flag off it subscribes to nothing and
            renders nothing, and the Phase 0 engine above stays in
            charge. */}
        <GuideProviderV2>
          <ImpersonationBanner />
          {/* Simulation & dev pages: render outside the phone frame and Ionic router entirely */}
          {window.location.pathname.startsWith("/simulation") ? (
            <Simulation />
          ) : window.location.pathname.startsWith("/dev/login") && import.meta.env.DEV ? (
            <DevLogin />
          ) : window.location.pathname.startsWith("/test") ? (
            <TestPage />
          ) : (
          /* Outer container that fills the entire viewport */
          <div className="app-viewport flex items-center justify-center bg-white md:bg-gray-100">
            {/* Phone frame: full-screen on mobile, centered 430px card on desktop */}
            <div className="relative w-full h-full md:max-w-[430px] md:shadow-2xl overflow-hidden bg-white">
            <PermissionsStartupModal />
            <IonReactRouter>
              {/* Renders nothing; reports navigation to GuideProvider, which
                  sits above the router. */}
              <GuideRouteWatcher />
              <StudentGuideBridge />
              <ParentGuideBridge />
              <TeacherGuideBridge />
              <IonRouterOutlet>
                <Switch>
                  {/* // Splash Screen */}

                  <Route exact path="/" component={SplashScreen} />
                  <Route exact path="/avatar" component={Avatar} />

                  {/* Onboarding */}
                  <Route exact path="/onboarding" component={OnBoarding} />
                  <Route
                    exact
                    path="/choosesignmethod"
                    component={ChooseSignMethod}
                  />
                  <Route
                    exact
                    path="/student/create-avatar"
                    component={CreateAvatar}
                  />
                  <Route
                    exact
                    path="/student/avatar-ready"
                    component={AvatarReady}
                  />
                  {/* Signup */}
                  <Route
                    exact
                    path="/signupstudent"
                    component={SignupStudent}
                  />
                  <Route
                    exact
                    path="/signupparentorteacher"
                    component={SignupParentOrTeacher}
                  />
                  {/* Login */}
                  <Route exact path="/login" component={Login} />
                  <Route exact path="/impersonate" component={ImpersonateHandoff} />
                  <Route
                    exact
                    path="/forgotpassword"
                    component={ForgotPassword}
                  />
                  <Route
                    exact
                    path="/changepassword"
                    component={ChangePassword}
                  />
                  <Route
                    exact
                    path="/changeprofilepassword"
                    component={StudentProfilePassword}
                  />
                  {/* Notifications */}
                  <Route
                    exact
                    path="/notifications"
                    component={Notifications}
                  />
                  <Route exact path="/approvals" component={Notifications} />
                  <Route exact path="/parent/help" component={ParentHelpV2} />
                  {/* Student */}
                  <Route exact path="/help" render={() => <ParentHelpDispatch><TeacherHelpDispatch /></ParentHelpDispatch>} />
                  <Route exact path="/teacher/help" component={TeacherHelpV2} />
                  <Route exact path="/student/home" component={StudentHome} />
                  <Route
                    exact
                    path="/student/todolist"
                    component={StudentToDoList}
                  />
                  <Route
                    exact
                    path="/student/profile"
                    component={StudentProfile}
                  />
                  <Route
                    exact
                    path="/student/profile/edit"
                    component={StudentProfileEdit}
                  />
                  <Route
                    exact
                    path="/student/settings"
                    component={StudentSettings}
                  />
                  <Route
                    exact
                    path="/student/settings/privacypolicy"
                    component={StudentPrivacyPolicy}
                  />
                  <Route
                    exact
                    path="/student/settings/helpcenter"
                    render={() => <ParentHelpDispatch><StudentHelpV2 /></ParentHelpDispatch>}
                  />
                  <Route
                    exact
                    path="/student/settings/guides"
                    component={StudentReplayCompatibility}
                  />

                  <Route
                    exact
                    path="/student/challenges"
                    component={StudentChallenges}
                  />

                  <Route
                    exact
                    path="/student/progress"
                    component={StudentProgress}
                  />
                  <Route
                    exact
                    path="/student/leaderboards"
                    component={StudentLeaderboards}
                  />

                  <Route
                    path="/student/sanabel/choosesanabeltype"
                    component={ChooseSanabelType}
                  />
                  <Route
                    path="/student/sanabel/:index/:subIndex"
                    component={SanabelMissionsPage}
                  />
                  <Route
                    path="/student/sanabel/:index"
                    component={ChooseSanabel}
                  />

                  {/* Teacher */}
                  <Route exact path="/teacher/home" component={TeacherHome} />
                  <Route
                    exact
                    path="/teacher/profile"
                    component={TeacherProfile}
                  />
                  <Route
                    exact
                    path="/teacher/settings/guides"
                    component={TeacherReplayCompatibility}
                  />

                  <Route
                    exact
                    path="/teacher/challenges"
                    component={TeacherChooseSanabelType}
                  />

                  <Route
                    path="/teacher/sanabel/:index/:subIndex"
                    component={TeacherSanabelMissionsPage}
                  />
                  <Route
                    path="/teacher/sanabel/:index"
                    component={TeacherChooseSanabel}
                  />

                  <Route
                    path="/teacher/leaderboards"
                    component={StudentLeaderboards}
                  />

                  <Route exact path="/teacher/view" component={TeacherView} />
                  <Route
                    exact
                    path="/teacher/classes/:classId"
                    component={ClassDetails}
                  />
                  <Route exact path="/sanabeltest" component={SanabelTest} />

                  <Route
                    exact
                    path="/teacher/student/:studentId"
                    component={StudentDetails}
                  />
                  <Route
                    exact
                    path="/parent/student/:studentId"
                    component={StudentDetails}
                  />
                  {/* Registration */}
                  <Route
                    exact
                    path="/teacher/studentslist"
                    component={StudentsList}
                  />
                  <Route
                    exact
                    path="/teacher/classlist"
                    component={ClassList}
                  />
                  <Route
                    exact
                    path="/teacher/teamslist"
                    component={TeamsList}
                  />

                  {/* Parent */}
                  <Route exact path="/parent/home" component={ParentHome} />
                  <Route exact path="/parent/invite" component={ParentInvite} />
                  <Route exact path="/parent/view" component={ParentView} />

                  {/* Admin Console Redirect */}
                  <Route exact path="/admin-redirect" component={AdminRedirectScreen} />
                  <Route path="/admin" render={() => <Redirect to="/admin-redirect" />} />
                  <Route exact path="/test" component={TestPage} />
                </Switch>
              </IonRouterOutlet>
            </IonReactRouter>
            </div>
          </div>
          )}
          <GuideOverlay />
          <GuideOverlayV2 />
          <AppUpdateChecker />
        </GuideProviderV2>
        </GuideProvider>
        </OverlayCoordinatorProvider>
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
};
export default App;
