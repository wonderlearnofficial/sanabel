import { useHistory } from "react-router-dom";

import { useTranslation } from "react-i18next";

// Import Images

import { useEffect, useRef, useState } from "react";
import sanabelVideo from "../../assets/sanabelAnimation.mp4";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import SearchIcon from "../../../icons/SearchIcon";
import GoBackButton from "../../../components/GoBackButton";

import { avatars } from "../../../data/Avatars";

const TeamsDetails: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [selectViewType, setSelectViewType] = useState("classes");

  const [searchQuery, setSearchQuery] = useState<string>(""); // State for search input

  
  const studentsData: any[] = [];
  const filteredStudents = studentsData.filter((student) =>
    student.name.includes(searchQuery),
  );
  return (
    <div className="flex flex-col items-center justify-start w-full h-screen gap-3 p-4 overflow-y-auto">
      <div className="flex items-center justify-between w-full">
        <div className="opacity-0 w-[25px] " />
        <h1 className="self-center text-2xl font-bold text-black" dir="ltr">
          {t("تفاصيل الفريق")}
        </h1>
        <GoBackButton />
      </div>

      <div className="flex items-center justify-between w-full h-20 p-5 my-5 bg-redprimary rounded-xl">
        <h1 className="text-xl"> {t("فريق الخير")}</h1>
      </div>

      <div className="flex flex-col items-end w-full gap-2">
        <div className="flex justify-between w-full">
          <h1 className="text-[#999]"> {t("100 طالب")}</h1>
          <h1 className="text-xl font-bold text-black text-end">
            {t("الطلاب")}
          </h1>
        </div>
        <div className="flex items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
          <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
            <SearchIcon className="text-white" size={20} />
          </div>
          <input
            type="text"
            placeholder={t("ابحث عن طالب")}
            className="w-full py-3 text-black bg-transparent drop-shadow-sm text-end"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid w-full grid-cols-3 gap-2 overflow-y-auto h-1/2">
          {filteredStudents.map((item) => (
            <div className="flex-col gap-1 p-2 flex-center">
              <img src={item.avatar} alt="" className="w-12" />

              <h1 className="text-black text-end text-md">{item.name}</h1>
              <h1 className="text-[#999] text-end text-sm" dir="rtl">
                {item.points} {t("")}
              </h1>
              <h1 className="text-[#999] text-end text-sm" dir="rtl">
                {item.class}
              </h1>
            </div>
          ))}
        </div>
      </div>

      <TeacherNavbar />
    </div>
  );
};

export default TeamsDetails;
