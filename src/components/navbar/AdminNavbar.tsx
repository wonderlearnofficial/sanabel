import React from "react";
import { IonRouterLink } from "@ionic/react";
import HomeIcon from "../../icons/navbar/HomeIcon";
import ApplyClass from "../../icons/TeacherHome/ApplyClass";
import ApplyStudents from "../../icons/TeacherHome/ApplyStudents";
import { IoIosSettings } from "react-icons/io";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useLocation } from "react-router-dom";

const navList = [
  { title: "الرئيسية", icon: <HomeIcon size={30} />, to: "/admin/home" },
  {
    title: "المدارس",
    icon: <ApplyClass size={30} />,
    to: "/admin/organizations",
  },
  {
    title: "الطلاب",
    icon: <ApplyStudents size={30} />,
    to: "/admin/students",
  },
  {
    title: "الاعدادات",
    icon: <IoIosSettings size={30} />,
    to: "/admin/profile",
  },
];

function AdminNavbar() {
  const { t } = useTranslation();
  const currentLanguage = i18n.language;
  const location = useLocation();

  return (
    <div
      className={`flex h-20 bg-white dark:bg-[#121212] absolute bottom-0 ${
        currentLanguage === "ar" ? "flex-row-reverse" : "flex-row"
      } justify-around w-full p-3`}
      dir="ltr"
    >
      {navList.map((item, key) => (
        <IonRouterLink key={key} routerLink={item.to}>
          <div className="flex flex-col items-center gap-1 ">
            <div
              className={` flex items-center justify-end ${
                location.pathname === item.to
                  ? "text-blueprimary"
                  : "text-[#666] dark:text-[#cccccc]"
              }`}
            >
              {item.icon}
            </div>
            <h1
              className={`text-md  ${
                location.pathname === item.to
                  ? "text-blueprimary"
                  : "text-[#666] dark:text-[#cccccc]"
              }`}
            >
              {t(item.title)}
            </h1>
          </div>
        </IonRouterLink>
      ))}
    </div>
  );
}

export default AdminNavbar;
