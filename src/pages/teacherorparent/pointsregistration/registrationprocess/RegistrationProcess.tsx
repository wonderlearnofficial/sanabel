import { IonRouterLink } from "@ionic/react";

import { motion } from "framer-motion";
import Confetti from "react-confetti";

import sanabelVideo from "../../assets/sanabelAnimation.mp4";

import { useTranslation } from "react-i18next";

import Lottie from "lottie-react";
import missionsAnimation from "../../../../assets/missions.json";
import { useRef, useEffect } from "react";

const Challenges: React.FC = () => {
  const { t } = useTranslation();

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  // Calculate the window width and height for the confetti effect
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight * 0.9;

  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5; // Set playback rate to 2x
    }
  }, []);

  const welcomeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: custom * 0.3,
        type: "spring",
        stiffness: 50,
      },
    }),
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-between pt-4 overflow-y-auto "
      id="page-height"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Confetti Component */}

      <Confetti
        width={windowWidth} // Set the width of the confetti based on the window size
        height={windowHeight} // Set the height of the confetti based on the window size
        numberOfPieces={50} // Optional: Set the number of confetti pieces (adjust as needed)
        recycle={true} // Optional: Set whether the confetti should fall infinitely or just once
        className="absolute z-0"
      />
      <motion.div
        className="flex-col w-full gap-3 p-4 flex-center"
        dir="rtl"
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-3xl text-redprimary"
          custom={3}
          variants={welcomeVariants}
        >
          {t("تحديات الإحسان")}
        </motion.h1>

        <motion.h1
          className="text-greenprimary"
          custom={4}
          variants={welcomeVariants}
        >
          {t("أم")}
        </motion.h1>

        <motion.h1
          className="text-3xl text-blueprimary"
          custom={5}
          variants={welcomeVariants}
        >
          {t("سنابل الخير؟")}
        </motion.h1>
      </motion.div>

      <div className="relative z-10 w-full h-full gap-5 p-8 flex-center">
        <motion.div variants={itemVariants} className="w-1/2">
          <IonRouterLink
            routerLink="/teacher/missions"
            className="flex-col w-full gap-5 flex-center"
          >
            {/* Lottie Animation */}
            <div className="w-full h-full">
              <Lottie
                animationData={missionsAnimation} // Load your Lottie JSON animation
                loop={true} // Optional: Set to true to loop the animation
                className="w-full h-auto rounded-full bg-redprimary"
              />
            </div>

            <h1 className="text-2xl font-bold text-center text-redprimary">
              {t("تحديات ")}
            </h1>
          </IonRouterLink>
        </motion.div>
        <motion.div variants={itemVariants} className="w-1/2">
          <IonRouterLink
            routerLink="/teacher/sanabel"
            className="flex-col w-full gap-5 flex-center"
          >
            <div className="w-full h-full ">
              <video
                ref={videoRef}
                src={sanabelVideo}
                autoPlay
                loop
                muted
                preload="metadata"
              />
            </div>

            <h1 className="text-2xl font-bold text-center  text-blueprimary">
              {t("سنابل ")}
            </h1>
          </IonRouterLink>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Challenges;
