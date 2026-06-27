import StudentNavbar from "../../../components/navbar/StudentNavbar";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { IonRouterLink } from "@ionic/react";
import { useTheme } from "../../../context/ThemeContext";
import DeleteAccountPopup from "./StudentDeleteAccountPopup";
import { IoMdSettings } from "react-icons/io";
import edit from "../../../icons/edit.svg";
// overview icons

import LeaderboardIcon from "../../../icons/navbar/LeaderboardsIcon";
import activityDoneImg from "../../../assets/profile/Medallions.png";
import { useUserContext } from "../../../context/UserProvider";

// Navbar
import StudentProfileOverview from "../profile/StudentProfileOverview";
import StudentProfileTree from "./StudentProfileTree";
import StudentProfileTrophies from "./StudentProfileTrophies";
import StudentProfileActivity from "./StudentProfileActivity";

const Profile: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const { user } = useUserContext();

  const profileNav = ["نظرة عامة", "الشجرة", "الجوائز", "النشاط"];
  const [show, setShow] = useState(profileNav[0]);
  return (
    <div
      className="z-10 flex flex-col items-center justify-between w-full h-full overflow-y-auto"
      id="page-height"
    >
      {/* <div className="absolute z-0 w-screen h-24 bg-yellowprimary t-0"></div> */}

      <div className="flex items-center justify-between bg-yellowprimary py-10 w-full  p-4 rounded-b-[50px] ">
        {/* Settings Button */}
        <div className="flex gap-2">
          <div
            className="flex-center gap-3 p-2 bg-[#E6E6E6] rounded-2xl"
            onClick={() => history.push("/student/settings")}
          >
            <IoMdSettings className="w-5 h-5 text-blueprimary" />
          </div>
          <IonRouterLink routerLink="/student/profile/edit">
            <div className="flex items-center gap-3 p-2 bg-[#E6E6E6] rounded-2xl">
              <img src={edit} alt="edit" className="w-6 h-6" />
              <h1 className="text-[#999]">{t("تعديل")}</h1>
            </div>
          </IonRouterLink>
        </div>
        {/* Settings Button */}
        <h1 className="text-2xl font-bold text-black">{t("الملف الشخصي")}</h1>
      </div>

      <div className="flex flex-col items-center justify-between gap-1">
        <div className="w-32 h-32 -mt-6 border-8 border-white rounded-full bg-redprimary"></div>
        <h1 className="text-black">
          {user?.firstName} {user?.lastName}
        </h1>
        <h1 className="text-[#B3B3B3]"> {t("طالب")}</h1>
        <h1 className="text-[#B3B3B3]"> المرحلة الاعدادية - فصل 4/8</h1>
      </div>

      {/* Navbar */}
      <div className="flex flex-col justify-between w-full gap-3 p-4">
        <div className="flex flex-row-reverse items-center w-full gap-1">
          {profileNav.map((item) => (
            <div
              className={`${
                show === item
                  ? "bg-blueprimary text-white"
                  : "bg-[#E6E6E6] text-[#999]"
              }  p-2 rounded-3xl text-sm  w-full text-center`}
              onClick={() => setShow(item)}
            >
              {t(item)}
            </div>
          ))}
        </div>
      </div>

      {show == profileNav[0] && <StudentProfileOverview />}

      {show == profileNav[1] && <StudentProfileTree />}
      {show == profileNav[2] && <StudentProfileTrophies />}

      {show == profileNav[3] && <StudentProfileActivity />}

      <StudentNavbar />
    </div>
  );
};

export default Profile;
