import { API_BASE_URL } from "../../../../config/api";
import React, { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import Step6 from "./Step6";

import Password from "./Password";
import EmailOTP from "./Email_OTP";

import axios from "axios";
import { t } from "i18next";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { getErrorMessage } from "../../../../config/getErrorMessage";

const Signup: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const history = useHistory();
  // State for storing data from each step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [name, setName] = useState({ firstName: "", parentName: "" });
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState({ day: "", month: "", year: "" });
  const [gradeYear, setGradeYear] = useState("");
  // const [parentCode, setParentCode] = useState("");
  const [character, setCharacter] = useState("");

  const steps = [
    <EmailOTP
      onContinue={() => {
        setStepIndex(stepIndex + 1);
      }}
      email={email}
      setEmail={setEmail}
      onBack={() => setStepIndex(stepIndex - 1)}
      otp={otp}
      setOtp={setOtp}
    />,

    <Password
      onContinue={() => setStepIndex(stepIndex + 1)}
      setPassword={setPassword}
      password={password}
    />,
    <Step1
      onContinue={() => setStepIndex(stepIndex + 1)}
      onBack={() => setStepIndex(stepIndex - 1)}
      name={name}
      setName={setName}
    />,
    <Step2
      onContinue={() => handleSubmit()}
      onBack={() => setStepIndex(stepIndex - 1)}
      gender={gender}
      setGender={setGender}
    />,
    // <Step3
    //   onContinue={() => handleSubmit()}
    //   onBack={() => setStepIndex(stepIndex - 1)}
    //   birthdate={birthdate}
    //   setBirthdate={setBirthdate}
    // />,
    // <Step4
    //   onContinue={() => setStepIndex(stepIndex + 1)}
    //   onBack={() => setStepIndex(stepIndex - 1)}
    //   gradeYear={gradeYear}
    //   setGradeYear={setGradeYear}
    // />,
    // <Step5
    //   onContinue={() => setStepIndex(stepIndex + 1)}
    //   onBack={() => setStepIndex(stepIndex - 1)}
    //   parentCode={parentCode}
    //   setParentCode={setParentCode}
    // />,
    // <Step6
    //   onComplete={() => handleSubmit()}
    //   onBack={() => setStepIndex(stepIndex - 1)}
    //   gender={gender}
    //   character={character}
    //   setCharacter={setCharacter}
    // />,
  ];

  const handleSubmit = async () => {
    // Format name and date of birth
    const formattedName = {
      firstName: name.firstName,
      lastName: name.parentName,
    };

    const formattedBirthdate = `${birthdate.year}-${birthdate.month.padStart(
      2,
      "0",
    )}-${birthdate.day.padStart(2, "0")}`;

    // Final data structure
    const formData = {
      firstName: formattedName.firstName,
      lastName: formattedName.lastName,
      email,
      password,
      gender: gender,

      grade: gradeYear,
      role: "Student",
      profileImg: "",
    };

    console.log("Submitting form data:", formData);

    // Handle API submission here
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/registration`,
        formData,
      );

      if (response.status === 201) {
        history.push(`/login`);
        // PUSH TO LOGIN
        toast.success("Sign up");
      }
    } catch (error) {
      console.error("Error", error);
      toast.error(t(getErrorMessage(error, "registrationFailed")));
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      {steps[stepIndex]}
      {stepIndex > 0 && (
        <button
          onClick={() => setStepIndex(stepIndex - 1)}
          className="back-button"
        >
          {t("الرجوع")}
        </button>
      )}
    </div>
  );
};

export default Signup;
