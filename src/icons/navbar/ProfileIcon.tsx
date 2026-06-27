import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      opacity="0.4"
      d="M12.5 2.47781C9.88 2.47781 7.75 4.60781 7.75 7.22781C7.75 9.79781 9.76 11.8778 12.38 11.9678C12.46 11.9578 12.54 11.9578 12.6 11.9678C12.62 11.9678 12.63 11.9678 12.65 11.9678C12.66 11.9678 12.66 11.9678 12.67 11.9678C15.23 11.8778 17.24 9.79781 17.25 7.22781C17.25 4.60781 15.12 2.47781 12.5 2.47781Z"
      fill="currentColor"
    />
    <path
      d="M17.58 14.6278C14.79 12.7678 10.24 12.7678 7.42999 14.6278C6.15999 15.4778 5.45999 16.6278 5.45999 17.8578C5.45999 19.0878 6.15999 20.2278 7.41999 21.0678C8.81999 22.0078 10.66 22.4778 12.5 22.4778C14.34 22.4778 16.18 22.0078 17.58 21.0678C18.84 20.2178 19.54 19.0778 19.54 17.8378C19.53 16.6078 18.84 15.4678 17.58 14.6278Z"
      fill="currentColor"
    />
  </svg>
);

export default CustomIcon;
