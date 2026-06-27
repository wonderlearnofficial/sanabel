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
      d="M20.54 7.29778L14.78 3.26778C13.21 2.16778 10.8 2.22778 9.29001 3.39778L4.28001 7.30778C3.28001 8.08778 2.49001 9.68778 2.49001 10.9478V17.8478C2.49001 20.3978 4.56001 22.4778 7.11001 22.4778H17.89C20.44 22.4778 22.51 20.4078 22.51 17.8578V11.0778C22.51 9.72778 21.64 8.06778 20.54 7.29778ZM13.25 18.4778C13.25 18.8878 12.91 19.2278 12.5 19.2278C12.09 19.2278 11.75 18.8878 11.75 18.4778V15.4778C11.75 15.0678 12.09 14.7278 12.5 14.7278C12.91 14.7278 13.25 15.0678 13.25 15.4778V18.4778Z"
      fill="currentColor"
    />
  </svg>
);

export default CustomIcon;
