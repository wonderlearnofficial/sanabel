import { useState } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import PrimaryButton from "../../../../components/PrimaryButton";
import GenericInput from "../../../../components/GenericInput";
import GoBackButton from "../../../../components/GoBackButton";
import { useTranslation } from "react-i18next";

import parentFemaleImg from "../../../../assets/choosesignmethod/chooseparentorteacher.png";
import parentMaleImg from "../../../../assets/choosesignmethod/chooseparentorteacher.png";
import teacherMaleImg from "../../../../assets/choosesignmethod/chooseparentorteacher.png";
import teacherFemaleImg from "../../../../assets/choosesignmethod/chooseparentorteacher.png";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

interface Step1Props {
  onComplete: () => void;
  onBack: () => void;
  name: { firstName: string; lastName: string };
  setName: (name: { firstName: string; lastName: string }) => void;
  role: string;
  setRole: (value: string) => void;
  setAvatar: (avatar: string) => void;
}

const Step1: React.FC<Step1Props> = ({
  onComplete,
  onBack,
  name,
  setName,
  role,
  setRole,
  setAvatar,
}) => {
  const { darkMode } = useTheme();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (key: string, value: string) => {
    setName({ ...name, [key]: value });
  };

  // Improved validation for Arabic and English names
  const isValidName = (str: string) => {
    // Allow Arabic, English letters, and spaces
    const arabicEnglishRegex = /^[\u0621-\u064A\u0660-\u0669A-Za-z\s]+$/;
    return arabicEnglishRegex.test(str.trim()) && str.trim().length >= 2;
  };

  const finishStep1 = async () => {
    if (isSubmitting) return; // Prevent double submission

    // Validate first name
    if (!name.firstName || !name.firstName.trim()) {
      toast.error(t("enterFirstName") || "Please enter your first name");
      return;
    }

    // Validate last name
    if (!name.lastName || !name.lastName.trim()) {
      toast.error(t("enterLastName") || "Please enter your last name");
      return;
    }

    // Validate first name format
    if (!isValidName(name.firstName)) {
      toast.error(
        t("invalidFirstName") ||
          "Please enter a valid first name (letters only)",
      );
      return;
    }

    // Validate last name format
    if (!isValidName(name.lastName)) {
      toast.error(
        t("invalidLastName") || "Please enter a valid last name (letters only)",
      );
      return;
    }

    // Validate role selection
    if (!role) {
      toast.error(t("pleaseSelectRole") || "Please select your role");
      return;
    }

    setIsSubmitting(true);

    try {
      // Set avatar based on role selection
      const avatarMap = {
        Parent: parentFemaleImg, // You can make this dynamic based on gender if needed
        Teacher: teacherFemaleImg,
      };

      setAvatar(avatarMap[role as keyof typeof avatarMap] || parentFemaleImg);

      // Call parent completion handler
      await onComplete();
    } catch (error) {
      console.error("Error in Step1 completion:", error);
      toast.error(t("errorOccurred") || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole);
    console.log("Role selected:", selectedRole);
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-10 p-5 pb-10 overflow-y-auto">
      <div className="absolute z-50 transform -translate-x-1/2 top-4 left-1/2">
        <Toaster />
      </div>

      <div className="flex flex-col w-full gap-3">
        <div className="flex justify-start w-full" onClick={onBack}>
          <GoBackButton />
        </div>

        <div className="flex flex-col self-end gap-2">
          <h1 className="text-2xl font-bold text-black ">
            {t("انشاء حساب جديد") || "Create New Account"}
          </h1>
          <p className="text-[#B3B3B3] text-sm ">
            {t("انشاء حساب واستمتع بتجربة تفاعلية تبني العطاء والانتماء") ||
              "Create an account and enjoy an interactive experience that builds giving and belonging"}
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full gap-5">
        {/* Role Selection */}
        <div className="flex flex-col gap-5 transition-all duration-300">
          <div className="flex justify-center gap-5">
            <div
              className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                role === "Parent"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isSubmitting && handleRoleSelection("Parent")}
            >
              <img
                src={parentFemaleImg}
                alt="Parent"
                className="object-cover w-24 h-24 rounded-full"
              />
              <p className="text-xl font-semibold text-center">
                {t("Parent") || "Parent"}
              </p>
            </div>

            <div
              className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                role === "Teacher"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isSubmitting && handleRoleSelection("Teacher")}
            >
              <img
                src={teacherFemaleImg}
                alt="Teacher"
                className="object-cover w-24 h-24 rounded-full"
              />
              <p className="text-xl font-semibold text-center">
                {t("Teacher") || "Teacher"}
              </p>
            </div>
          </div>
        </div>

        {/* Name Input Fields */}
        <div className="flex flex-col w-full gap-5">
          <div className="flex gap-3">
            <GenericInput
              type="text"
              placeholder={t("اسمك") || "First Name"}
              title={t("اسمك الأول") || "First Name"}
              onChange={(e) => handleNameChange("firstName", e.target.value)}
              value={name.firstName}
            />
            <GenericInput
              type="text"
              placeholder={t("اسمك الاخير") || "Last Name"}
              title={t("اسمك الاخير") || "Last Name"}
              onChange={(e) => handleNameChange("lastName", e.target.value)}
              value={name.lastName}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="w-full">
        <div
          className={`${
            isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          onClick={!isSubmitting ? finishStep1 : undefined}
        >
          <PrimaryButton
            style="fill"
            text={
              isSubmitting
                ? t("جاري الإنشاء") || "Creating..."
                : t("متابعة") || "Continue"
            }
            arrow="left"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1;
