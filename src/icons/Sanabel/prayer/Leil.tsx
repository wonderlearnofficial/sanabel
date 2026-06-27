import React from "react";

interface CustomIconProps {
  className?: string;
  size?: number; // Add size prop type
}

const CustomIcon: React.FC<CustomIconProps> = ({ className, size = 25 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 37 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_i_105_7738)">
      <path
        d="M16.4262 1.90733C13.4821 5.90465 12.9716 11.3599 15.5687 15.8583C18.1659 20.3566 23.1455 22.6421 28.0794 22.0911C27.0303 23.5155 25.6722 24.7547 24.0357 25.6996C17.8062 29.2962 9.9007 27.2657 6.37815 21.1645C2.85559 15.0632 5.04994 7.2016 11.2794 3.60504C12.9159 2.66017 14.6682 2.10367 16.4262 1.90733Z"
        fill="#E2E2E2"
      />
    </g>
    <ellipse
      cx="7.5381"
      cy="13.9902"
      rx="3.15236"
      ry="1.28668"
      transform="rotate(73.3884 7.5381 13.9902)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="11.3307"
      cy="23.4307"
      rx="3.15236"
      ry="1.28668"
      transform="rotate(46.7975 11.3307 23.4307)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="20.7236"
      cy="23.4307"
      rx="3.15236"
      ry="1.28668"
      transform="rotate(46.7975 20.7236 23.4307)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="13.317"
      cy="17.4172"
      rx="2.29257"
      ry="0.935743"
      transform="rotate(46.7975 13.317 17.4172)"
      fill="#C8C8C8"
    />
    <ellipse
      cx="11.3869"
      cy="6.99337"
      rx="2.29257"
      ry="0.935743"
      transform="rotate(46.7975 11.3869 6.99337)"
      fill="#C8C8C8"
    />
    <g filter="url(#filter1_b_105_7738)">
      <path
        d="M20.777 25.6454C20.8265 25.3644 20.8523 25.0752 20.8523 24.7801C20.8523 22.0193 18.5934 19.7812 15.8069 19.7812C13.7353 19.7812 11.9553 21.0182 11.1783 22.7872C10.5488 22.2487 9.73197 21.9236 8.83932 21.9236C6.84895 21.9236 5.23543 23.54 5.23543 25.5339C5.23543 25.6449 5.24043 25.7548 5.25022 25.8633C4.29289 26.3278 3.6337 27.3027 3.6337 28.4301C3.6337 30.0077 4.92451 31.2866 6.51681 31.2866H20.1315C21.7238 31.2866 23.0146 30.0077 23.0146 28.4301C23.0146 27.0723 22.0585 25.9358 20.777 25.6454Z"
        fill="#54516D"
        fill-opacity="0.8"
      />
    </g>
    <g filter="url(#filter2_b_105_7738)">
      <path
        d="M34.7623 8.79778C34.8119 8.5167 34.8377 8.22756 34.8377 7.93245C34.8377 5.17166 32.5787 2.93359 29.7922 2.93359C27.7207 2.93359 25.9407 4.1705 25.1637 5.93954C24.5342 5.40107 23.7173 5.07596 22.8247 5.07596C20.8343 5.07596 19.2208 6.69234 19.2208 8.68624C19.2208 8.79727 19.2258 8.90713 19.2356 9.01561C18.2782 9.48019 17.619 10.455 17.619 11.5824C17.619 13.16 18.9099 14.4389 20.5022 14.4389H34.1169C35.7092 14.4389 37 13.16 37 11.5824C37 10.2247 36.0439 9.08817 34.7623 8.79778Z"
        fill="#54516D"
        fill-opacity="0.8"
      />
    </g>
    <defs>
      <filter
        id="filter0_i_105_7738"
        x="4.69751"
        y="1.9082"
        width="23.3818"
        height="26.0108"
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
        <feOffset dy="0.440476" />
        <feGaussianBlur stdDeviation="0.440476" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_105_7738"
        />
      </filter>
      <filter
        id="filter1_b_105_7738"
        x="0.660575"
        y="16.808"
        width="25.3273"
        height="17.4523"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feGaussianBlur in="BackgroundImageFix" stdDeviation="1.48661" />
        <feComposite
          in2="SourceAlpha"
          operator="in"
          result="effect1_backgroundBlur_105_7738"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_backgroundBlur_105_7738"
          result="shape"
        />
      </filter>
      <filter
        id="filter2_b_105_7738"
        x="14.6459"
        y="-0.0396204"
        width="25.3273"
        height="17.4523"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feGaussianBlur in="BackgroundImageFix" stdDeviation="1.48661" />
        <feComposite
          in2="SourceAlpha"
          operator="in"
          result="effect1_backgroundBlur_105_7738"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_backgroundBlur_105_7738"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

export default CustomIcon;
