import StudentNavbar from "../../components/navbar/StudentNavbar";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { IonRouterLink } from "@ionic/react";
import { useTheme } from "../../context/ThemeContext";
import DeleteAccountPopup from "./profile/StudentDeleteAccountPopup";
import { IoMdSettings } from "react-icons/io";
import edit from "../../icons/edit.svg";
// overview icons

import LeaderboardIcon from "../../icons/navbar/LeaderboardsIcon";
import activityDoneImg from "../../../assets/profile/Medallions.png";
import { useUserContext } from "../../context/StudentUserProvider";

// Navbar
import StudentProfileOverview from "./profile/StudentProfileOverview";
import StudentProfileTree from "./profile/StudentProfileTree";
import StudentProfileTrophies from "./profile/StudentProfileTrophies";
import StudentProfileActivity from "./profile/StudentProfileActivity";
import { MdContentCopy } from "react-icons/md";
import { avatars } from "../../data/Avatars";
import GetAvatar from "./tutorial/GetAvatar";

const Profile: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const { user } = useUserContext();
  const avatar = user?.profileImg;

  const profileNav = ["نظرة عامة", "الشجرة", "الجوائز", "النشاط"];
  const [show, setShow] = useState(profileNav[0]);

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  const parentCode = user?.connectCode;
  return (
    <div className="flex flex-col items-center justify-between w-full overflow-y-auto h-5/6">
      <div className="flex flex-row-reverse items-center justify-between  overflow-y-auto bg-yellowprimary py-7 w-full  p-4 rounded-b-[50px] ">
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

      <div className="flex flex-col items-center justify-between gap-0">
        <div className="w-32 h-32 -mt-8 border-4 border-white rounded-full">
          <GetAvatar userAvatarData={avatar ?? undefined} />
        </div>
        <h1 className="text-black">
          {user?.firstName} {user?.lastName}
        </h1>
        {/* <h1 className="text-[#B3B3B3]"> {t("طالب")}</h1> */}
        <h1 className="text-[#B3B3B3]"> {user?.grade}</h1>

        <div className="w-full gap-1 flex-center">
          <MdContentCopy
            className="text-[#B3B3B3] cursor-pointer"
            onClick={() => handleCopy(`${parentCode}`)}
          />
          <h1 className="text-[#B3B3B3]">{parentCode}</h1>

          {copySuccess && (
            <span className="ml-2 text-sm text-green-500">
              {t("تم النسخ بنجاح")}
            </span>
          )}
        </div>
      </div>

      {/* Navbar */}
      <div className="flex flex-col justify-between w-full gap-3 p-4">
        <div className="flex items-center w-full gap-1">
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
