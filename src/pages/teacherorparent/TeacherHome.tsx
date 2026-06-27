import { useTheme } from "../../context/ThemeContext";
import Notification from "../../components/Notification";
import Navbar from "../../components/navbar/TeacherNavbar";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { IoMdSettings, IoMdMail } from "react-icons/io";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaTrophy,
  FaUserFriends,
  FaUserPlus,
  FaStar,
  FaChartLine,
  FaTasks, // Added for missions icon
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

const TeacherHome = () => {
  const history = useHistory();
  const { t } = useTranslation();

  // State to store the actual counts
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalMissions: 0, // Added missions count
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchStudentsData();
    fetchClassesData();
    fetchMissionsCount(); // Added missions fetch
  }, []);

  const fetchStudentsData = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      return;
    }
    try {
      const response = await fetch(
        `https://sanabel.wonderlearn.net/teachers/appear-student`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Students data:", data.data);

        // Update the students count
        setStats((prevStats) => ({
          ...prevStats,
          totalStudents: data.data ? data.data.length : 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchClassesData = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      return;
    }
    try {
      const response = await fetch(
        `https://sanabel.wonderlearn.net/teachers/appear-class`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (response.ok) {
        const data = await response.json();

        // Update the classes count
        setStats((prevStats) => ({
          ...prevStats,
          totalClasses: data.data ? data.data.length : 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // New function to fetch missions count
  const fetchMissionsCount = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      return;
    }

    try {
      // First, get all categories
      const categoriesResponse = await axios.get(
        "https://sanabel.wonderlearn.net/teachers/tasks-category",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (categoriesResponse.status === 200) {
        const categories = categoriesResponse.data.data;
        let totalMissions = 0;

        // For each category, get all sanabel types and their missions
        for (let i = 0; i < categories.length; i++) {
          const categoryId = i + 1; // API uses 1-based indexing

          try {
            // Get sanabel types for this category
            const typesResponse = await axios.get(
              `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type/${categoryId}`,
              {
                headers: { Authorization: `Bearer ${authToken}` },
              },
            );

            if (typesResponse.status === 200) {
              const data = typesResponse.data.data;

              // Extract unique types
              const uniqueTypes: string[] = [];
              data.forEach((task: { type: string }) => {
                if (!uniqueTypes.includes(task.type)) {
                  uniqueTypes.push(task.type);
                }
              });

              // For each unique type, get missions count
              for (const type of uniqueTypes) {
                try {
                  const missionsResponse = await axios.get(
                    `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type-Category/${categoryId}/${type}`,
                    {
                      headers: { Authorization: `Bearer ${authToken}` },
                    },
                  );

                  if (missionsResponse.status === 200) {
                    const missions = missionsResponse.data.data;
                    if (Array.isArray(missions)) {
                      totalMissions += missions.length;
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error fetching missions for category ${categoryId}, type ${type}:`,
                    error,
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `Error fetching types for category ${categoryId}:`,
              error,
            );
          }
        }

        // Update the missions count
        setStats((prevStats) => ({
          ...prevStats,
          totalMissions: totalMissions,
        }));

        console.log("Total missions count:", totalMissions);
      }
    } catch (error) {
      console.error("Error fetching missions count:", error);
    }
  };

  const teacherHomeButtons = [
    {
      title: "تسجيل الفصول",
      description: "سجل إنجازات وتابع تقدم الطلاب في فصلك الدراسي",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      icon: <FaChalkboardTeacher className="text-blue-600" size={28} />,
      onclick: () => history.push("/teacher/classlist"),
    },
    {
      title: "تسجيل الطلاب",
      description: "سجل إنجازات الطلاب الفردية وتقدمهم",
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      icon: <FaUserGraduate className="text-green-600" size={28} />,
      onclick: () => history.push("/teacher/studentslist"),
    },
    // {
    //   title: "دعوة الطلاب",
    //   description: "أرسل دعوات للطلاب للانضمام إلى فصولك",
    //   bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
    //   hoverColor: "hover:from-purple-600 hover:to-purple-700",
    //   icon: <FaUserPlus className="text-purple-600" size={28} />,
    //   onclick: () => history.push("/teacher/invite-students"),
    // },
    {
      title: "عرض الطلاب والفصول",
      description: "تصفح وأدر طلابك وفصولك",
      bgColor: "bg-gradient-to-br from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
      icon: <FaUserFriends className="text-red-600" size={28} />,
      onclick: () => history.push("/teacher/view"),
    },
    {
      title: "عرض التحديات",
      description: "استكشف التحديات والأنشطة المتاحة",
      bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      hoverColor: "hover:from-yellow-600 hover:to-yellow-700",
      icon: <FaTrophy className="text-yellow-600" size={28} />,
      onclick: () => history.push("/teacher/challenges"),
    },
    {
      title: "الإعدادات",
      description: "إدارة إعدادات حسابك",
      bgColor: "bg-gradient-to-br from-gray-700 to-gray-800",
      hoverColor: "hover:from-gray-800 hover:to-gray-900",
      icon: <IoMdSettings className="text-gray-700" size={28} />,
      onclick: () => history.push("/teacher/profile"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full gap-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Section */}
      <motion.div
        className="relative flex flex-col items-center justify-between w-full p-5 overflow-hidden text-white bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-32 h-32 bg-white rounded-full top-4 right-4"></div>
          <div className="absolute w-24 h-24 bg-white rounded-full bottom-4 left-4"></div>
          <div className="absolute w-40 h-40 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full top-1/2 left-1/2"></div>
        </div>

        <div className="relative z-10 text-center">
          <motion.h1
            className="mb-2 text-3xl font-extrabold"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {t("مرحباً أستاذ")}
          </motion.h1>
          <motion.p
            className="text-lg text-blue-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {t("إدارة فصولك وطلابك بسهولة")}
          </motion.p>
        </div>

        {/* Quick Stats - Updated to 4 columns */}
        <motion.div
          className="relative z-10 grid w-full max-w-4xl grid-cols-3 gap-1 mt-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="p-3 text-center rounded-lg bg-white/20 backdrop-blur-sm"
          >
            <FaUserGraduate className="mx-auto mb-1 text-white" size={20} />
            <div className="text-xl font-bold text-white">
              {stats.totalStudents}
            </div>
            <div className="text-xs text-blue-100">{t("طالب")}</div>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="p-3 text-center rounded-lg bg-white/20 backdrop-blur-sm"
          >
            <FaChalkboardTeacher
              className="mx-auto mb-1 text-white"
              size={20}
            />
            <div className="text-xl font-bold text-white">
              {stats.totalClasses}
            </div>
            <div className="text-xs text-blue-100">{t("فصل")}</div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-3 text-center rounded-lg bg-white/20 backdrop-blur-sm"
          >
            <FaTrophy className="mx-auto mb-1 text-white" size={20} />
            <div className="text-xl font-bold text-white">
              {stats.totalMissions}
            </div>
            <div className="text-xs text-blue-100">{t("تحديات")}</div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="grid w-full grid-cols-2 gap-2 px-4 "
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {teacherHomeButtons.map((button, index) => (
          <motion.div
            className={`group flex-center flex-col gap-4 ${"h-40"} ${
              button.bgColor
            } ${button.hoverColor} 
            rounded-2xl shadow-lg transform transition-all duration-300 
            hover:shadow-2xl cursor-pointer relative overflow-hidden`}
            key={index}
            onClick={button.onclick}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute w-16 h-16 bg-white rounded-full -top-4 -right-4"></div>
              <div className="absolute w-12 h-12 bg-white rounded-full -bottom-4 -left-4"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                className="flex items-center justify-center flex-shrink-0 w-16 h-16 transition-shadow duration-300 bg-white rounded-full shadow-lg group-hover:shadow-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {button.icon}
              </motion.div>
              <h2 className="px-2 text-lg font-bold text-center text-white">
                {t(button.title)}
              </h2>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 transition-transform duration-1000 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>
          </motion.div>
        ))}
      </motion.div>

      <Navbar />
    </div>
  );
};

export default TeacherHome;
