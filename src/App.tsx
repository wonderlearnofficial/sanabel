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
import StudentTutorial from "./pages/student/tutorial/StudentTutorial";

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

import { useEffect, useState } from "react";

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

import Avatar from "./Avatar";

// No Internet Component
import NoInternetPage from "./pages/common/NoInternet";

setupIonicReact();

// Custom hook for internet connection detection
const useInternetConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Optional: Show a toast notification that connection is restored
      if (hasBeenOffline) {
        console.log("Connection restored!");
        // You can add a toast notification here if you have a toast system
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasBeenOffline(true);
      console.log("Connection lost!");
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Additional check with a ping to ensure real connectivity
    const checkRealConnection = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        // Try to fetch a small resource to verify real connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
        setHasBeenOffline(true);
      }
    };

    // Check connection every 30 seconds
    const intervalId = setInterval(checkRealConnection, 30000);

    // Initial check
    checkRealConnection();

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [hasBeenOffline]);

  return isOnline;
};

const App: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const isOnline = useInternetConnection();

  if (!localStorage.getItem("language")) {
    localStorage.setItem("language", "ar");
  }

  if (!localStorage.getItem("dir")) {
    localStorage.setItem("dir", "ltr");
  }
  const role = localStorage.getItem("role");

  // Show No Internet page if offline
  if (!isOnline) {
    return <NoInternetPage />;
  }

  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
          {/* Outer container that fills the entire viewport */}
          <div className="flex items-center justify-center w-screen h-screen bg-white md:bg-gray-100">
            {/* Phone frame: full-screen on mobile, centered 430px card on desktop */}
            <div className="relative w-full h-full md:max-w-[430px] md:shadow-2xl overflow-hidden bg-white">
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
                    path="/student/tutorial"
                    component={StudentTutorial}
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
                </Switch>
              </IonRouterOutlet>
            </IonReactRouter>
            </div>
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
};
export default App;
