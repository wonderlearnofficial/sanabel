import sanabelType1Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType2Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";
import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";

import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";

// overview icons
import { useUserContext } from "../../../context/StudentUserProvider";
import { motion } from "framer-motion";
import missionsDoneImg from "../../../assets/target.png";
import MedalAndLevel from "../../../components/MedalAndLevel";
import { calculateLevel } from "../../../utils/LevelCalculator";
// Define the data structure for the chart
import { useEffect, useState } from "react";
import axios from "axios";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (index: number) => ({
    opacity: 1,
    y: 10,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const Profile: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const { t } = useTranslation();
  const { user } = useUserContext();
  const xp = Number(user?.xp);

  const { level, remainingXp, xpForNextLevel } = calculateLevel(xp);

  const [completedTasks, setCompletedTasks]: any = useState(0);

  const fetchTasksCompleted = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await axios.get(
        "https://sanabel.wonderlearn.net/students/calculate-completed-tasks-by-category",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
        setCompletedTasks(response.data.totalCompletedTasks);
        setCategoryCounts(response.data.categoryCounts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchTasksCompleted();
  }, []);

  // Define the data structure for the chart
  interface sanabelType {
    name: string;
    value: number;
  }

  const [categoryCounts, setCategoryCounts] = useState({
    "سنابل الإحسان في العلاقة مع الله": 0,
    "سنابل الإحسان في العلاقة مع النفس": 0,
    "سنابل الإحسان في العلاقة مع الأسرة والمجتمع": 0,
    "سنابل الإحسان في العلاقة مع الأرض والكون": 0,
  });
  // Dynamic chart data

  const sanabelType = [
    {
      name: "العلاقة مع الله",
      img: sanabelType4Img,
      value: Object.values(categoryCounts)[0],
    },
    {
      name: "العلاقة مع النفس",
      img: sanabelType2Img,
      value: Object.values(categoryCounts)[1],
    },
    {
      name: "العلاقة مع الأسرة والمجتمع",
      img: sanabelType1Img,
      value: Object.values(categoryCounts)[2],
    },
    {
      name: "العلاقة مع الأرض والكون",
      img: sanabelType3Img,
      value: Object.values(categoryCounts)[3],
    },
  ];

  const total = sanabelType.reduce((acc, item) => acc + item.value, 0);

  return (
    <div
      className="z-10 flex flex-col items-start justify-start w-full h-full p-4 overflow-y-auto "
      id="page-height"
    >
      <MedalAndLevel
        level={level}
        color={"text-black text-sm"}
        dir={""}
        size={""}
      />

      <div className="flex flex-col gap-1">
        <motion.div
          className="w-full bg-[#E14E54] flex-center justify-between items-center p-1 gap-3 rounded-xl text-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="font-bold text-white"
            dir="ltr"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {sanabelType[0].value +
              sanabelType[1].value +
              sanabelType[2].value +
              sanabelType[3].value}
          </motion.h1>

          <motion.h1
            className="font-bold text-white"
            dir="ltr"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {t("مجموع التحديات")}
          </motion.h1>

          <motion.img
            src={missionsDoneImg}
            alt=""
            className="w-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: "backOut" }}
          />
        </motion.div>
        <motion.div
          className="grid w-full grid-cols-2 gap-2"
          initial="hidden"
          animate="visible"
        >
          {sanabelType.map((items, index) => (
            <motion.div
              className="flex justify-start flex-col border-t-2 border-[#E14E54] rounded-2xl w-full p-1"
              key={index}
              variants={gridItemVariants}
              custom={index}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className="text-[#E14E54] font-bold text-xl">
                  {items.value}
                </h1>
                <img src={items.img} alt="sanabel" className="w-1/3" />
              </div>
              <h1 className="text-sm font-bold text-black text-end">
                {t(items.name)}
              </h1>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
