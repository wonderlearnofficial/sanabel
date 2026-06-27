import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import { delay, motion } from "framer-motion";

import { useHistory, useParams } from "react-router-dom";

import sanabelTypeData from "../../../data/SanabelTypeData";
import GoBackButton from "../../../components/GoBackButton";

import axios from "axios";

// Sanabel Types
import sanabelType1Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";
import sanabelType2Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";

import { sanabelImgs } from "../../../data/SanabelImgs";

const SanabelType: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const { index } = useParams<{ index: any }>();

  // Ensure index is properly parsed as a number
  const indexAsNumber = parseInt(index, 10);
  // Make sure APIIndex is correctly calculated as a number
  const APIIndex = indexAsNumber + 1;
  let colors = [];

  colors = [
    "border-t-blueprimary",
    "border-t-redprimary",
    "border-t-yellowprimary",
    "border-t-greenprimary",
  ];

  const colorBG = colors[index % colors.length];

  // Animation variants for stagger effect
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Delay between each child animation
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 }, // Start hidden and slightly below
    visible: { opacity: 1, y: 0 }, // Animate to visible and original position
  };

  const [categoryName, setCategoryName] = useState("");

  const sanabelTypeImg = [
    sanabelType1Img,
    sanabelType2Img,
    sanabelType3Img,
    sanabelType4Img,
  ];

  const role = localStorage.getItem("role");

  const fetchSanabelTypes = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await axios.get(
        role == "Teacher"
          ? "https://sanabel.wonderlearn.net/teachers/tasks-category"
          : "https://sanabel.wonderlearn.net/parents/tasks-category",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
        setCategoryName(response.data.data[index].title);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchSanabelTypes();
  }, []);

  const [tasks, setTasks] = useState<string[]>([]);

  const fetchSanabel = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await axios.get(
        role == "Teacher"
          ? `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type/${APIIndex}`
          : `https://sanabel.wonderlearn.net/parents/appear-Taskes-Type/${APIIndex}`,

        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
        const data = response.data.data;

        // Extract unique 'type' values while maintaining the order
        const uniqueTypes: string[] = [];
        data.forEach((task: { type: string }) => {
          if (!uniqueTypes.includes(task.type)) {
            uniqueTypes.push(task.type);
          }
        });

        setTasks(uniqueTypes); // Set the unique types
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchSanabel();
  }, [categoryName]);

  return (
    <motion.div
      className="flex flex-col items-center w-full h-full p-3 overflow-y-auto"
      initial={{ opacity: 0, y: 50 }} // Start hidden and slightly below
      animate={{ opacity: 1, y: 0 }} // Animate to visible and original position
      exit={{ opacity: 0, y: -50 }} // Exit animation (if applicable)
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className="flex flex-row-reverse items-center justify-between w-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <motion.img
          loading="lazy"
          src={sanabelTypeImg[index]}
          alt=""
          className="h-20"
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        <div className="w-[43px]">
          <GoBackButton />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-black font-bold text-[16px] text-end my-2"
        initial={{ x: 0, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0, ease: "easeOut" }}
      >
        {t(categoryName)}
      </motion.h1>

      {/* Grid with stagger animation */}
      <motion.div
        className="grid content-start w-full h-full grid-cols-2 gap-2 p-2 overflow-y-auto align-top "
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tasks.map((item, idx) => (
          <motion.div
            key={idx}
            className={`w-full ${colorBG} border-t-2 flex-center p-2 py-3 flex-col gap-3
            rounded-lg mt-4 shadow-md h-36`}
            variants={itemVariants}
            custom={idx}
            onClick={() => history.push(`/teacher/sanabel/${index}/${idx}`)}
          >
            <img
              src={sanabelImgs[index][idx]}
              alt=""
              className="w-2/5"
              loading="lazy"
            />
            <h1 className="text-sm font-bold text-center text-black">
              {t(item)}
            </h1>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SanabelType;
