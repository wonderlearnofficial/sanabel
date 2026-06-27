import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import { treeStages } from "../../../data/Tree";

interface ProfileProps {
  treeStage: number;
  treeProgress: number;
}

const Profile: React.FC<ProfileProps> = ({ treeStage, treeProgress }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const { t } = useTranslation();

  // Calculate current stage based on props instead of user context
  const currentStage = treeProgress + 3;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (stage < currentStage) {
        setStage(stage + 1);
      } else {
        clearInterval(intervalId);
      }
    }, 25); // Adjust the interval for smoother animation

    return () => clearInterval(intervalId);
  }, [stage, currentStage]);

  return (
    <div className="flex flex-col justify-start items-center h-full w-full gap-1 ">
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: currentStage * 0.05, duration: 0.5 }} // Delay the text animation until the tree animation finishes
        className="text-[#495638] text-xl "
      >
        {/* {treeStage} {t("المرحلة")} */}
      </motion.h1>
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        src={treeStages[stage - 1]}
        alt="tree"
        className="w-2/3"
      />
    </div>
  );
};

export default Profile;
