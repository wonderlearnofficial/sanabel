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
} from "react-icons/fa";
import { motion } from "framer-motion";

import ParentNavbar from "../../components/navbar/ParentNavbar";

const ParentHome = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const parentHomeButtons = [
    {
      title: "تسجيل الابناء",
      description: "سجل إنجازات الطلاب الفردية وتقدمهم",
      bgColor: "bg-gradient-to-br from-greenprimary to-greenprimary",
      hoverColor: "hover:from-greenprimary hover:to-greenprimary/60",
      icon: <FaUserGraduate className="text-greenprimary" size={28} />,
      onclick: () => history.push("/teacher/studentslist"),
    },
    {
      title: "دعوة الابناء",
      description: "أرسل دعوات للطلاب للانضمام إلى فصولك",
      bgColor: "bg-gradient-to-br from-blueprimary to-blueprimary",
      hoverColor: "hover:from-blueprimary hover:to-blueprimary/60",
      icon: <FaUserPlus className="text-blueprimary" size={28} />,
      onclick: () => history.push("/parent/invite"),
    },
    {
      title: "عرض الابناء",
      description: "تصفح وأدر طلابك وفصولك",
      bgColor: "bg-gradient-to-br from-redprimary to-redprimary",
      hoverColor: "hover:from-redprimary hover:to-redprimary/60",
      icon: <FaUserFriends className="text-redprimary" size={28} />,
      onclick: () => history.push("/parent/view"),
    },
    {
      title: "عرض التحديات",
      description: "استكشف التحديات والأنشطة المتاحة",
      bgColor: "bg-gradient-to-br from-yellowprimary to-yellowprimary",
      hoverColor: "hover:from-yellowprimary hover:to-yellowprimary/60",
      icon: <FaTrophy className="text-yellowprimary" size={28} />,
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
    <div className="flex flex-col items-center justify-start min-h-full gap-1 py-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Main Content */}
      <motion.div
        className="grid w-full grid-cols-1 gap-2 px-4 "
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {parentHomeButtons.map((button, index) => (
          <motion.div
            className={` flex-center flex-col gap-4 h-32 ${button.bgColor} ${button.hoverColor} 
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

      <ParentNavbar />
    </div>
  );
};

export default ParentHome;
