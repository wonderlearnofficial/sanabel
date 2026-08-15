import NotificationIcon from "../icons/NotificationIcon";

import { useTranslation } from "react-i18next";
import "../index.css";
import i18n from "i18next";
import { FaEyeSlash } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import { useState } from "react";

export interface InputProps {
  type: string;
  placeholder: string;
  title: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void;
}
function GenericInput({
  type,
  placeholder,
  title,
  value,
  onChange,
}: InputProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  function handleShowPassword() {
    setShowPassword(!showPassword);
  }

  return (
    <div className="relative flex flex-col justify-end w-full min-w-0 gap-2">
      <h1 className="text-[#121212] leading-tight break-words">{title}</h1>
      <input
        type={type === "password" && showPassword ? "text" : type}
        placeholder={placeholder}
        className={`bg-white text-[#121212] focus:text-[#121212] text-base font-medium border-2 border-[#EAECF0] rounded-xl w-full min-w-0 p-3 placeholder:text-[#ccc] ${
          type === "password" || type === "email" ? "text-left" : ""
        } ${type === "password" ? "pr-12" : ""}`}
        dir={type === "password" || type === "email" ? "ltr" : undefined}
        value={value}
        onChange={onChange}
      />
      <div
        onClick={handleShowPassword}
        className={`text-[#B3B3B3] text-2xl absolute top-[55%] ${
          type === "password"
            ? "right-5"
            : i18n.language === "ar"
            ? "left-5"
            : "right-5"
        } -transform-y-1/2 cursor-pointer`}
      >
        {type === "password" && (showPassword ? <FaEye /> : <FaEyeSlash />)}
      </div>
    </div>
  );
}
export default GenericInput;
