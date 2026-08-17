import React from "react";
import { useTranslation } from "react-i18next";

interface SettingToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  activeColor?: string;
  ariaLabel?: string;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  activeColor = "bg-blueprimary",
  ariaLabel,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="inline-flex items-center gap-2 cursor-pointer select-none"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
    >
      <span
        className={`text-xs font-bold transition-colors ${
          checked ? "text-blueprimary font-extrabold" : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {checked ? t("مفعّل") : t("معطّل")}
      </span>

      <div
        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? activeColor : "bg-gray-300 dark:bg-gray-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
            isRTL
              ? checked
                ? "-translate-x-7"
                : "translate-x-0"
              : checked
              ? "translate-x-7"
              : "translate-x-0"
          }`}
        />
      </div>
    </div>
  );
};

export default SettingToggle;
