import React from "react";
import i18n from "../i18n";
interface CustomIconProps {
  className?: string;
  size?: number;
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 9 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} text-[#B3B3B3] dark:text-white ${
      i18n.language === "en" && "rotate-180"
    }`}
  >
    <path
      d="M8.2525 0.297211C8.4425 0.297211 8.6325 0.367485 8.7825 0.518074C9.0725 0.809216 9.0725 1.2911 8.7825 1.58224L2.2625 8.12788C1.7825 8.60977 1.7825 9.39283 2.2625 9.87472L8.7825 16.4204C9.0725 16.7115 9.0725 17.1934 8.7825 17.4845C8.4925 17.7757 8.0125 17.7757 7.7225 17.4845L1.2025 10.9389C0.692496 10.4269 0.402496 9.73417 0.402496 9.0013C0.402496 8.26843 0.682496 7.57572 1.2025 7.06371L7.7225 0.518074C7.8725 0.377523 8.0625 0.297211 8.2525 0.297211Z"
      fill="currentColor"
    />
  </svg>
);

export default CustomIcon;
