import StudentNavbar from "../../../components/navbar/StudentNavbar";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import trophy from "../../../assets/trophy.png";
import { useUserContext } from "../../../context/StudentUserProvider";
// Inventory Assets

import SanabelTree from "../../../components/tree/SanabelTree";
import Inventory from "../../../components/tree/Inventory";
import Shop from "../../../components/tree/Shop";
import { useAutoStartGuide } from "../../../guides/useAutoStartGuide";
import { toFiniteNumber } from "../../../utils/numericData";

const Progress: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const treeProgress = toFiniteNumber(user?.treeProgress);
  console.log(treeProgress);

  useAutoStartGuide("student-progress", !!user);

  return (
    <div className="flex flex-col w-full gap-1 overflow-y-scroll h-3/4 ">
      {treeProgress < 51 && (
        <Inventory
          waterCount={toFiniteNumber(user?.water)}
          fertilizerCount={toFiniteNumber(user?.fertilizer)}
          blueCount={toFiniteNumber(user?.snabelBlue)}
          redCount={toFiniteNumber(user?.snabelRed)}
          yellowCount={toFiniteNumber(user?.snabelYellow)}
        />
      )}

      {treeProgress < 51 && <Shop />}

      {/* Tree */}
      <SanabelTree />
    </div>
  );
};

export default Progress;
