import { Redirect, Route, Switch } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// PAGES

import SplashScreen from "./pages/common/onboarding/SplashScreen";
import OnBoarding from "./pages/common/onboarding/Onboarding";
import ChooseSignMethod from "./pages/common/onboarding/ChooseSignMethod";

// Student Signup
import SignupStudent from "./pages/common/signup/student/SignupStudent";

// Login
import Login from "./pages/common/login/Login";

// Notifications

import Notifications from "./pages/Notifications/Notifications";

// Student
import StudentNavbar from "./components/navbar/StudentNavbar";
import StudentHome from "./pages/student/StudentHome";
import StudentToDoList from "./pages/student/StudentToDoList";
import StudentProfile from "./pages/student/StudentProfile";
import StudentProfileEdit from "./pages/student/profile/StudentProfileEdit";
import StudentSettings from "./pages/student/profile/StudentSettings";
import StudentPrivacyPolicy from "./pages/student/profile/StudentPrivacyPolicy";
import StudentHelpCenter from "./pages/student/profile/StudentHelpCenter";
import StudentLeaderboards from "./pages/student/StudentLeaderboards";
import CreateAvatar from "./pages/student/onboarding/CreateAvatar";
import AvatarReady from "./pages/student/onboarding/AvatarReady";

import StudentChallenges from "./pages/student/StudentChallenges";
import ChooseSanabelType from "./pages/student/challenges/ChooseSanabelType";
import ChooseSanabel from "./pages/student/challenges/ChooseSanabel";
import SanabelMissionsPage from "./pages/student/challenges/SanabelMissionsPage";

import SanabelReminder from "./pages/student/challenges/SanabelReminder";

import StudentProgress from "./pages/student/StudentProgress";

// Teacher
import TeacherNavbar from "./components/navbar/TeacherNavbar";
import TeacherHome from "./pages/teacherorparent/TeacherHome";
import TeacherProfile from "./pages/teacherorparent/profile/Profile";
import TeacherChooseSanabelType from "./pages/teacherorparent/challenges/ChooseSanabelType";
import TeacherChooseSanabel from "./pages/teacherorparent/challenges/ChooseSanabel";
import TeacherSanabelMissionsPage from "./pages/teacherorparent/challenges/SanabelMissionsPage";
import SanabelTest from "./pages/teacherorparent/challenges/SanabelTest";

import TeacherView from "./pages/teacherorparent/TeacherView";

// Teacher View Details

import StudentDetails from "./pages/teacherorparent/studentdetails/StudentDetails";
import ClassDetails from "./pages/teacherorparent/teacherviewdetails/ClassDetails";

// Registration

import SignupParentOrTeacher from "./pages/common/signup/parent_teacher/SignupParentOrTeacher";

// Teacher Lists
import StudentsList from "./pages/teacherorparent/pointsregistration/StudentsList";
import TeamsList from "./pages/teacherorparent/pointsregistration/TeamsList";
import ClassList from "./pages/teacherorparent/pointsregistration/ClassList";

// Parent
import ParentNavbar from "./components/navbar/ParentNavbar";

import { useTheme } from "./context/ThemeContext";
import { UserProvider } from "./context/StudentUserProvider";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import "./i18n";
import ForgotPassword from "./pages/common/login/ForgotPassword";
import ChangePassword from "./pages/common/login/ChangePassword";
import StudentProfilePassword from "./pages/student/profile/StudentProfilePassword";

import Leaderboards from "./pages/student/StudentLeaderboards";
import ParentHome from "./pages/teacherorparent/ParentHome";
import ParentInvite from "./pages/teacherorparent/ParentInvite";
import ParentView from "./pages/teacherorparent/ParentView";
import { NotificationProvider } from "./pages/Notifications/NotificationContext";
import { GuideProvider } from "./guides/GuideProvider";
import GuideOverlay from "./guides/GuideOverlay";
import GuideReplayList from "./guides/GuideReplayList";

import Avatar from "./Avatar";
import Simulation from "./Simulation";

// No Internet Component
import NoInternetPage from "./pages/common/NoInternet";

// Admin
import AdminRoute from "./components/AdminRoute";
import AdminProfile from "./pages/admin/AdminProfile";
import OrganizationsList from "./pages/admin/organizations/OrganizationsList";
import OrganizationForm from "./pages/admin/organizations/OrganizationForm";
import StudentsManagement from "./pages/admin/students/StudentsManagement";
import StudentDetailEdit from "./pages/admin/students/StudentDetailEdit";
import UserData from "./pages/admin/UserData";

// Dev-only quick-login tool
import DevLogin from "./pages/dev/DevLogin";
import TestPage from "./pages/dev/TestPage";
import { AppUpdateChecker } from "./components/updates/AppUpdateChecker";
import { initAppNotificationsOnStartup } from "./services/appNotificationManager";
import PermissionsStartupModal from "./components/PermissionsStartupModal";
import ImpersonationBanner from "./components/ImpersonationBanner";
import { API_BASE_URL } from "./config/api";
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

const AdminHomeRedirect = () => {
  useEffect(() => {
    window.location.href = "/admin/userdata";
  }, []);
  return null;
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
        <GuideProvider>
          <ImpersonationBanner />
          {/* Simulation & desktop admin pages: render outside the phone frame and Ionic router entirely */}
          {window.location.pathname === "/simulation" ? (
            <Simulation />
          ) : window.location.pathname === "/admin/userdata" ? (
            <UserData />
          ) : window.location.pathname === "/dev/login" && import.meta.env.DEV ? (
            <DevLogin />
          ) : window.location.pathname === "/test" ? (
            <TestPage />
          ) : (
          /* Outer container that fills the entire viewport */
          <div className="app-viewport flex items-center justify-center bg-white md:bg-gray-100">
            {/* Phone frame: full-screen on mobile, centered 430px card on desktop */}
            <div className="relative w-full h-full md:max-w-[430px] md:shadow-2xl overflow-hidden bg-white">
            <PermissionsStartupModal />
            <IonReactRouter>
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
                  {/* Student */}
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
                    component={StudentHelpCenter}
                  />
                  <Route
                    exact
                    path="/student/settings/guides"
                    render={() => <GuideReplayList role="Student" />}
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
                    render={() => (
                      <GuideReplayList
                        role={localStore.getItem("role") === "Parent" ? "Parent" : "Teacher"}
                      />
                    )}
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

                  {/* Admin */}
                  <AdminRoute exact path="/admin/home" component={AdminHomeRedirect} />
                  <AdminRoute exact path="/admin/profile" component={AdminProfile} />
                  <AdminRoute
                    exact
                    path="/admin/organizations"
                    component={OrganizationsList}
                  />
                  <AdminRoute
                    exact
                    path="/admin/organizations/new"
                    component={OrganizationForm}
                  />
                  <AdminRoute
                    exact
                    path="/admin/organizations/:organizationId"
                    component={OrganizationForm}
                  />
                  <AdminRoute
                    exact
                    path="/admin/students"
                    component={StudentsManagement}
                  />
                  <AdminRoute
                    exact
                    path="/admin/students/:studentId"
                    component={StudentDetailEdit}
                  />
                </Switch>
              </IonRouterOutlet>
            </IonReactRouter>
            </div>
          </div>
          )}
          <GuideOverlay />
          <AppUpdateChecker />
        </GuideProvider>
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
};
export default App;
