import { useState } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import PrimaryButton from "../../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../../components/GenericInput";
import BackArrow from "../../../../icons/BackArrow";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";
// Import AVATARS
// Boys Avatars
import boy1 from "../../../../assets/avatars/Boys/boy1.png";
import boy2 from "../../../../assets/avatars/Boys/boy2.png";
import boy3 from "../../../../assets/avatars/Boys/boy3.png";
import boy4 from "../../../../assets/avatars/Boys/boy4.png";
import boy5 from "../../../../assets/avatars/Boys/boy5.png";
import boy6 from "../../../../assets/avatars/Boys/boy6.png";
import boy7 from "../../../../assets/avatars/Boys/boy7.png";

// Girls Avatars
import girl1 from "../../../../assets/avatars/Girls/girl1.png";
import girl2 from "../../../../assets/avatars/Girls/girl2.png";
import girl3 from "../../../../assets/avatars/Girls/girl3.png";
import girl4 from "../../../../assets/avatars/Girls/girl4.png";
import girl5 from "../../../../assets/avatars/Girls/girl5.png";
import girl6 from "../../../../assets/avatars/Girls/girl6.png";
import girl7 from "../../../../assets/avatars/Girls/girl7.png";
import girl8 from "../../../../assets/avatars/Girls/girl8.png";
import girl9 from "../../../../assets/avatars/Girls/girl9.png";

import ProgressBar from "../ProgressBar";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import i18n from "../../../../i18n";

const Toaster = () => (
  <ToastContainer
    position="top-right"
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

// Grouped arrays for easier access
const boysAvatars = [boy1, boy2, boy3, boy4, boy5, boy6, boy7];
const girlsAvatars = [
  girl1,
  girl2,
  girl3,
  girl4,
  girl5,
  girl6,
  girl7,
  girl8,
  girl9,
];

interface Step6Props {
  onComplete: () => void;
  character: string;
  setCharacter: React.Dispatch<React.SetStateAction<string>>;
  onBack: () => void;
  gender: string;
}

const Step6: React.FC<Step6Props> = ({
  onComplete,
  character,
  setCharacter,
  onBack,
  gender,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  function handleGenderStep() {
    if (!character) {
      toast.error(t("يرجى اختيار صورة شخصية قبل المتابعة"));
    } else {
      onComplete();
    }
  }
  console.log(character);
  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10">
      <div className="absolute">
        <Toaster />
      </div>
      <div className="flex flex-col w-full gap-3">
        <div className="flex self-end justify-start w-full">
          <GoBackButton onClick={onBack} />
        </div>
        <ProgressBar filledBars={6} />

        <div className="flex flex-col self-end gap-2">
          <h1 className="text-2xl font-bold text-black text-end " dir="ltr">
            {t("اضع صورة شخصية لك")}
          </h1>

          <p className="text-[#B3B3B3] text-sm text-end">
            {t("اكمل حسابك واستمتع بتجربة تفاعلية تبني العطاء والانتماء")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5">
        {(gender === "boy" ? boysAvatars : girlsAvatars).map(
          (avatar, index) => (
            <img
              key={index}
              src={avatar}
              alt={`Avatar ${index + 1}`}
              className={`w-20 h-20 bg-redprimary rounded-full  ${
                character == avatar ? "scale-125 opacity-100" : "opacity-70"
              }`}
              onClick={() => setCharacter(avatar)}
            />
          )
        )}
      </div>

      <div className="w-full ">
        <div onClick={handleGenderStep}>
          <PrimaryButton
            style="fill"
            text={t("أبدا رحلة جمع الحسنات")}
            arrow="left"
          />
        </div>
      </div>
    </div>
  );
};

export default Step6;
