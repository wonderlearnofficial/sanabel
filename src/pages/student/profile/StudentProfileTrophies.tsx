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

const Profile: React.FC = () => {
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
  const [allTrophies, setAllTrophies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to process trophies and keep only the highest point value for each title
  const processHighestTrophies = (trophies: any[]) => {
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

  const fetchAllTrophies = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch Sanabel trophies
      const sanabelResponse = await axios.get(
        "https://sanabel.wonderlearn.net/students/student-trophy-primaire-completed",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Fetch Other trophies (using the same endpoint in your example, but you might want to change this)
      const otherResponse = await axios.get(
        "https://sanabel.wonderlearn.net/students/student-trophy-secondaire-completed",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (sanabelResponse.status === 200 && otherResponse.status === 200) {
        // Combine and process all trophies
        const combinedTrophies = [
          ...sanabelResponse.data.data,
          ...otherResponse.data.data,
        ];

        const highestTrophies = processHighestTrophies(combinedTrophies);
        setAllTrophies(highestTrophies);
        console.log("All processed trophies:", highestTrophies);
      }
    } catch (error) {
      console.error("Error fetching trophies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTrophies();
  }, []);

  // Function to get milestone display text
  const getMilestoneText = (trophy: any) => {
    if (trophy.challenge.title === "Tree Stage") {
      return `${t(trophy.challenge.title)} ${trophy.challenge.point}`;
    } else if (trophy.challenge.point > 1) {
      // For other trophies with milestone/levels
      return `${t(trophy.challenge.title)} - ${t("Level")} ${
        trophy.challenge.point
      }`;
    } else {
      // For trophies without levels
      return t(trophy.challenge.title);
    }
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
            allTrophies.map((trophy: any, index: number) => (
              <motion.div
                key={`${trophy.challenge.title}-${index}`}
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
                />

                <h1 className="text-xs text-center text-black ">
                  {trophy.challenge.point}
                </h1>
                <h1 className="h-8 text-xs text-center text-black" dir="rtl">
                  {t(trophy.challenge.title).split(" ").slice(0, 4).join(" ")}
                </h1>
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center">
              <p>
                {t("No trophies found. Complete challenges to earn trophies!")}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
