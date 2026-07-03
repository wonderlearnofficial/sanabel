import { API_BASE_URL } from "../../../config/api";
import { useTranslation } from "react-i18next";
import PrimaryButton from "../../../components/PrimaryButton";
import i18n from "../../../i18n";
import BackArrow from "../../../icons/BackArrow";
import { useHistory } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { medalsImgs } from "../../../data/Medals";
import xpIcon from "../../../assets/resources/اكس بي.png";
import lock from "../../../icons/lock.svg";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Intro from "./Intro";
import Promo from "./Promo";
import ProfilePicture from "./ProfilePicture";
import XpStep from "./XpIntro";
import LevelStep from "./LevelStep";
import MedalsStep from "./MedalsStep";
import Leaderboard from "./Leaderboard";
import Sanabel from "./Sanabel";
import SanabelMissions from "./SanabelMissions";
import SanabelTypes from "./SanabelTypes";
import Rewards from "./Rewards";
import Shop from "./Shop";
import TreeGrow from "./TreeGrow";
import TreeFrames from "./TreeFrames";
import Outro from "./Outro";
import Trophies from "./Trophies";

import { avatars } from "../../../data/Avatars";

import { useUserContext } from "../../../context/StudentUserProvider";

const StudentTutorial: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [stepCount, setStepCount] = useState(0);
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);

  const [treeProgress, setTreeProgress] = useState(0);
  const [treeFrames, setTreeFrames] = useState(0);
  const [isShopDone, seIsShopDone] = useState(false);

  const [trophyIndex, setTrophyIndex] = useState(0);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const typeColors = [
    "bg-blueprimary",
    "bg-redprimary",
    "bg-yellowprimary",
    "bg-greenprimary",
  ];

  const updateTypeIndex = (index: number) => {
    setCurrentTypeIndex(index);
  };

  const { user } = useUserContext();

  const steps = [
    <ProfilePicture />,
    <Intro name={`${user?.firstName}`} />,
    <Promo />,
    <SanabelTypes />,
    <Sanabel
      onTypeChange={updateTypeIndex}
      currentTypeIndex={currentTypeIndex}
    />,
    <SanabelMissions />,
    <Trophies trophyIndex={trophyIndex} setTrophyIndex={setTrophyIndex} />,
    <Rewards />,
    <Shop isShopDone={isShopDone} seIsShopDone={seIsShopDone} />,

    <TreeGrow treeProgress={treeProgress} setTreeProgress={setTreeProgress} />,
    <TreeFrames treeFrames={treeFrames} setTreeFrames={setTreeFrames} />,

    <XpStep />,
    <LevelStep />,
    <MedalsStep />,
    <Leaderboard />,
    <Outro />,
  ];

  // Persist the chosen avatar as soon as the student leaves the avatar step,
  // instead of waiting until the very end of the tutorial — otherwise closing
  // the app partway through the (long) tutorial loses the avatar entirely,
  // since until now it only ever got saved on the final Outro screen.
  const saveAvatarToServer = async () => {
    const authToken = localStorage.getItem("token");
    const avatarDataString = localStorage.getItem("avatarData");
    if (!authToken || !avatarDataString) return true;

    try {
      const avatarData = JSON.parse(avatarDataString);
      await axios.patch(
        `${API_BASE_URL}/students/update-profile-image`,
        {
          profileImg: {
            avatarId: avatarData.avatarId,
            bgColor: avatarData.bgColor,
            bgPattern: avatarData.bgPattern,
            gender: avatarData.gender,
            hairColor: avatarData.hairColor,
            skinColor: avatarData.skinColor,
            tshirtColor: avatarData.tshirtColor,
          },
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      return true;
    } catch (error) {
      console.error("Error saving avatar:", error);
      toast.error(t("تعذر حفظ الصورة الشخصية، حاول مرة أخرى"));
      return false;
    }
  };

  // Handle step navigation
  async function changeStepIncrement() {
    if (stepCount < steps.length - 1) {
      if (stepCount === 0) {
        setIsSavingAvatar(true);
        const saved = await saveAvatarToServer();
        setIsSavingAvatar(false);
        if (!saved) return;
      }

      setStepCount(stepCount + 1);

      setTreeProgress(0);
      setTreeFrames(0);
      seIsShopDone(false);
    }
  }

  function changeStepDecrement() {
    if (stepCount > 0) {
      setStepCount(stepCount - 1);
      setTreeProgress(0);
      setTreeFrames(0);
      seIsShopDone(false);
    }
  }

  // Only apply the background color when on the SanabelTypes step

  const [bgColor, setBgColor] = useState("bg-white");

  useEffect(() => {
    if (stepCount === 4) {
      setBgColor(typeColors[currentTypeIndex]);
    } else if (stepCount === 5) {
      setBgColor("bg-blueprimary");
    } else if (stepCount === 6) {
      if (trophyIndex == 1) {
        setBgColor("bg-blueprimary/30");
      } else {
        setBgColor("bg-yellowprimary/30");
      }
    } else {
      setBgColor("bg-white");
    }
  }, [stepCount, currentTypeIndex, typeColors]);

  const navigationButton = (
    <div className="flex flex-row-reverse items-center w-full gap-2 overflow-y-auto ">
      <div className="flex-1 border-2 border-white rounded-2xl">
        <PrimaryButton
          style="fill"
          text={
            isSavingAvatar
              ? t("جاري الحفظ...")
              : stepCount === steps.length - 1
              ? t("ابدأ الآن")
              : t("متابعة")
          }
          arrow={isRTL ? "left" : "right"}
          onClick={changeStepIncrement}
          disabled={isSavingAvatar}
        />
      </div>
      {stepCount > 0 && !isSavingAvatar && (
        <div
          className="flex-center p-3 border-2 border-[#EAECF0] bg-white rounded-xl w-14 h-14 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={changeStepDecrement}
        >
          <BackArrow
            size={24}
            className={`text-gray-500 ${isRTL ? "" : "rotate-180"}`}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`flex flex-col items-center justify-between p-4 overflow-y-auto h-full w-full ${bgColor} transition-colors duration-500`}
    >
      <ToastContainer position="top-center" autoClose={2500} rtl />
      <div className="flex flex-col gap-2 overflow-y-auto">
        <div
          className="w-24 p-1 px-2 mx-auto text-center border-2 cursor-pointer rounded-3xl text-blueprimary text-md"
          onClick={() => setStepCount(steps.length - 1)}
        >
          {t("تخطي")}
        </div>
        <div className="relative flex items-center justify-center w-full h-12 gap-2 pb-12">
          {steps.map((_, index) => (
            <div key={index} className="relative flex items-center">
              {/* Dot */}
              <div
                className={`h-3 w-3 rounded-full z-10 transition-all duration-300 border-white ${
                  stepCount >= index ? "bg-yellow-500" : "bg-gray-300"
                }`}
              />
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2  w-8 bg-gray-300 overflow-hidden ${
                    i18n.language === "en" ? "right-2" : "left-2"
                  }`}
                >
                  <div
                    className={`h-full bg-yellow-500 transition-all duration-500 origin-${
                      i18n.language === "en" ? "right" : "left"
                    }`}
                    style={{
                      transform: `scaleX(${stepCount > index ? 1 : 0})`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
      // key={reRenderKey}
      >
        {steps[stepCount]}
      </div>

      <div className="w-full h-32">
        {/* Navigation buttons */}
        {(stepCount !== 9 || (stepCount === 9 && treeProgress > 3)) &&
          (stepCount !== 8 || isShopDone) &&
          stepCount != steps.length - 1 &&
          navigationButton}

        {(stepCount === 9 && treeProgress < 4) ||
        (stepCount === 8 && !isShopDone) ||
        stepCount == steps.length - 1 ? (
          <div className=""></div>
        ) : null}
      </div>
    </div>
  );
};

export default StudentTutorial;
