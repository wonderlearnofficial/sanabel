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
import { getErrorMessage } from "../../../config/getErrorMessage";

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
      videoRef.current.playbackRate = 1.5; // Set playback rate to 2x
    }
  }, []);

  const { t } = useTranslation();
  const [isKeepLogged, setIsKeepLogged] = useState(false);
  const history = useHistory();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { refreshUserData } = useUserContext();

  // Modified handleLogin function with proper firstTimer handling
  const handleLogin = async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/login`,
        {
          email,
          password,
        },
      );

      if (response.status === 200) {
        // Store auth token
        localStorage.setItem(
          "token",
          `${response.data.data.user.token.toString()}`,
        );

        // Store Role preference
        localStorage.setItem("role", response.data.data.user.role.toString());

        // Store keepLoggedIn preference
        localStorage.setItem("keepLoggedIn", "true");

        // Check if this user has logged in before
        const hasCompletedTutorial = localStorage.getItem(
          `tutorialComplete-${email}`,
        );

        // Only set firstTimer to true if they haven't completed the tutorial before
        if (!hasCompletedTutorial) {
          localStorage.setItem("firstTimer", "true");
        } else {
          // Make sure firstTimer is set to false for returning users
          localStorage.setItem("firstTimer", "false");
        }

        // Fetch user data immediately after login
        try {
          const userDataResponse = await axios.get(
            `${API_BASE_URL}/students/data`,
            {
              headers: {
                Authorization: `Bearer ${response.data.data.user.token}`,
              },
            },
          );

          // Now set the user data directly before redirecting
          if (userDataResponse.status === 200) {
            // Get the data
            const userData = userDataResponse.data.data.student;

            // Set user in context
            const { setUser } = useUserContext();
            setUser({
              id: userData.id,
              firstName: userData.user.firstName,
              lastName: userData.user.lastName,
              email: userData.user.email,
              role: response.data.data.user.role,
              grade: userData.grade,
              snabelRed: userData.snabelRed,
              snabelBlue: userData.snabelBlue,
              snabelYellow: userData.snabelYellow,
              xp: userData.xp,
              water: userData.water,
              fertilizer: userData.seeders,
              waterNeeded: userData.waterNeeded,
              fertilizerNeeded: response.data.data.treePoint.seeders,
              treeStage: response.data.data.treePoint.stage,
              treeProgress: response.data.data.treePoint.treeProgress,
              connectCode: userData.connectCode,
              profileImg: userData.user.profileImg || "", // Add this line
              canAssignTask: userData.canAssignTask,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }

        await refreshUserData(response.data.data.user.token);

        // Show success message
        toast.success(t("login_successful"));

        history.push("/");
      }
    } catch (error) {
      toast.error(t(getErrorMessage(error, "login_failed")));
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
            placeholder={t("ادخل كلمة السر")}
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

      <div className="w-full" onClick={handleLogin}>
        <PrimaryButton style="fill" text={t("تسجيل الدخول")} arrow="none" />
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
