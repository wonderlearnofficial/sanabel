import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import PrimaryButton from "../../../components/PrimaryButton";
import { IonRouterLink } from "@ionic/react";

import GenericInput from "../../../components/GenericInput";
import BackArrow from "../../../icons/BackArrow";
import GoBackButton from "../../../components/GoBackButton";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import AVATARS
// Boys Avatars
import boy1 from "../../assets/signup/Avatar/Boys/boy1.png";
import boy2 from "../../assets/signup/Avatar/Boys/boy2.png";
import boy3 from "../../assets/signup/Avatar/Boys/boy3.png";
import boy4 from "../../assets/signup/Avatar/Boys/boy4.png";
import boy5 from "../../assets/signup/Avatar/Boys/boy5.png";
import boy6 from "../../assets/signup/Avatar/Boys/boy6.png";
import boy7 from "../../assets/signup/Avatar/Boys/boy7.png";

// Girls Avatars
import girl1 from "../../assets/signup/Avatar/Girls/girl1.png";
import girl2 from "../../assets/signup/Avatar/Girls/girl2.png";
import girl3 from "../../assets/signup/Avatar/Girls/girl3.png";
import girl4 from "../../assets/signup/Avatar/Girls/girl4.png";
import girl5 from "../../assets/signup/Avatar/Girls/girl5.png";
import girl6 from "../../assets/signup/Avatar/Girls/girl6.png";
import girl7 from "../../assets/signup/Avatar/Girls/girl7.png";
import girl8 from "../../assets/signup/Avatar/Girls/girl8.png";
import girl9 from "../../assets/signup/Avatar/Girls/girl9.png";
import i18n from "../../../i18n";
import axios from "axios";

// Grouped arrays for easier access
const boysAvatars = [boy1, boy2, boy3, boy4, boy5, boy6, boy7];
const girlsAvatars = [
  girl1,
  girl2,
  girl3,
  girl4,
  girl5,
  girl6,
  girl7,
  girl8,
  girl9,
];

const Toaster = () => (
  <ToastContainer
    position="top-right"
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

const Step1: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  // State for storing data from each step
  const [email, setEmail] = useState("alielmayyah@gmail.com");
  const [character, setCharacter] = useState(
    "/src/assets/signup/Avatar/Boys/boy2.png"
  );
  const [name, setName] = useState({
    firstName: "Ali",
    parentName: "Elmayyah",
  });
  const [gradeYear, setGradeYear] = useState("Grade 1");
  const [gender, setGender] = useState("boy");

  // Temp Variables
  const [tempEmail, setTempEmail] = useState(email);
  const [tempCharacter, setTempCharacter] = useState(character);
  const [tempName, setTempName] = useState({
    firstName: name.firstName,
    parentName: name.parentName,
  });
  const [tempGradeYear, setTempGradeYear] = useState(gradeYear);

  const handleNameChange = (key: string, value: string) => {
    setTempName({ ...tempName, [key]: value });
  };

  // Validation helper to check if a string contains only letters
  const isAlphabetic = (str: string) => /^[A-Za-z\u0621-\u064A ]+$/.test(str);

  const handleSubmit = async () => {
    // Format name and date of birth
    const formattedName = {
      firstName: name.firstName,
      lastName: name.parentName,
    };
    // Final data structure
    const formData = {
      firstName: formattedName.firstName,
      lastName: formattedName.lastName,
      email,
      genre: gender,
      grade: gradeYear,
      profileImg: character,
    };

    console.log("Submitting form data:", formData);

    // Handle API submission here
    try {
      const response = await axios.post(
        "https://sanabel.wonderlearn.net/users/registration",
        formData
      );
      if (response.status === 200) {
        history.push("/home");
      }
    } catch (error) {
      console.error("Error", error);
      toast.error(t("Error"));
    }
  };
  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10">
      <div className="absolute">
        <Toaster />
      </div>
      <div className="flex flex-row-reverse items-center w-full gap-3">
        <GoBackButton />

        <h1 className="text-2xl font-bold text-black text-end " dir="ltr">
          {t("تعديل الملف الشخصي")}
        </h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-5">
        <img
          src={tempCharacter}
          alt={`Avatar`}
          className={`w-32 h-32 bg-redprimary rounded-full `}
        />
        <div className="flex flex-wrap items-center justify-center gap-1">
          {(gender === "boy" ? boysAvatars : girlsAvatars).map(
            (avatar, index) => (
              <img
                key={index}
                src={avatar}
                alt={`Avatar ${index + 1}`}
                className={`w-10 h-10 bg-redprimary rounded-full  ${
                  tempCharacter === avatar
                    ? "scale-125 opacity-100"
                    : "opacity-70"
                }`}
                onClick={() => setTempCharacter(avatar)}
              />
            )
          )}
        </div>
      </div>

      {/* First and last name */}
      <div className="flex flex-col w-full gap-7">
        <div className="flex flex-col">
          <div className="flex gap-3">
            <GenericInput
              type="text"
              placeholder={t("اسم والدك")}
              title={t("اسم والدك")}
              onChange={(e) => handleNameChange("parentName", e.target.value)}
              value={tempName.parentName}
            />
            <GenericInput
              type="text"
              placeholder={t("اسمك")}
              title={t("اسمك الأول")}
              onChange={(e) => handleNameChange("firstName", e.target.value)}
              value={tempName.firstName}
            />
          </div>
        </div>
      </div>
      {/* First and last name */}

      {/* Email */}
      <div className="flex flex-col w-full gap-3 ">
        <GenericInput
          type="email"
          placeholder={t("email_example")}
          title={t("البريد الإلكتروني")}
          onChange={(e) => setTempEmail(e.target.value)}
          value={tempEmail}
        />
      </div>
      {/* Email */}

      {/* Class */}
      <div className="flex flex-col w-full gap-1">
        <h1 className="self-end text-[#121212] ">{t("اختار صفك")}</h1>
        <select
          id="grades"
          className={`w-full ${
            i18n.language === "ar" ? "text-right" : "text-left"
          } bg-white border py-4 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 CustomFont`}
          dir={`${i18n.language === "ar" ? "rtl" : "ltr"}`}
        >
          <option selected>{t("اختار صفك")}</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option
              key={i + 1}
              value={`الصف ${i + 1}`}
              className="py-3 CustomFont"
            >
              {t(`الصف ${i + 1}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Class */}

      <div className="w-full " onClick={handleSubmit}>
        <PrimaryButton style="fill" text={t("حفظ")} arrow="none" />
      </div>
    </div>
  );
};

export default Step1;
