import { motion } from "framer-motion";
import StudentNavbar from "../../../components/navbar/StudentNavbar";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import { useUserContext } from "../../../context/StudentUserProvider";

import { useEffect, useState } from "react";
import axios from "axios";
import { OtherTrophies } from "../../../data/OtherTrophies";
import { SanabelTrophies } from "../../../data/SanabelTrophies";

import treestage1 from "../../../assets/trophies/Other Trophies/مرحلة - 1.png";
import treestage2 from "../../../assets/trophies/Other Trophies/مرحلة - 2.png";
import treestage3 from "../../../assets/trophies/Other Trophies/مرحلة - 3.png";
import treestage4 from "../../../assets/trophies/Other Trophies/مرحلة - 4.png";
import treestage5 from "../../../assets/trophies/Other Trophies/مرحلة - 5.png";

interface Challenge {
  id: number;
  title: string;
  description: string;
  point: number;
  category: string;
  taskCategory: string;
  xp: number;
  snabelBlue: number;
  snabelRed: number;
  snabelYellow: number;
  water: number;
  seeder: number;
  tasktype: string | null;
}

interface ChallengeStudent {
  challengeId: number;
  CompletionStatus: string;
  updatedAt: string;
  challenge: Challenge;
}

interface StudentProfileTrophiesProps {
  trophies: ChallengeStudent | ChallengeStudent[];
}

const StudentProfileTrophies: React.FC<StudentProfileTrophiesProps> = ({
  trophies,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const { t } = useTranslation();
  const { user } = useUserContext();

  const treeStagesImg = [
    treestage1,
    treestage2,
    treestage3,
    treestage4,
    treestage5,
  ];

  const [allTrophies, setAllTrophies] = useState<ChallengeStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (trophies) {
      // Convert single trophy or array of trophies to array
      const trophyArray = Array.isArray(trophies) ? trophies : [trophies];

      // Filter only completed challenges
      const completedTrophies = trophyArray.filter(
        (trophy) => trophy.CompletionStatus === "Completed"
      );

      // Process to get highest point trophies for each title
      const processedTrophies = processHighestTrophies(completedTrophies);

      setAllTrophies(processedTrophies);
      setIsLoading(false);
    } else {
      setAllTrophies([]);
      setIsLoading(false);
    }
  }, [trophies]);

  // Function to process trophies and keep only the highest point value for each title
  const processHighestTrophies = (trophies: ChallengeStudent[]) => {
    const trophyMap = new Map();

    trophies.forEach((trophy) => {
      const title = trophy.challenge.title;
      const currentPoints = trophy.challenge.point;

      if (
        !trophyMap.has(title) ||
        trophyMap.get(title).challenge.point < currentPoints
      ) {
        trophyMap.set(title, trophy);
      }
    });

    return Array.from(trophyMap.values());
  };

  return (
    <div
      className="z-10 flex flex-col items-center justify-between w-full h-full p-4 overflow-y-auto"
      id="page-height"
    >
      {isLoading ? (
        <div className="flex-center">
          <p>Loading trophies...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid justify-between w-full grid-cols-4 gap-1"
        >
          {allTrophies.length > 0 ? (
            allTrophies.map((trophy: ChallengeStudent, index: number) => (
              <motion.div
                key={`${trophy.challenge.title}-${trophy.challengeId}-${index}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-col flex-center"
              >
                <img
                  src={
                    (trophy.challenge.title === "Tree Stage" &&
                      treeStagesImg[trophy.challenge.point - 1]) ||
                    OtherTrophies[trophy.challenge.title] ||
                    SanabelTrophies[
                      trophy.challenge.title as keyof typeof SanabelTrophies
                    ]
                  }
                  alt={trophy.challenge.title}
                  className="object-contain w-16 h-16"
                />
                <h1 className="text-xs text-center text-black">
                  {t(trophy.challenge.title)}
                </h1>
                <h1 className="text-xs text-center text-black">
                  {trophy.challenge.point}
                </h1>
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center">
              <p>No trophies found. Complete challenges to earn trophies!</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StudentProfileTrophies;
