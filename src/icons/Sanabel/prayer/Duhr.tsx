import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 55 59"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_105_7681)">
      <rect
        x="12"
        y="12"
        width="37"
        height="34.8417"
        rx="14.4917"
        fill="#FFEF9A"
      />
    </g>
    <g filter="url(#filter1_i_105_7681)">
      <path
        d="M46.8418 29.4216C46.8418 38.532 39.5254 45.9174 30.5001 45.9174C21.4749 45.9174 14.1584 38.532 14.1584 29.4216C14.1584 20.3112 21.4749 12.9258 30.5001 12.9258C39.5254 12.9258 46.8418 20.3112 46.8418 29.4216Z"
        fill="url(#paint0_linear_105_7681)"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_105_7681"
        x="0.129167"
        y="0.129167"
        width="60.7417"
        height="58.5835"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="5.93542"
          result="effect1_foregroundBlur_105_7681"
        />
      </filter>
      <filter
        id="filter1_i_105_7681"
        x="14.1584"
        y="12.9258"
        width="32.6833"
        height="33.763"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="0.770833" />
        <feGaussianBlur stdDeviation="1.3875" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.81 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7681"
        />
      </filter>
      <linearGradient
        id="paint0_linear_105_7681"
        x1="28.0178"
        y1="38.4004"
        x2="41.655"
        y2="14.7064"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF9900" />
        <stop offset="1" stop-color="#FFEE94" />
      </linearGradient>
    </defs>
  </svg>
);

export default CustomIcon;
