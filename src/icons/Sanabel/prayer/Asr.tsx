import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_105_7693)">
      <rect
        x="9.44702"
        y="9.8418"
        width="28.5531"
        height="26.8875"
        rx="11.1833"
        fill="#FFEF9A"
      />
    </g>
    <g filter="url(#filter1_i_105_7693)">
      <path
        d="M36.0966 25.4277C36.0966 32.2611 30.557 37.8007 23.7236 37.8007C16.8902 37.8007 11.3506 32.2611 11.3506 25.4277C11.3506 18.5943 16.8902 13.0547 23.7236 13.0547C30.557 13.0547 36.0966 18.5943 36.0966 25.4277Z"
        fill="url(#paint0_linear_105_7693)"
      />
    </g>
    <g filter="url(#filter2_b_105_7693)">
      <g filter="url(#filter3_i_105_7693)">
        <path
          d="M30.7814 31.8065C30.8674 31.3182 30.9123 30.8159 30.9123 30.3032C30.9123 25.5071 26.988 21.6191 22.1472 21.6191C18.5485 21.6191 15.4564 23.7679 14.1065 26.8411C13.0129 25.9057 11.5939 25.3409 10.0432 25.3409C6.58546 25.3409 3.78244 28.1489 3.78244 31.6127C3.78244 31.8056 3.79113 31.9964 3.80814 32.1849C2.14505 32.992 0.99989 34.6855 0.99989 36.644C0.99989 39.3846 3.24231 41.6063 6.00847 41.6063H29.6601C32.4263 41.6063 34.6687 39.3846 34.6687 36.644C34.6687 34.2853 33.0077 32.3109 30.7814 31.8065Z"
          fill="url(#paint1_linear_105_7693)"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_f_105_7693"
        x="0.286249"
        y="0.681025"
        width="46.8745"
        height="45.2083"
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
          stdDeviation="4.58039"
          result="effect1_foregroundBlur_105_7693"
        />
      </filter>
      <filter
        id="filter1_i_105_7693"
        x="11.3506"
        y="13.0547"
        width="24.7461"
        height="25.3409"
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
        <feOffset dy="0.594855" />
        <feGaussianBlur stdDeviation="1.07074" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.81 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7693"
        />
      </filter>
      <filter
        id="filter2_b_105_7693"
        x="-2.21222"
        y="18.4069"
        width="40.0931"
        height="26.4108"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feGaussianBlur in="BackgroundImageFix" stdDeviation="1.60611" />
        <feComposite
          in2="SourceAlpha"
          operator="in"
          result="effect1_backgroundBlur_105_7693"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_backgroundBlur_105_7693"
          result="shape"
        />
      </filter>
      <filter
        id="filter3_i_105_7693"
        x="1"
        y="21.6191"
        width="33.6687"
        height="21.176"
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
        <feOffset dy="1.30868" />
        <feGaussianBlur stdDeviation="0.594855" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7693"
        />
      </filter>
      <linearGradient
        id="paint0_linear_105_7693"
        x1="21.8441"
        y1="32.1623"
        x2="32.0244"
        y2="14.3076"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF9900" />
        <stop offset="1" stop-color="#FFEE94" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_105_7693"
        x1="3.14137"
        y1="39.8217"
        x2="37.1076"
        y2="14.4214"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="white" />
        <stop offset="1" stop-color="white" stop-opacity="0.58" />
      </linearGradient>
    </defs>
  </svg>
);

export default CustomIcon;
