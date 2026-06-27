import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 30 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_i_105_7661)">
      <path
        d="M17.5064 0.978552C14.4925 5.07053 13.9699 10.655 16.6286 15.2598C19.2872 19.8647 24.3848 22.2043 29.4354 21.6403C28.3615 23.0984 26.9713 24.367 25.296 25.3342C18.919 29.0159 10.8263 26.9374 7.22034 20.6917C3.61437 14.446 5.86068 6.39819 12.2376 2.71647C13.9129 1.74922 15.7067 1.17954 17.5064 0.978552Z"
        fill="#E2E2E2"
      />
    </g>
    <ellipse
      cx="8.40793"
      cy="13.3478"
      rx="3.22701"
      ry="1.31715"
      transform="rotate(73.3884 8.40793 13.3478)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="12.2903"
      cy="23.0118"
      rx="3.22701"
      ry="1.31715"
      transform="rotate(46.7975 12.2903 23.0118)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="21.9055"
      cy="23.0118"
      rx="3.22701"
      ry="1.31715"
      transform="rotate(46.7975 21.9055 23.0118)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="14.3236"
      cy="16.8548"
      rx="2.34686"
      ry="0.957901"
      transform="rotate(46.7975 14.3236 16.8548)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="12.3478"
      cy="6.18679"
      rx="2.34686"
      ry="0.957901"
      transform="rotate(46.7975 12.3478 6.18679)"
      fill="#C8C8C8"
    />
    <defs>
      <filter
        id="filter0_i_105_7661"
        x="5.49976"
        y="0.978516"
        width="23.9358"
        height="26.6267"
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
        <feOffset dy="0.450906" />
        <feGaussianBlur stdDeviation="0.450906" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7661"
        />
      </filter>
    </defs>
  </svg>
);

export default CustomIcon;
