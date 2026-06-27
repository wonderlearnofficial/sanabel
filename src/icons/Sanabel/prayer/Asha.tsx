import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 37 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="18.5"
      cy="19.4512"
      r="18.5"
      fill="url(#paint0_radial_105_7717)"
    />
    <ellipse
      cx="10.8241"
      cy="14.5257"
      rx="4.34096"
      ry="1.77182"
      transform="rotate(73.3884 10.8241 14.5257)"
      fill="#A9A9A9"
    />
    <ellipse
      cx="4.91032"
      cy="26.6956"
      rx="4.34096"
      ry="1.77182"
      transform="rotate(73.3884 4.91032 26.6956)"
      fill="#A9A9A9"
    />
    <ellipse
      cx="16.0466"
      cy="27.5257"
      rx="4.34096"
      ry="1.77182"
      transform="rotate(46.7975 16.0466 27.5257)"
      fill="#A9A9A9"
    />
    <ellipse
      cx="28.981"
      cy="27.5257"
      rx="4.34096"
      ry="1.77182"
      transform="rotate(46.7975 28.981 27.5257)"
      fill="#A9A9A9"
    />
    <ellipse
      cx="18.7817"
      cy="19.2439"
      rx="3.15698"
      ry="1.28856"
      transform="rotate(46.7975 18.7817 19.2439)"
      fill="#A9A9A9"
    />
    <ellipse
      cx="16.124"
      cy="4.89236"
      rx="3.15698"
      ry="1.28856"
      transform="rotate(46.7975 16.124 4.89236)"
      fill="#A9A9A9"
    />
    <ellipse
      cx="31.9121"
      cy="12.4744"
      rx="3.15698"
      ry="1.28856"
      transform="rotate(46.7975 31.9121 12.4744)"
      fill="#A9A9A9"
    />
    <defs>
      <radialGradient
        id="paint0_radial_105_7717"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(18.5 19.4512) rotate(90) scale(18.5)"
      >
        <stop offset="0.284196" stop-color="#B7B7B7" />
        <stop offset="1" stop-color="#E2E2E2" />
      </radialGradient>
    </defs>
  </svg>
);

export default CustomIcon;
