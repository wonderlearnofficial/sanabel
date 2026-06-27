import { useHistory } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react";
import i18n from "../../i18n";

import nonotification from "../../assets/nonotification.png";
// overview icons

import GoBackButton from "../../components/GoBackButton";

const Profile: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const notificationsData = [
    { title: "قائمة المتصدرين", content: "s" },
    { title: "تحديات", content: "s" },
    { title: "مجموع الحسنات", content: "s" },
    { title: "مستوي الشارة", content: "s" },
  ];

  return (
    <div
      className="flex flex-col items-center justify-between w-full h-full p-4 overflow-y-auto"
      id="page-height"
    >
      <div className="flex items-center justify-between w-full">
        <div className="opacity-0 w-[25px] " />
        <h1 className="self-center text-2xl font-bold text-black" dir="ltr">
          {t("الأشعارات")}
        </h1>
        <GoBackButton />
      </div>

      <div className="flex-col self-center w-full gap-3 flex-center">
        <img src={nonotification} alt="notifcation-bell" className="w-4/5" />
        <h1 className="-mt-6 text-2xl text-black">{t("لا يوجد إشعارات!")}</h1>
        <h1 className="text-[#999] text-xl">
          {t("لم تتلقي اي إشعار حتي الأن")}
        </h1>
      </div>

      <div className="h-24" />

      <div className="flex items-center justify-between w-full ">
        <h1 className="text-[#999] w-max">منذ دقيقة</h1>
        <h1 className="w-3/5 text-black text-md text-end">
          محمد منجي يدعوك للانضمام لمتابعة واحرز تقدمك في الحسنات{" "}
        </h1>
        <div className="w-12 h-12 rounded-full bg-blueprimary"></div>
      </div>
    </div>
  );
};

export default Profile;
