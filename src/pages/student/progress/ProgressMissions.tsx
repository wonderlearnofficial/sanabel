import StudentNavbar from "../../../components/navbar/StudentNavbar";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { useEffect, useState } from "react";

// Sanabel type
import sanabelType1Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType2Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";
import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sanabel
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import mixedSanabel from "../../../assets/resources/سنابل.png";

// Navbar
import missionsDoneImg from "../../../assets/target.png";
import axios from "axios";

// Define the colors for the chart
const COLORS = ["#FAB700", "#E14E54", "#495638", "#4AAAD6"];

interface sanabelColor {
  name: string;
  value: number;
}
const sanabelCOLORS = ["#4AAAD6", "#FAB700", "#E14E54"];

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

const ProgressMissions: React.FC = () => {
  const { t } = useTranslation();

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
      name: t("العلاقة مع الله"),
      img: sanabelType4Img,
      value: Object.values(categoryCounts)[0],
    },
    {
      name: t("العلاقة مع النفس"),
      img: sanabelType2Img,
      value: Object.values(categoryCounts)[1],
    },
    {
      name: t("العلاقة مع الأسرة والمجتمع"),
      img: sanabelType1Img,
      value: Object.values(categoryCounts)[2],
    },
    {
      name: t("العلاقة مع الأرض والكون"),
      img: sanabelType3Img,
      value: Object.values(categoryCounts)[3],
    },
  ];

  const total = sanabelType.reduce((acc, item) => acc + item.value, 0);

  const sanabelColor = [
    {
      name: "Blue Sanabel", // Added name property
      value:
        sanabelType[0].value * 2 +
        sanabelType[1].value * 2 +
        sanabelType[2].value * 1 +
        sanabelType[3].value * 1,
    },
    {
      name: "Yellow Sanabel", // Added name property
      value:
        sanabelType[0].value * 2 +
        sanabelType[1].value * 1 +
        sanabelType[2].value * 2 +
        sanabelType[3].value * 1,
    },
    {
      name: "Red Sanabel", // Added name property
      value:
        sanabelType[0].value * 2 +
        sanabelType[1].value * 1 +
        sanabelType[2].value * 1 +
        sanabelType[3].value * 2,
    },
  ];

  const totalSanabel = sanabelColor.reduce((acc, item) => acc + item.value, 0);

  // Filter out zero values for better chart display
  const filteredSanabelType = sanabelType.filter((item) => item.value > 0);
  const filteredSanabelColor = sanabelColor.filter((item) => item.value > 0);

  return (
    <div className="flex flex-col w-full gap-3 overflow-y-auto h-3/4">
      <motion.div
        className="w-full bg-[#E14E54] flex-center justify-between items-center p-2 gap-3 rounded-xl text-lg"
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
          {completedTasks}
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
            <h1 className="font-bold text-black text-end">{t(items.name)}</h1>
          </motion.div>
        ))}
      </motion.div>

      {/* First Pie Chart - Only show if there's data */}
      {total > 0 && (
        <div className="relative flex items-center justify-center w-full my-4">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={filteredSanabelType}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={0}
                label={({ name, value }) =>
                  `${((value / total) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {filteredSanabelType.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <img
            src={missionsDoneImg}
            alt=""
            className="absolute w-1/4 transform -translate-x-1/2 pointer-events-none top-1/2 left-2/4 -translate-y-3/4"
          />
        </div>
      )}

      {/* Show message when no data */}
      {total === 0 && (
        <div className="flex items-center justify-center w-full h-64 text-gray-500">
          <p>{t("لا توجد بيانات لعرضها")}</p>
        </div>
      )}

      <div className="w-full bg-[#495638] flex-center justify-between items-center p-2 gap-2 rounded-xl text-md">
        <img src={blueSanabel} className="h-6" alt="" />
        <h1>x{sanabelColor[0].value}</h1>
        <img src={yellowSanabel} className="h-6" alt="" />
        <h1>x{sanabelColor[1].value}</h1>
        <img src={redSanabel} className="h-6" alt="" />
        <h1>x{sanabelColor[2].value}</h1>
        <h1 className="font-bold text-white text-md" dir="ltr">
          {t("إجمالي السنابل")}
        </h1>
        <img src={mixedSanabel} alt="" className="w-8" />
      </div>

      {/* Second Pie Chart - Only show if there's data */}
      {totalSanabel > 0 && (
        <div className="relative flex items-center justify-center w-full">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={filteredSanabelColor}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={0}
                label={({ value }) =>
                  `${((value / totalSanabel) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {filteredSanabelColor.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={sanabelCOLORS[index % sanabelCOLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <img
            src={mixedSanabel}
            alt=""
            className="absolute w-1/4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
          />
        </div>
      )}
    </div>
  );
};

export default ProgressMissions;
