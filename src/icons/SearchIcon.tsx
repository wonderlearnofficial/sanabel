import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Optional size prop with a default value of 25
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      opacity="0.4"
      d="M7.66634 14C11.1641 14 13.9997 11.1644 13.9997 7.66665C13.9997 4.16884 11.1641 1.33331 7.66634 1.33331C4.16854 1.33331 1.33301 4.16884 1.33301 7.66665C1.33301 11.1644 4.16854 14 7.66634 14Z"
      fill="white"
    />
    <path
      d="M14.1997 14.6667C14.0797 14.6667 13.9597 14.62 13.873 14.5334L12.633 13.2934C12.453 13.1134 12.453 12.82 12.633 12.6334C12.813 12.4534 13.1064 12.4534 13.293 12.6334L14.533 13.8734C14.713 14.0534 14.713 14.3467 14.533 14.5334C14.4397 14.62 14.3197 14.6667 14.1997 14.6667Z"
      fill="white"
    />
  </svg>
);

export default CustomIcon;
