import { useGuideAutoStart } from '../../../guides/v2/useGuideAutoStart';
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
import { useGuideView } from "../../../guides/v2/useGuideView";
import { toFiniteNumber } from "../../../utils/numericData";

const Progress: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const treeProgress = toFiniteNumber(user?.treeProgress);
  console.log(treeProgress);

  // Tutorial V2: this route hosts four tabs, so the tab declares itself.
  useGuideView("student.progress.tree");
  // `studentTreeGuide` in guideConfigs. The id used to be "student-progress",
  // which matches no registered guide, so this tab's guide never ran.
  useAutoStartGuide("student-tree", !!user);

  useGuideAutoStart(!!user);
  return (
    /* The page shell (`#page-height` in StudentProgress) is the scroll
       container. This tab must not declare another: nesting one inside it
       showed two scrollbars, and the h-3/4 cap clipped the tab's last row. */
    <div className="flex flex-col w-full gap-1">
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
