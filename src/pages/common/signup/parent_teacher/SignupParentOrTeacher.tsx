import React, { useState } from "react";
import EmailOTP from "./EmailOTP";
import axios from "axios";
import { t } from "i18next";
import { toast } from "react-toastify";
import Step1 from "./Step1";
import Password from "./Password";
import { useHistory } from "react-router-dom";

const Signup: React.FC = () => {
  const history = useHistory();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for storing data from each step
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Teacher");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [name, setName] = useState({ firstName: "", lastName: "" });

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
      onComplete={() => handleSubmit()}
      onBack={() => setStepIndex(stepIndex - 1)}
      name={name}
      setName={setName}
      role={role}
      setRole={setRole}
      setAvatar={setAvatar}
    />,
  ];

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);

    // Format name and date of birth
    const formattedName = {
      firstName: name.firstName,
      lastName: name.lastName,
    };

    // Final data structure
    const formData = {
      firstName: formattedName.firstName,
      lastName: formattedName.lastName,
      email,
      password,
      role,
    };

    console.log("Submitting form data:", formData);

    try {
      const response = await axios.patch(
        "https://sanabel.wonderlearn.net/users/registration",
        formData,
      );

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Check for success status codes (200, 201, 204)
      if (response.status >= 200 && response.status < 300) {
        console.log("Registration successful, navigating to login...");
        history.push("/login");
      } else {
        console.warn("Unexpected response status:", response.status);
        toast.error(t("حدث خطأ أثناء التسجيل"));
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        console.error(
          "Server error:",
          error.response.status,
          error.response.data,
        );
        toast.error(
          t("خطأ في الخادم: ") +
            (error.response.data?.message || error.response.status),
        );
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network error:", error.request);
        toast.error(t("خطأ في الشبكة"));
      } else {
        // Something else happened
        console.error("Error:", error.message);
        toast.error(t("حدث خطأ غير متوقع"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      {steps[stepIndex]}
      {stepIndex > 0 && (
        <button
          onClick={() => setStepIndex(stepIndex - 1)}
          className="back-button"
          disabled={isSubmitting}
        >
          {t("الرجوع")}
        </button>
      )}
    </div>
  );
};

export default Signup;
