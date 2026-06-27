import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import { delay, motion } from "framer-motion";

import { useHistory } from "react-router-dom";
import StudentNavbar from "../../../components/navbar/StudentNavbar";
import SanabelArrow from "../../../icons/SanabelArrow";

import reminderImg from "../../../assets/توصيات عامة.svg";
import { FaCircleQuestion } from "react-icons/fa6";

import sanabelType from "../../../data/SanabelTypeData";
import axios from "axios";

// Sanabel Types
import sanabelType1Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png";
import sanabelType2Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png";
import sanabelType3Img from "../../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png";
import sanabelType4Img from "../../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png";

// Sanabel
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import ParentNavbar from "../../../components/navbar/ParentNavbar";

const SanabelType: React.FC = () => {
  const [categories, setCategories] = useState([]);

  const sanabelTypeImg = [
    sanabelType1Img,
    sanabelType2Img,
    sanabelType3Img,
    sanabelType4Img,
  ];

  const resourcesImgs = [blueSanabel, redSanabel, yellowSanabel, xpIcon];

  const fetchUserData = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    const role = localStorage.getItem("role");
    try {
      const response = await axios.get(
        role == "Teacher"
          ? "https://sanabel.wonderlearn.net/teachers/tasks-category"
          : "https://sanabel.wonderlearn.net/parents/tasks-category",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        setCategories(response.data.data); // Store the data array in state
        console.log(response.data.data); // Log the data array
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const { t, i18n } = useTranslation();
  const history = useHistory();
  const currentLanguage = i18n.language;

  const [reminderPopup, setReminderPopup] = useState(
    localStorage.getItem("sanabelReminder") === null,
  );

  const handleStartClick = () => {
    setReminderPopup(false);
    localStorage.setItem("sanabelReminder", "false");
  };

  const reminderData = [
    "️اختر عددًا من التحديات اليومية والأسبوعية بحسب وقتك وظروفك",
    "اجعل الهدف الرئيسي هو الإحسان في كل عمل تقوم به لتترك أثرًا إيجابيًا في نفسك ومحيطك",
    "الحرص على التوازن بين العلاقات وعدم إهمال أي جانب",
    "التدرج في الأهداف وتجنب إرهاق النفس في بداية التحدي",
  ];

  const popupVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.5,
      },
    },
    exit: { y: "100%", opacity: 0, transition: { duration: 0.5 } },
  };

  const listItemVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: (index: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: index * 0.2, duration: 0.5 },
    }),
  };

  // Get user role from localStorage
  const userRole = localStorage.getItem("role");

  return (
    <motion.div
      className="flex flex-col items-center justify-between w-full h-full p-4 px-3 overflow-y-auto "
      id="page-height"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Popup */}
      {reminderPopup && (
        <motion.div
          className="flex-col flex  overflow-y-auto items-center justify-between w-full h-[86vh] absolute bottom-0 rounded-t-3xl border-t-2  bg-white z-30 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupVariants}
        >
          {/* Image */}
          <motion.img
            src={reminderImg}
            loading="lazy"
            alt="Reminder"
            style={{ width: "170px" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.5,
            }}
          />
          {/* Title */}
          <motion.h1
            className="text-2xl font-bold text-black"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {t("توصيات عامة")}
          </motion.h1>
          {/* List Items */}
          <div className="flex flex-col items-end gap-2">
            {reminderData.map((item, index) => (
              <motion.div
                key={index}
                className="flex gap-2"
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
              >
                <p className="text-end text-[#333]">{t(item)}</p>
                <p>⭐</p>
              </motion.div>
            ))}
          </div>

          {/* Button */}
          <motion.div
            className="w-full p-3 text-white bg-blueprimary rounded-2xl flex-center"
            onClick={handleStartClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {t("أبدا")}
          </motion.div>
        </motion.div>
      )}
      {/* Popup */}

      <div className="flex flex-row-reverse items-center justify-between w-full mb-4 overflow-y-auto">
        <motion.div
          className="font-bold text-black "
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          onClick={() => setReminderPopup(!reminderPopup)}
        >
          <FaCircleQuestion className="text-[#333] text-3xl" />
        </motion.div>

        <div className="flex flex-col items-start justify-center w-full gap-2">
          <motion.h1
            className="text-2xl font-bold text-black "
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            {t("سنابل الإحسان")}
          </motion.h1>

          <motion.p
            className="text-[#B3B3B3] text-sm "
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {t("اختر سنبلة من سنابل الاحسان")}
          </motion.p>
        </div>
      </div>
      <motion.div
        className="flex flex-col items-center justify-center w-full h-full gap-4 overflow-y-auto"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.3,
            },
          },
        }}
      >
        {categories.map((items: any, index) => {
          const colors = [
            "text-blueprimary",
            "text-redprimary",
            "text-yellowprimary",
            "text-greenprimary",
          ];

          const colorClass = colors[index % colors.length];

          // Define border color class explicitly
          const borderTopClass =
            colorClass === "text-redprimary"
              ? "border-t-redprimary"
              : colorClass === "text-blueprimary"
              ? "border-t-blueprimary"
              : colorClass === "text-yellowprimary"
              ? "border-t-yellowprimary"
              : "border-t-greenprimary";

          // Define background color class explicitly
          const backgroundClass =
            colorClass === "text-redprimary"
              ? "bg-redprimary"
              : colorClass === "text-blueprimary"
              ? "bg-blueprimary"
              : colorClass === "text-yellowprimary"
              ? "bg-yellowprimary"
              : "bg-greenprimary";

          // Map the resources
          const resources = [
            { icon: blueSanabel, value: items.snabelBlue },
            { icon: redSanabel, value: items.snabelRed },
            { icon: yellowSanabel, value: items.snabelYellow },
            { icon: xpIcon, value: items.xp },
          ];

          return (
            <motion.div
              key={index}
              className={`w-full ${borderTopClass} border-t-2 sanabel-shadow-bottom rounded-3xl flex flex-col p-4 px-3`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              onClick={() => history.push(`/teacher/sanabel/${index}`)}
            >
              <div className="flex flex-row-reverse items-center justify-between w-full">
                <div className="flex gap-2">
                  {resources.map((resource, resourceIndex) => (
                    <div
                      key={resourceIndex}
                      className="flex flex-col items-center"
                    >
                      <img
                        src={resource.icon}
                        alt="icon"
                        className="w-auto h-6"
                        loading="lazy"
                      />
                      <h1 className="text-sm text-black">{resource.value}</h1>
                    </div>
                  ))}
                </div>
                <img
                  src={sanabelTypeImg[index]}
                  alt=""
                  className="w-1/4 h-auto"
                  loading="lazy"
                />
              </div>

              <div className="flex-row-reverse gap-2 flex-center">
                <SanabelArrow
                  className={`${colorClass} ${
                    currentLanguage == "en" && "rotate-180"
                  }`}
                />
                <h1 className={`${colorClass} text-start text-sm font-bold`}>
                  {t(items.title)}
                </h1>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {userRole == "Student" ? (
        <StudentNavbar />
      ) : userRole == "Teacher" ? (
        <TeacherNavbar />
      ) : (
        <ParentNavbar />
      )}
    </motion.div>
  );
};

export default SanabelType;
