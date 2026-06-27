import { useTheme } from "../../../context/ThemeContext";

import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import { useTranslation } from "react-i18next";

import { useState } from "react";
import SearchIcon from "../../../icons/SearchIcon";
import GoBackButton from "../../../components/GoBackButton";

import { avatars } from "../../../data/Avatars";
import PrimaryButton from "../../../components/PrimaryButton";
import { FaCheck } from "react-icons/fa";

const StudentList: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const [openInvite, setOpenInvite] = useState(false);

  const [markedIndices, setMarkedIndices] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(""); // State for search input

  const toggleMarked = (index: number) => {
    setMarkedIndices(
      (prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index) // Unmark if already marked
          : [...prev, index] // Mark if not marked
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-between gap-10 p-4 overflow-y-auto"
      id="page-height"
    >
      <div className="flex-col w-full gap-3 flex-center">
        <div className="flex items-center justify-between w-full">
          <div className="w-16 h-16 "></div>

          <h1 className="self-center text-2xl font-bold text-black" dir="ltr">
            {t("الطلاب")}
          </h1>

          <GoBackButton />
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
      </div>
      {/* <div className="flex flex-col w-full gap-2 overflow-y-auto h-">
        {filteredStudents.map((student, index) => (
          <div
            className="flex items-center justify-between w-full p-3 border-2 rounded-xl "
            key={index}
          >
            <div
              className={`w-10 h-10 flex-center rounded-xl ${
                markedIndices.includes(index)
                  ? "bg-blueprimary border-0"
                  : "bg-transparent border-2"
              }`}
              onClick={() => toggleMarked(index)}
            >
              <FaCheck />
            </div>
            <div className="gap-3 flex-center">
              <div className="flex flex-col gap-3">
                <h1 className="text-black"> {student.name}</h1>
                <h1 className="text-black text-end"> class</h1>
              </div>
              <img src={student.avatar} alt="" className="w-12" />
            </div>
          </div>
        ))}
      </div> */}
      <PrimaryButton style={""} text={t("تسجيل حسنات")} arrow={"none"} />
      <TeacherNavbar />
    </div>
  );
};

export default StudentList;
