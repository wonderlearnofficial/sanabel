import { API_BASE_URL } from "../../../config/api";
import { IonRouterLink } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import GenericInput from "../../../components/GenericInput";
import GoBackButton from "../../../components/GoBackButton";
import PrimaryButton from "../../../components/PrimaryButton";

import loginImg from "../../../assets/login/logo.png";
import sanabelVideo from "../../../assets/login/loginVideo.mp4";
import { FaHome } from "react-icons/fa";
import { useUserContext } from "../../../context/StudentUserProvider";
import { describeLoginError, validateLoginFields } from "./loginErrors";
import { AudioManager } from "../../../utils/AudioManager";
import { initAppNotificationsOnStartup } from "../../../services/appNotificationManager";
import { localStore, sessionStore } from "../../../utils/safeStorage";

const Toaster = () => (
  <ToastContainer
    position="top-center"
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

const Login: React.FC = () => {
  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5; // Set playback rate
    }
  }, []);

  const { t } = useTranslation();
  const [isKeepLogged, setIsKeepLogged] = useState(false);
  const history = useHistory();

  useEffect(() => {
    // Flags set by the axios interceptor when a forced sign-out redirects here.
    const flag = sessionStore.getItem("accountDeleted") === "true"
      ? "accountDeleted"
      : sessionStore.getItem("sessionExpired") === "true"
        ? "sessionExpired"
        : null;
    if (!flag) return;
    toast.error(
      t(flag === "accountDeleted" ? "account_deleted_message" : "انتهت صلاحية جلستك. سجل الدخول مرة أخرى."),
      { toastId: flag },
    );
    // Clear the flag only once the effect has settled: StrictMode's
    // mount/unmount/mount would otherwise consume it in the discarded pass,
    // whose toast is dropped with the unmounted container.
    const timer = window.setTimeout(() => sessionStore.removeItem(flag), 0);
    return () => window.clearTimeout(timer);
  }, [t]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { refreshUserData } = useUserContext();

  const handleLogin = async () => {
    const validationError = validateLoginFields(email, password);
    if (validationError) {
      AudioManager.play("error");
      toast.error(t(validationError));
      return;
    }

    try {
      const response = await axios.patch(`${API_BASE_URL}/users/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        AudioManager.play("success");

        const role = response.data.data.user.role;

        // Admin account is not a supported mobile application role.
        // Immediately redirect to the dedicated Admin Console handoff screen
        // without persisting a long-lived mobile Admin session, without background
        // token renewal, and without fetching student/teacher/parent state.
        if (role === "Admin") {
          localStore.removeItem("token");
          localStore.removeItem("refreshToken");
          localStore.removeItem("role");
          localStore.removeItem("user");
          localStore.setItem("keepLoggedIn", "false");

          toast.success(t("login_successful"));
          history.replace("/admin-redirect");
          return;
        }

        // Store auth token for mobile roles (Student, Teacher, Parent)
        const sessionStored = localStore.setItem(
          "token",
          `${response.data.data.user.token.toString()}`,
        );
        if (!sessionStored) {
          toast.error(t("تعذر حفظ جلسة تسجيل الدخول على هذا الجهاز"));
          return;
        }

        // Store refresh token for silent access-token renewal
        if (response.data.data.user.refreshToken) {
          localStore.setItem(
            "refreshToken",
            response.data.data.user.refreshToken,
          );
        }

        // Store Role preference
        localStore.setItem("role", response.data.data.user.role.toString());

        // Store keepLoggedIn preference
        localStore.setItem("keepLoggedIn", "true");

        // A password sign-in is never an impersonated session. A marker left by
        // an earlier Admin preview on this device would otherwise keep this
        // user's guides suppressed.
        localStore.removeItem("isImpersonated");
        localStore.removeItem("impersonatedStudentName");

        // Trigger notification check & setup in the background for this user
        initAppNotificationsOnStartup().catch(() => {});

        // Check if this user has logged in before
        const hasCompletedTutorial = localStore.getItem(
          `tutorialComplete-${email}`,
        );

        // Only set firstTimer to true if they haven't completed the tutorial before
        if (!hasCompletedTutorial) {
          localStore.setItem("firstTimer", "true");
        } else {
          // Make sure firstTimer is set to false for returning users
          localStore.setItem("firstTimer", "false");
        }

        // Show success message
        toast.success(t("login_successful"));

        // Load the role-specific account data into the shared context before navigating
        await refreshUserData(response.data.data.user.token);

        if (role === "Student") {
          history.replace(
            hasCompletedTutorial
              ? "/student/home"
              : "/student/create-avatar",
          );
        } else if (role === "Teacher") {
          history.replace("/teacher/home");
        } else if (role === "Parent") {
          history.replace("/parent/home");
        } else {
          history.replace("/");
        }
      }
    } catch (error) {
      AudioManager.play("error");
      toast.error(t(describeLoginError(error)));
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10 overflow-y-auto">
      <div className="absolute">
        <Toaster />
      </div>

      <div className="flex flex-col w-full gap-3">
        <div className="flex self-end justify-start w-full">
          <GoBackButton />
        </div>

        <div className="flex flex-col self-end gap-2">
          <h1 className="text-2xl font-bold text-black ">
            {t("تسجيل الدخول")}{" "}
          </h1>
          <p className="text-[#B3B3B3] text-sm   ">
            {t("سجل الآن واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}{" "}
          </p>
        </div>
      </div>
      <div className="w-full -my-7 ">
        <video
          ref={videoRef}
          src={sanabelVideo}
          autoPlay
          muted
          playsInline
          preload="metadata"
        />
      </div>

      <div className="flex flex-col w-full gap-4">
        {" "}
        <GenericInput
          type="email"
          placeholder={t("email_example")}
          title={t("البريد الإلكتروني")}
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <div className="flex flex-col gap-5">
          <GenericInput
            type="password"
            placeholder={t("أدخل كلمة السر")}
            title={t("كلمة السر")}
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <div className="flex items-center justify-between">
            <IonRouterLink routerLink="/forgotpassword">
              <h1 className="text-blueprimary" dir="ltr">
                {t("هل نسيت كلمة السر؟")}
              </h1>
            </IonRouterLink>
          </div>
        </div>
      </div>

      <div className="w-full">
        <PrimaryButton style="fill" text={t("تسجيل الدخول")} arrow="none" onClick={handleLogin} />
      </div>

      <IonRouterLink routerLink="/choosesignmethod" className="text-md">
        <h1 className="text-[#8E99A4] font-semibold">
          {t("ليس لديك حساب؟")}{" "}
          <span className="text-blueprimary ">{t("إنشاء حساب")}</span>
        </h1>
      </IonRouterLink>
    </div>
  );
};

export default Login;
