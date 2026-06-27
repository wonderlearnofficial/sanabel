import { useTheme } from "../../../context/ThemeContext";

import Notification from "../../../components/Notification";

import Greeting from "../../../components/Greeting";

import Navbar from "../../../components/navbar/TeacherNavbar";
import { useTranslation } from "react-i18next";

import InviteStudent from "../../../icons/TeacherHome/InviteStudent";
import ApplyClass from "../../../icons/TeacherHome/ApplyClass";
import ApplyTeam from "../../../icons/TeacherHome/ApplyTeam";
import ApplyStudents from "../../../icons/TeacherHome/ApplyStudents";

import { IoCloseCircle } from "react-icons/io5";
import { useState } from "react";
import { useHistory } from "react-router-dom";

const TeacherHome: React.FC = () => {
  const history = useHistory();

  const { t } = useTranslation();
  const [openInvite, setOpenInvite] = useState(false);

  const teacherHomeButtons = [
    {
      title: "دعوة طلاب",
      description: "أرسل دعوات إلى الطلاب للانضمام إلى برنامج الحسنات.",
      bgColor: "bg-[#498200]",
      icon: <InviteStudent />,
      onclick: () => setOpenInvite(true),
    },
    {
      title: "تسجيل حسنات الفصول",
      description: "سجل إنجازات الحسنات التي جمعها الطلاب في فصولهم الدراسية.",
      bgColor: "bg-[#4AAAD6]",
      icon: <ApplyClass />,
      onclick: () => history.push("/teacher/classlist"), // Fixed to correctly invoke the function
    },
    {
      title: "تسجيل حسنات الفرق",
      description: "سجل الحسنات التي جمعها الطلاب عند العمل كفرق.",
      bgColor: "bg-[#E14E54]",
      icon: <ApplyTeam className="text-[#E14E54]" />,
      onclick: () => history.push("/teacher/teamslist"), // Fixed to correctly invoke the function
    },
    {
      title: "تسجيل حسنات للطلاب",
      description: "سجل الحسنات الفردية المكتسبة من قبل كل طالب.",
      bgColor: "bg-[#FAB700]",
      icon: <ApplyStudents />,
      onclick: () => history.push("/teacher/studentslist"), // Fixed to correctly invoke the function
    },
  ];

  return (
    <div
      className="flex flex-col items-center justify-start gap-10 overflow-y-auto"
      id="page-height"
    >
      <div className="flex items-center justify-between w-full p-4">
        <Notification />
        <Greeting name={`مرحباً مريم`} text={"هيا بنا نصنع الخير معًا!"} />
      </div>
      <h1 className="text-2xl text-black">
        {t("ساعد الطلاب في جمع الحسنات ")}
      </h1>

      <div className="flex flex-col w-full gap-3 p-4 h-2/3">
        {teacherHomeButtons.map((button, index) => (
          <div
            className={`${button.bgColor} w-full rounded-3xl flex-center flex-col gap-2 h-full`}
            key={index}
            onClick={button.onclick} // Correctly passing the function
          >
            <div className="p-2 bg-white rounded-full flex-center">
              {button.icon}
            </div>
            <h1 className="text-2xl font-bold text-white">{button.title}</h1>
          </div>
        ))}
      </div>
      <Navbar />

      {openInvite && (
        <div className="absolute flex-col w-screen h-screen flex-center ">
          <div className="w-full bg-black h-1/3 opacity-10"></div>
          <div className="w-full p-4 bg-white h-2/3 flex-center">
            <div
              className="flex items-center justify-between w-full text-redprimary"
              onClick={() => setOpenInvite(false)}
            >
              <IoCloseCircle size={35} />
              <h1 className="text-2xl text-black">{t("دعوة طالب")}</h1>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHome;
