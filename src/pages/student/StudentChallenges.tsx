import { IonRouterLink } from "@ionic/react";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import sanabelVideo from "../../assets/sanabelAnimation.mp4";
import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import Success from "../../assets/Success.json"; // Replace with a To-Do specific animation if desired
import { useRef, useEffect, useState } from "react";

// Pages
import StudentToDoList from "./StudentToDoList";
import ChooseSanabelType from "./challenges/ChooseSanabelType";
import { useUserContext } from "../../context/StudentUserProvider";
import { useAutoStartGuide } from "../../guides/useAutoStartGuide";

const Challenges: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<"todo" | "sanabel">("todo");

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  // Confetti size
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight * 0.9;

  // Ref to control video playback speed
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5;
    }
  }, []);

  const { user } = useUserContext();

  // Students with no class assigned get the "personal" to-do list; school
  // students choose a Sanabel type first, matching StudentNavbar's gating.
  const isPersonal = !user?.classId;
  useAutoStartGuide(
    isPersonal ? "student-mission-personal" : "student-mission-school",
    !!user
  );
  return (
    <motion.div
      className="flex flex-col items-center w-full h-full overflow-y-auto" // Added pb-4 for bottom padding
      id="page-height"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Dynamic View Rendering */}
      <div className="w-full max-w-md overflow-y-auto bg-white shadow-md rounded-xl">
        {isPersonal ? <StudentToDoList /> : <ChooseSanabelType />}
      </div>

      {/* Navbar */}
      <StudentNavbar />
    </motion.div>
  );
};

export default Challenges;
