import React, { useState } from "react";
import PrimaryButton from "../../../components/PrimaryButton";
import slide1Img from "../../../assets/onboarding/logo.png";
import slide2Img from "../../../assets/onboarding/finish-line.png";
import slide3Img from "../../../assets/onboarding/leaves.png";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import BackArrow from "../../../icons/BackArrow";

const onboardingData = [
  {
    title: "مرحباً بك في",
    span: "👋سنابل الإحسان",
    img: slide1Img,
    description: "سنابل الإحسان هو تطبيق تفاعلي يعزز القيم النبيلة عند الأطفال",
  },
  {
    title: "ازرع سنبلة تُثمر",
    span: "خيراً وأجراً",
    img: slide3Img,
    description: "اغتنم الفرص لفعل الخير، فالحسنات تتضاعف مع كل عمل صالح",
  },
  {
    title: "تسابقوا إلى",
    span: "الخيرات، فإنها تدوم",
    img: slide2Img,
    description: "لا تفوّت الفرصة لفعل الخير، فالأجر يعمّ والحسنات تُكتب",
  },
];

const OnBoarding: React.FC = () => {
  const { t } = useTranslation();
  const [stepCount, setStepCount] = useState(0);
  const history = useHistory();

  function changeStepIncrement() {
    if (stepCount === 2) {
      localStorage.setItem("hasVisited", "true");
      history.push("/choosesignmethod");
    } else {
      setStepCount(stepCount + 1);
    }
  }

  function changeStepDecrement() {
    if (stepCount !== 0) {
      setStepCount(stepCount - 1);
    }
  }

  function skipOnboarding() {
    localStorage.setItem("hasVisited", "true");
    history.push("/choosesignmethod");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="onboarding-page"
    >
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <button
          type="button"
          className="p-3 px-5 border-2 cursor-pointer rounded-3xl text-blueprimary border-blueprimary bg-transparent font-semibold select-none touch-manipulation active:scale-95 transition-transform"
          onClick={skipOnboarding}
        >
          {t("تخطي")}
        </button>
        <LanguageSwitcher />
      </div>

      {/* Animated Image with key and exit animation */}
      <div className="flex justify-center w-full min-h-[180px] max-h-[34dvh] overflow-hidden shrink-0">
        <motion.img
          key={stepCount}
          src={onboardingData[stepCount].img}
          className="object-contain w-2/3 h-auto max-h-full pointer-events-none select-none"
          initial={{ opacity: 0, y: -250 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* Progress indicators */}
      <motion.div
        className="flex-row w-full gap-3 flex-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {onboardingData.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-1/6 rounded-lg ${
              index === stepCount ? "bg-blueprimary" : "bg-gray-300"
            }`}
          ></div>
        ))}
      </motion.div>

      {/* Animated Text Content */}
      <motion.div
        className="flex flex-col w-full gap-4 pb-2"
        key={stepCount}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-[#040415] text-2xl sm:text-3xl text-center font-bold leading-tight select-none">
          {t(onboardingData[stepCount].title)}
          <br />
          <span className="text-blueprimary">
            {" "}
            {t(onboardingData[stepCount].span)}
          </span>
        </h1>
        <p className="text-[#999] text-center w-4/5 mx-auto select-none">
          {t(onboardingData[stepCount].description)}
        </p>

        {/* Button Controls */}
        <div className="flex flex-row-reverse items-center w-full gap-2 px-4">
          <div className="w-full">
            <PrimaryButton
              style="fill"
              text={t("متابعة")}
              arrow={i18n.language === "en" ? "right" : "left"}
              onClick={changeStepIncrement}
            />
          </div>

          {stepCount !== 0 && (
            <button
              type="button"
              className="flex-center p-3 border-2 border-[#EAECF0] rounded-xl self-end w-1/4 min-h-[52px] bg-white cursor-pointer select-none touch-manipulation active:scale-95 transition-transform"
              onClick={changeStepDecrement}
            >
              <BackArrow
                size={25}
                className={`pointer-events-none select-none ${
                  i18n.language === "en" ? "rotate-180" : ""
                } text-[#B3B3B3]`}
              />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnBoarding;
