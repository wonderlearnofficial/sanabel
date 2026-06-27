import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 43 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_i_105_7701)">
      <path
        d="M30.7403 9.5346C30.799 9.20249 30.8296 8.86084 30.8296 8.51213C30.8296 5.24997 28.1506 2.60547 24.846 2.60547C22.3892 2.60547 20.2783 4.067 19.3567 6.1573C18.6102 5.52105 17.6414 5.1369 16.5828 5.1369C14.2223 5.1369 12.3088 7.04681 12.3088 9.40282C12.3088 9.53401 12.3147 9.66382 12.3263 9.79199C11.191 10.3409 10.4092 11.4928 10.4092 12.8249C10.4092 14.689 11.94 16.2002 13.8284 16.2002H29.9748C31.8632 16.2002 33.394 14.689 33.394 12.8249C33.394 11.2206 32.2601 9.87773 30.7403 9.5346Z"
        fill="url(#paint0_linear_105_7701)"
      />
    </g>
    <g filter="url(#filter1_f_105_7701)">
      <path
        d="M21.6008 7.67028C18.0877 12.4401 17.4786 18.9497 20.5776 24.3174C23.6767 29.6851 29.6187 32.4124 35.5061 31.7549C34.2543 33.4545 32.6337 34.9332 30.6809 36.0607C23.2475 40.3524 13.8141 37.9295 9.61081 30.6491C5.40748 23.3687 8.02591 13.9877 15.4592 9.6961C17.4121 8.56861 19.503 7.90457 21.6008 7.67028Z"
        fill="#FFEE94"
      />
    </g>
    <g filter="url(#filter2_i_105_7701)">
      <path
        d="M21.2734 9.67851C18.0665 14.0326 17.5104 19.9747 20.3394 24.8746C23.1683 29.7744 28.5924 32.2639 33.9666 31.6637C32.8238 33.2152 31.3446 34.565 29.5619 35.5942C22.7765 39.5118 14.1654 37.3001 10.3285 30.6543C6.49156 24.0086 8.88175 15.4453 15.6671 11.5277C17.4498 10.4985 19.3584 9.89238 21.2734 9.67851Z"
        fill="url(#paint1_linear_105_7701)"
      />
    </g>
    <g filter="url(#filter3_b_105_7701)">
      <g filter="url(#filter4_i_105_7701)">
        <path
          d="M35.699 35.6357C35.772 35.2215 35.8101 34.7953 35.8101 34.3603C35.8101 30.291 32.4777 26.9922 28.367 26.9922C25.3111 26.9922 22.6852 28.8153 21.539 31.4228C20.6103 30.6291 19.4053 30.1499 18.0885 30.1499C15.1523 30.1499 12.772 32.5324 12.772 35.4714C12.772 35.635 12.7794 35.7969 12.7938 35.9568C11.3815 36.6416 10.4091 38.0785 10.4091 39.7402C10.4091 42.0655 12.3133 43.9505 14.6623 43.9505H34.7468C37.0958 43.9505 39 42.0655 39 39.7402C39 37.7389 37.5895 36.0638 35.699 35.6357Z"
          fill="url(#paint2_linear_105_7701)"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_i_105_7701"
        x="10.4092"
        y="2.60547"
        width="22.9849"
        height="14.9953"
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
        <feOffset dy="1.54167" />
        <feGaussianBlur stdDeviation="0.700758" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7701"
        />
      </filter>
      <filter
        id="filter1_f_105_7701"
        x="0.177194"
        y="0.241891"
        width="42.7569"
        height="45.3697"
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
          stdDeviation="3.71402"
          result="effect1_foregroundBlur_105_7701"
        />
      </filter>
      <filter
        id="filter2_i_105_7701"
        x="8.4978"
        y="9.67773"
        width="25.4688"
        height="28.4141"
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
        <feOffset dy="0.560606" />
        <feGaussianBlur stdDeviation="0.560606" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7701"
        />
      </filter>
      <filter
        id="filter3_b_105_7701"
        x="8.51713"
        y="25.1001"
        width="32.3749"
        height="20.7431"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feGaussianBlur in="BackgroundImageFix" stdDeviation="0.946023" />
        <feComposite
          in2="SourceAlpha"
          operator="in"
          result="effect1_backgroundBlur_105_7701"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_backgroundBlur_105_7701"
          result="shape"
        />
      </filter>
      <filter
        id="filter4_i_105_7701"
        x="10.4092"
        y="26.9922"
        width="28.5908"
        height="17.6597"
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
        <feGaussianBlur stdDeviation="0.350379" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7701"
        />
      </filter>
      <linearGradient
        id="paint0_linear_105_7701"
        x1="11.8711"
        y1="14.9864"
        x2="34.9979"
        y2="-2.37171"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="white" />
        <stop offset="1" stop-color="white" stop-opacity="0.58" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_105_7701"
        x1="21.9717"
        y1="7.3694"
        x2="16.8806"
        y2="38.1958"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FFEE94" />
        <stop offset="1" stop-color="#FF9900" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_105_7701"
        x1="12.2276"
        y1="42.4364"
        x2="41.0536"
        y2="20.8618"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="white" />
        <stop offset="1" stop-color="white" stop-opacity="0.58" />
      </linearGradient>
    </defs>
  </svg>
);

export default CustomIcon;
