import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width="100%"
    height="auto"
    viewBox="0 0 110 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect y="16" width="110" height="200" fill="url(#paint0_linear_229_4010)" />
    <path d="M16 0H94L110 16H0L16 0Z" fill="#CDC9F3" />
    <path
      d="M55.4512 119.488V59.2832H55.8418L36.7988 72.9551V60.8945L55.6953 47.3691H67.1211V119.488H55.4512Z"
      fill="white"
    />
    <defs>
      <linearGradient
        id="paint0_linear_229_4010"
        x1="55"
        y1="16"
        x2="55"
        y2="189"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#4AAAD6" />
        <stop offset="1" stop-color="#CDE8F4" />
      </linearGradient>
    </defs>
  </svg>
);

export default CustomIcon;
