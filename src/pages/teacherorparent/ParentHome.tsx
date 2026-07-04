import { API_BASE_URL } from "../../config/api";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import { IoMdSettings } from "react-icons/io";
import {
  FaUserGraduate,
  FaTrophy,
  FaUserFriends,
  FaUserPlus,
} from "react-icons/fa";
import { motion } from "framer-motion";

import ParentNavbar from "../../components/navbar/ParentNavbar";
import Notification from "../../components/Notification";
import { useAutoStartGuide } from "../../guides/useAutoStartGuide";

type LinkedChildrenStatus = "checking" | "empty" | "ready";

const ParentHome = () => {
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const pageDir = i18n.language === "ar" ? "rtl" : "ltr";
  const [linkedChildrenStatus, setLinkedChildrenStatus] =
    useState<LinkedChildrenStatus>("checking");
  useAutoStartGuide("parent-home", linkedChildrenStatus === "ready");

  useEffect(() => {
    let isMounted = true;

    const fetchLinkedChildren = async () => {
      const authToken = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 6000);

      if (!authToken) {
        window.clearTimeout(timeoutId);
        setLinkedChildrenStatus("empty");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/parents/appear-student-by-parent`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: controller.signal,
          },
        );

        if (!isMounted) return;

        if (!response.ok) {
          setLinkedChildrenStatus("ready");
          return;
        }

        const data = await response.json();
        const linkedChildren = Array.isArray(data.data)
          ? data.data
          : data.data
            ? [data.data]
            : [];

        setLinkedChildrenStatus(
          linkedChildren.length > 0 ? "ready" : "empty",
        );
      } catch (error) {
        console.error("Error fetching linked children:", error);
        if (isMounted) {
          setLinkedChildrenStatus("empty");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    fetchLinkedChildren();

    return () => {
      isMounted = false;
    };
  }, []);

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
      guideId: "link-child",
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
    <div
      className="box-border flex flex-col items-center justify-start w-full h-full gap-1 px-4 py-6 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50"
      id="page-height"
      dir={pageDir}
    >
      <div className="flex justify-end w-full">
        <Notification />
      </div>

      {linkedChildrenStatus === "checking" ? (
        <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg">
            <FaUserPlus className="text-blueprimary" size={28} />
          </div>
          <p className="text-lg font-semibold text-gray-600">
            {t("جاري التحقق من الأبناء المرتبطين...")}
          </p>
        </div>
      ) : linkedChildrenStatus === "empty" ? (
        <div className="flex flex-col items-center w-full gap-4">
          <div
            className="box-border flex flex-col items-center w-full max-w-full gap-4 p-5 text-center bg-white border border-blue-100 shadow-lg rounded-2xl"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-50">
              <FaUserPlus className="text-blueprimary" size={34} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("ابدأ بدعوة طفلك")}
              </h1>
              <p className="text-sm leading-6 text-gray-600">
                {t(
                  "للوصول إلى التسجيل والمتابعة والتحديات، اربط حساب طفلك أولاً باستخدام كود الدعوة الخاص به.",
                )}
              </p>
            </div>
          </div>

          <div
            className="box-border w-full max-w-full p-4 border border-blue-100 shadow-sm rounded-2xl bg-blue-50"
          >
            <h2 className="mb-3 text-lg font-bold text-blue-900">
              {t("كيف يحصل الطفل على الكود؟")}
            </h2>
            <div className="space-y-3 text-sm leading-6 text-blue-800">
              <p>
                {t(
                  "يدخل الطفل إلى حسابه ثم يفتح الملف الشخصي وينسخ كود الربط الظاهر في معلومات الحساب.",
                )}
              </p>
              <p>
                {t("بعد الربط ستظهر لك أدوات المتابعة والتسجيل هنا.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="box-border flex items-center justify-center w-full max-w-full gap-3 p-4 font-bold text-white shadow-lg bg-gradient-to-r from-blueprimary to-indigo-400 rounded-2xl"
            onClick={() => history.push("/parent/invite")}
          >
            <FaUserPlus size={20} />
            {t("دعوة طفل الآن")}
          </button>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <motion.div
            className="grid w-full grid-cols-1 gap-2"
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
                data-guide-id={(button as any).guideId}
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
        </>
      )}
    </div>
  );
};

export default ParentHome;
