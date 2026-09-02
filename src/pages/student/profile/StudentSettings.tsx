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
import {
  MdDarkMode,
  MdLightMode,
  MdNotificationsActive,
  MdNotificationsOff,
  MdVolumeOff,
  MdVolumeUp,
  MdVibration,
} from "react-icons/md";
import { API_BASE_URL } from "../../../config/api";
import axios from "axios";
import { AudioManager } from "../../../utils/AudioManager";
import { HapticsManager } from "../../../utils/HapticsManager";
import SettingToggle from "../../../components/common/SettingToggle";

import { useState, useEffect } from "react";
import i18n from "../../../i18n";
import { IonRouterLink } from "@ionic/react";
import { useTheme } from "../../../context/ThemeContext";
import DeleteAccountPopup from "./StudentDeleteAccountPopup";

import GoBackButton from "../../../components/GoBackButton";
import { logoutSession } from "../../../utils/session";
import {
  enablePrayerNotifications,
  disablePrayerNotifications,
  EGYPT_CITIES,
  PrayerCity,
} from "../../../services/prayerNotifications";

import DarkModeComingSoon from "../../common/DarkModeComingSoon";

const Profile: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const { t } = useTranslation();

  const [prayerNotifications, setPrayerNotifications] = useState(
    localStorage.getItem("prayerNotifications") === "true"
  );
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

  const [isTogglingPrayer, setIsTogglingPrayer] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const handlePrayerNotificationsToggle = async () => {
    if (isTogglingPrayer) return;
    setIsTogglingPrayer(true);

    try {
      if (!prayerNotifications) {
        // Handles every platform: local notifications on Android/iOS,
        // server-scheduled web push in the browser. Device location is used
        // automatically; the city picker only appears when that fails.
        const result = await enablePrayerNotifications();
        if (result.ok) {
          setPrayerNotifications(true);
          alert(t("تم تفعيل إشعارات الصلاة بنجاح!"));
        } else if (result.needsCity) {
          setShowCityPicker(true);
        } else {
          alert(t(result.message));
        }
      } else {
        await disablePrayerNotifications();
        setPrayerNotifications(false);
      }
    } finally {
      setIsTogglingPrayer(false);
    }
  };

  const handleCitySelected = async (city: PrayerCity) => {
    setShowCityPicker(false);
    setIsTogglingPrayer(true);
    try {
      const result = await enablePrayerNotifications(city);
      if (result.ok) {
        setPrayerNotifications(true);
        alert(t("تم تفعيل إشعارات الصلاة بنجاح!"));
      } else {
        alert(t(result.message));
      }
    } finally {
      setIsTogglingPrayer(false);
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
      type: "darkModeToggle",
    },
    {
      title: "تفعيل إشعارات الصلاة",
      icon: prayerNotifications ? (
        <MdNotificationsActive size={25} color="#4AAAD6" />
      ) : (
        <MdNotificationsOff size={25} color="#4AAAD6" />
      ),
      to: "",
      function: handlePrayerNotificationsToggle,
      type: "prayerToggle",
    },
    {
      title: "تسجيل الخروج",
      icon: <Logout size={25} />,
      to: "choosesignmethod",
      function: logout,
      type: "link",
      isLogout: true,
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
    <div className="flex flex-col items-center justify-between w-full h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between w-full gap-3">
        <GoBackButton />

        <h1 className="text-2xl font-bold text-black text-end " dir="ltr">
          {t("الإعدادات")}
        </h1>
        <div className="opacity-0 w-[45px]" />
      </div>

      <div className="flex flex-col items-center justify-around w-full mt-4 h-3/5">
        {profileButtons.map((item, index) => (
          <div className="flex flex-col w-full mt-2" key={index}>
            <div
              className="flex flex-row-reverse items-center justify-between w-full p-2"
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
              ) : item.type === "prayerToggle" ? (
                <SettingToggle
                  checked={prayerNotifications}
                  onChange={item.function || handlePrayerNotificationsToggle}
                  disabled={isTogglingPrayer}
                  ariaLabel="تبديل إشعارات الصلاة"
                />
              ) : (
                <ProfileArrow size={25} />
              )}

              <div className="flex-row-reverse gap-3 flex-center">
                <h1
                  className={`${
                    item.isLogout
                      ? "text-[#E14E54]"
                      : "text-black dark:text-white"
                  }  `}
                >
                  {t(item.title)}
                </h1>
                <div
                  className={`${
                    item.isLogout ? "bg-[#e14e5349]" : "bg-[#D5EBF6]"
                  }  p-2 rounded-full `}
                >
                  {item.icon}
                </div>
              </div>
            </div>

            <div className="h-0.5 bg-gray-200 rounded-lg dark-gray-100" />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center w-full gap-2 pb-8">
        <h1
          className="text-redprimary"
          // onClick={() => setDeleteAccountPopup(true)}
        >
          {/* {t("حذف الحساب")} */}
        </h1>
      </div>

      {/* City fallback picker — only shown when automatic location fails */}
      {showCityPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="flex flex-col w-full max-w-sm max-h-[80vh] max-h-[80dvh] p-5 bg-white rounded-xl">
            <h2 className="mb-1 text-lg font-bold text-center text-black">
              {t("اختر مدينتك")}
            </h2>
            <p className="mb-3 text-sm text-center text-gray-600">
              {t("لم نتمكن من تحديد موقعك تلقائيًا. اختر أقرب مدينة لك.")}
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {EGYPT_CITIES.map((city) => (
                  <button
                    key={city.key}
                    type="button"
                    onClick={() => handleCitySelected(city)}
                    className="px-3 py-3 text-sm font-medium text-black border-2 border-gray-200 rounded-xl hover:border-blueprimary"
                  >
                    {t(city.arabicName)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCityPicker(false)}
              className="w-full py-2 mt-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl"
            >
              {t("إلغاء")}
            </button>
          </div>
        </div>
      )}

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
