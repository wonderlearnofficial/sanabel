import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 19 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      opacity="0.4"
      d="M15.95 3.07471V4.72471C15.95 5.32471 15.575 6.07471 15.2 6.44971L11.975 9.29971C11.525 9.67471 11.225 10.4247 11.225 11.0247V14.2497C11.225 14.6997 10.925 15.2997 10.55 15.5247L9.5 16.1997C8.525 16.7997 7.175 16.1247 7.175 14.9247V10.9497C7.175 10.4247 6.875 9.74971 6.575 9.37471L5.825 8.58721L10.19 1.57471H14.45C15.275 1.57471 15.95 2.24971 15.95 3.07471Z"
      fill="#4AAAD6"
    />
    <path
      d="M8.975 1.57471L5.09 7.80721L3.725 6.37471C3.35 5.99971 3.05 5.32471 3.05 4.87471V3.14971C3.05 2.24971 3.725 1.57471 4.55 1.57471H8.975Z"
      fill="#4AAAD6"
    />
  </svg>
);

export default CustomIcon;
