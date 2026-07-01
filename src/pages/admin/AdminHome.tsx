import React from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import AdminNavbar from "../../components/navbar/AdminNavbar";
import ApplyClass from "../../icons/TeacherHome/ApplyClass";
import ApplyStudents from "../../icons/TeacherHome/ApplyStudents";
import { FaDatabase } from "react-icons/fa";
import { useUserContext } from "../../context/StudentUserProvider";

const AdminHome: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { user } = useUserContext();

  const cards = [
    {
      title: "المدارس والمؤسسات",
      description: "إنشاء وتعديل وحذف المدارس والمؤسسات",
      icon: <ApplyClass size={36} />,
      to: "/admin/organizations",
    },
    {
      title: "الطلاب",
      description: "البحث في كل الطلاب وتعديل بياناتهم",
      icon: <ApplyStudents size={36} />,
      to: "/admin/students",
    },
    {
      title: "بيانات المستخدمين",
      description: "عرض كل المستخدمين (طلاب، معلمون، أولياء أمور، مشرفون) وإعادة تعيين كلمات المرور",
      icon: <FaDatabase size={30} />,
      to: "/admin/userdata",
      // rendered outside the router (like /simulation), so it needs a full navigation, not client-side routing
      external: true,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-full gap-1 pb-24 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <motion.div
        className="relative flex flex-col items-center justify-between w-full p-5 text-white bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="mb-1 text-2xl font-extrabold">
          {t("مرحباً")} {user?.firstName}
        </h1>
        <p className="text-blue-100">{t("لوحة تحكم المشرف")}</p>
      </motion.div>

      <div className="flex flex-col w-full gap-4 p-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              card.external ? (window.location.href = card.to) : history.push(card.to)
            }
            className="flex items-center w-full gap-4 p-4 bg-white shadow-md cursor-pointer rounded-2xl"
          >
            <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-xl">
              {card.icon}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-black">{t(card.title)}</h2>
              <p className="text-sm text-gray-500">{t(card.description)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AdminNavbar />
    </div>
  );
};

export default AdminHome;
