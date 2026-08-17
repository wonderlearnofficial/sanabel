import StudentNavbar from "../../../components/navbar/StudentNavbar";
import ThemeSwitcher from "../../../components/ThemeSwitcher";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { useHistory } from "react-router-dom";

import ProfileArrow from "../../../icons/ProfileArrow";
import Greeting from "../../../components/Greeting";
import { useTranslation } from "react-i18next";

// Import Icons
import ChangeLanguage from "../../../icons/Profile/ChangeLanguage";
import ChangePassword from "../../../icons/Profile/ChangePassword";
import Darkmode from "../../../icons/Profile/Darkmode";
import HelpCenter from "../../../icons/Profile/HelpCenter";
import Logout from "../../../icons/Profile/Logout";
import PrivacyPolicy from "../../../icons/Profile/PrivacyPolicy";
import { MdDarkMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";
import { MdVolumeOff, MdVolumeUp, MdVibration } from "react-icons/md";

import { useState, useEffect } from "react";
import i18n from "../../../i18n";
import { IonRouterLink } from "@ionic/react";
import { useTheme } from "../../../context/ThemeContext";

import GoBackButton from "../../../components/GoBackButton";
import { logoutSession } from "../../../utils/session";
import DeleteAccountPopup from "../../student/profile/StudentDeleteAccountPopup";
import DarkModeComingSoon from "../../common/DarkModeComingSoon";
import { AudioManager } from "../../../utils/AudioManager";
import { HapticsManager } from "../../../utils/HapticsManager";
import SettingToggle from "../../../components/common/SettingToggle";

const Profile: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const { t } = useTranslation();
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(
    AudioManager.effectsEnabled,
  );
  const [vibrationEnabled, setVibrationEnabled] = useState(
    HapticsManager.vibrationEnabled,
  );

  const handleSoundEffectsToggle = () => {
    const enabled = !soundEffectsEnabled;
    AudioManager.setEffectsEnabled(enabled);
    setSoundEffectsEnabled(enabled);
    if (enabled) AudioManager.play("tap", true);
  };

  const handleVibrationToggle = () => {
    const enabled = !vibrationEnabled;
    HapticsManager.setVibrationEnabled(enabled);
    setVibrationEnabled(enabled);
    if (enabled) {
      HapticsManager.impactMedium();
    }
  };

  async function logout() {
    AudioManager.play("tap");
    localStorage.setItem("hasVisited", "false");

    // Invalidate the session server-side and clear token/refreshToken/role
    await logoutSession();

    // Redirect to login or onboarding page
    history.push("/choosesignmethod");
  }

  const handleLanguageToggle = () => {
    const newLanguage = i18n.language === "ar" ? "en" : "ar";
    const newDir = newLanguage === "ar" ? "rtl" : "ltr";

    // Update the language in i18n
    i18n.changeLanguage(newLanguage);

    // Update direction attribute
    document.documentElement.setAttribute("dir", newDir);

    // Save the selected language and direction in localStorage
    localStorage.setItem("language", newLanguage);
    localStorage.setItem("dir", newDir);
  };

  const redirectPage = (route: string) => {
    if (route) {
      history.push(route);
    }
  };

  const [deleteAccountPopup, setDeleteAccountPopup] = useState(false);

  const profileButtons = [
    {
      title: `${
        i18n.language === "en" ? "تغيير إلى العربية" : "تغيير إلى الإنجليزية"
      }`,
      icon: <ChangeLanguage size={25} />,
      to: "",
      function: handleLanguageToggle,
      type: "link",
    },
    {
      title: "تغيير كلمة المرور",
      icon: <ChangePassword size={25} />,
      to: "/changeprofilepassword",
      type: "link",
    },
    {
      title: "سياسة الخصوصية",
      icon: <PrivacyPolicy size={25} />,
      to: "/student/settings/privacypolicy",
      type: "link",
    },
    {
      title: "مركز المساعدة",
      icon: <HelpCenter size={25} />,
      to: "/student/settings/helpcenter",
      type: "link",
    },
    {
      title: "دليل الصفحات",
      icon: <HelpCenter size={25} />,
      to: "/teacher/settings/guides",
      type: "link",
    },
    {
      title: "المؤثرات الصوتية",
      icon: soundEffectsEnabled ? (
        <MdVolumeUp size={25} color="#4AAAD6" />
      ) : (
        <MdVolumeOff size={25} color="#4AAAD6" />
      ),
      to: "",
      function: handleSoundEffectsToggle,
      type: "soundToggle",
    },
    {
      title: "الاهتزاز والتفاعل اللمسي",
      icon: <MdVibration size={25} color={vibrationEnabled ? "#4AAAD6" : "#94a3b8"} />,
      to: "",
      function: handleVibrationToggle,
      type: "vibrationToggle",
    },
    {
      title: "تفعيل الوضع الداكن",
      icon: darkMode ? (
        <MdLightMode size={25} color="#4AAAD6" />
      ) : (
        <MdDarkMode size={25} color="#4AAAD6" />
      ),
      to: "",
      function: () => setShowDarkModePopup(true),
      type: "darkModeToggle",
    },
  ];

  const [showDarkModePopup, setShowDarkModePopup] = useState(false);
  // Handle Dark Mode toggle by showing popup instead of actually toggling
  const handleDarkModeClick = (e: any) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowDarkModePopup(true);
    // toggleDarkMode();
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4">
      <div className="flex flex-row-reverse items-center justify-between w-full gap-3">
        <div className="opacity-0 w-[45px]" />

        <h1 className="text-2xl font-bold text-black text-end " dir="ltr">
          {t("الإعدادات")}
        </h1>
        <GoBackButton />
      </div>

      {/* <IonRouterLink
        className="flex-center text-[#999999] w-full border-2 rounded-lg py-3"
        routerLink="/editprofile"
      >
        <h1>{t("تعديل الملف الشخصي")}</h1>
      </IonRouterLink> */}

      <div className="flex flex-col items-center justify-around w-full h-3/5">
        {profileButtons.map((item, index) => (
          <div className="flex flex-col w-full -mt-10" key={index}>
            <div
              className="flex items-center justify-between w-full p-2 flex-row-reverse border-b-[#D5EBF6] border-b-[1px] rounded-lg"
              onClick={() =>
                item.function ? item.function() : redirectPage(item.to)
              }
            >
              {item.type === "soundToggle" ? (
                <SettingToggle
                  checked={soundEffectsEnabled}
                  onChange={handleSoundEffectsToggle}
                  ariaLabel="تبديل المؤثرات الصوتية"
                />
              ) : item.type === "vibrationToggle" ? (
                <SettingToggle
                  checked={vibrationEnabled}
                  onChange={handleVibrationToggle}
                  ariaLabel="تبديل الاهتزاز والتفاعل اللمسي"
                />
              ) : item.type === "darkModeToggle" ? (
                <SettingToggle
                  checked={darkMode}
                  onChange={() => setShowDarkModePopup(true)}
                  ariaLabel="تبديل الوضع الداكن"
                />
              ) : (
                <ProfileArrow size={25} />
              )}

              <div className="flex-row-reverse gap-3 flex-center">
                <h1 className="text-black dark:text-white">{t(item.title)}</h1>
                <div className="bg-[#D5EBF6] p-2 rounded-full">{item.icon}</div>
              </div>
            </div>

            <div className="h-0.5 bg-gray-200 rounded-lg dark-gray-100" />
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full -mt-10">
        <div
          className="flex w-full p-2 justify-between items-center flex-row-reverse  border-b-[#E14E54] border-b-[1px] rounded-lg"
          onClick={logout}
        >
          <ProfileArrow size={25} />
          <div className="gap-3 flex-center">
            <h1 className={`${"text-[#E14E54] "}`}>{t("تسجيل الخروج")}</h1>
            <div className={`${"bg-[#e14e5349]"}  p-2 rounded-full`}>
              <Logout size={25} />
            </div>
          </div>
        </div>
      </div>

      <DarkModeComingSoon
        isOpen={showDarkModePopup}
        onClose={() => setShowDarkModePopup(false)}
      />

      {/* {deleteAccountPopup && (
        <DeleteAccountPopup
          deleteAccountPopup={deleteAccountPopup}
          setDeleteAccountPopup={setDeleteAccountPopup}
        />
      )} */}
    </div>
  );
};

export default Profile;
