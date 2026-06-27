import StudentNavbar from "../../../components/navbar/StudentNavbar";

import { useHistory } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react";
import i18n from "../../../i18n";
import { IonRouterLink } from "@ionic/react";
import { useTheme } from "../../../context/ThemeContext";

import { IoMdSettings } from "react-icons/io";

// overview icons
import MissionIcon from "../../../icons/navbar/LeaderboardsIcon";
import LeaderboardIcon from "../../../icons/navbar/LeaderboardsIcon";

import BadgeIcon from "../../../icons/navbar/LeaderboardsIcon";
import { FiTarget } from "react-icons/fi";

import { medalsImgs } from "../../../data/Medals";

import { useUserContext } from "../../../context/UserProvider";
import GoBackButton from "../../../components/GoBackButton";

const Profile: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const history = useHistory();
  const { t } = useTranslation();

  const [show, setShow] = useState("overview");

  const { user } = useUserContext();
  const overviewData = [
    { title: "قائمة المتصدرين", content: "s", icon: LeaderboardIcon },
    { title: "تحديات", content: "s", icon: LeaderboardIcon },
    { title: "مجموع الحسنات", content: "s", icon: LeaderboardIcon },
    { title: "مستوي الشارة", content: "s", icon: LeaderboardIcon },
  ];

  return (
    <div className="z-10 flex flex-col items-center justify-between w-full h-full overflow-y-auto">
      {/* <div className="absolute z-0 w-screen h-24 bg-yellowprimary t-0"></div> */}

      <div className="flex  items-center justify-between bg-yellowprimary py-10 w-screen  p-4 rounded-b-[50px] ">
        <div className="opacity-0 w-[25px] h-25" />
        <h1 className="text-2xl font-bold text-white">{t("الملف الشخصي")}</h1>
        <div className="bg-white  rounded-xl">
          <GoBackButton />
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-1">
        <div className="w-32 h-32 -mt-6 border-8 border-white rounded-full bg-redprimary"></div>
        <h1 className="text-black">
          {user?.firstName} {user?.lastName}
        </h1>
        <h1 className="text-[#B3B3B3]"> طالب</h1>
        <h1 className="text-[#B3B3B3]"> المرحلة الاعدادية - فصل 4/8</h1>
      </div>

      <div className="flex flex-col items-center w-full gap-1">
        <div className="flex flex-row-reverse justify-between w-full gap-3 p-4">
          <div
            className={`${
              show === "overview"
                ? "bg-blueprimary text-white"
                : "bg-[#E6E6E6] text-[#999]"
            }  px-4 py-2 rounded-2xl  w-full text-center`}
            onClick={() => setShow("overview")}
          >
            {t("نظرة عامة")}
          </div>
          <div
            className={` ${
              show === "achievements"
                ? "bg-blueprimary text-white"
                : "bg-[#E6E6E6] text-[#999]"
            } px-4 py-2 rounded-2xl  w-full text-center`}
            onClick={() => setShow("achievements")}
          >
            <h1>{t("الإنجازات")}</h1>
          </div>
          <div
            className={` ${
              show === "trophies"
                ? "bg-blueprimary text-white"
                : "bg-[#E6E6E6] text-[#999]"
            } px-4 py-2 rounded-2xl  w-full text-center`}
            onClick={() => setShow("trophies")}
          >
            <h1>{t("الجوائز")}</h1>
          </div>
        </div>

        {show == "overview" && (
          <div className="grid w-full grid-cols-2 gap-3 p-4">
            {/* Challenges */}
            <div className="flex items-center justify-end gap-3 p-2 sanabel-shadow-bottom rounded-2xl">
              <div className="flex-col">
                <h1 className="font-bold text-redprimary text-end">500</h1>
                <h1 className="font-bold text-redprimary">{t("تحديات")}</h1>
              </div>
              <div className="w-10 h-10 p-2 rounded-full bg-redprimary flex-center">
                <FiTarget className="text-3xl text-white " />
              </div>
            </div>
            {/* Leaderboards */}
            <div className="flex items-center justify-end gap-3 p-2 sanabel-shadow-bottom rounded-2xl">
              <div className="flex-col">
                <h1 className="font-bold text-greenprimary text-end">
                  # <span>2</span>
                </h1>
                <h1 className="font-bold text-greenprimary">
                  {t("قائمة المتصدرين")}
                </h1>
              </div>
              <div className="w-10 h-10 p-2 rounded-full bg-greenprimary flex-center">
                <LeaderboardIcon className="text-white " />
              </div>
            </div>

            {/* Medals */}
            <div className="flex items-center justify-end sanabel-shadow-bottom rounded-2xl ">
              <h1 className="font-bold text-greenprimary">
                {t("مستوي الشارة")}
              </h1>

              <div className="p-2rounded-full flex-center">
                <img
                  src={medalsImgs[4]}
                  className="text-3xl w-14 h-14"
                  alt=""
                />
              </div>
            </div>
            {/* Total Points */}
            <div className="flex items-center justify-end gap-3 p-2 sanabel-shadow-bottom rounded-2xl">
              <h1 className="text-black">average medals</h1>
            </div>
          </div>
        )}
      </div>

      {/* <div className="flex-col w-full p-4 flex-center">
        <h1 className="self-end text-xl font-bold text-black text-end">
          {t("النشاط")}
        </h1>
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between w-full ">
            <h1 className="text-[#999] ">منذ دقيقة</h1>
            <h1 className="text-black">لقد قمت اكمال تحدي التعاون اليوم</h1>
            <img src={activityDoneImg} alt="" />
          </div>
          <div className="flex items-center justify-between w-full ">
            <h1 className="text-[#999] ">منذ دقيقة</h1>
            <h1 className="text-black">لقد قمت اكمال تحدي التعاون اليوم</h1>
            <img src={activityDoneImg} alt="" />
          </div>
          <div className="flex items-center justify-between w-full ">
            <h1 className="text-[#999] ">منذ دقيقة</h1>
            <h1 className="text-black">لقد قمت اكمال تحدي التعاون اليوم</h1>
            <img src={activityDoneImg} alt="" />
          </div>
          <div className="flex items-center justify-between w-full ">
            <h1 className="text-[#999] ">منذ دقيقة</h1>
            <h1 className="text-black">لقد قمت اكمال تحدي التعاون اليوم</h1>
            <img src={activityDoneImg} alt="" />
          </div>
          <div className="flex items-center justify-between w-full ">
            <h1 className="text-[#999] ">منذ دقيقة</h1>
            <h1 className="text-black">لقد قمت اكمال تحدي التعاون اليوم</h1>
            <img src={activityDoneImg} alt="" />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Profile;
