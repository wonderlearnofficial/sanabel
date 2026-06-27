import React from "react";
import logo from "./assets/login/logo.png";
// Pick ONLY 4–6 avatars to showcase customization
import Boy1 from "./assets/avatars/Boys/Boy1";
import Boy4 from "./assets/avatars/Boys/Boy4";
import Girl2 from "./assets/avatars/Girls/Girl2";
import Girl5 from "./assets/avatars/Girls/Girl5";
import Woman2 from "./assets/avatars/Girls/Woman2";
import Man1 from "./assets/avatars/Boys/Man1";

interface AvatarProps {
  tshirtColor?: string;
  hairColor?: string;
  skinColor?: string;
}

const showcaseAvatars = [
  {
    name: "Avatar 1",
    Component: Boy1,
  },
  {
    name: "Avatar 2",
    Component: Boy4,
  },
  {
    name: "Avatar 6",
    Component: Man1,
  },
  {
    name: "Avatar 3",
    Component: Girl2,
  },
  {
    name: "Avatar 4",
    Component: Girl5,
  },
  {
    name: "Avatar 5",
    Component: Woman2,
  },
];

const hairColors = [
  "#000000",
  "#4B3621",
  "#8B4513",
  "#D2B48C",
  "#A52A2A",
  "#708090",
];

const shirtColors = [
  "#1E90FF",
  "#FF4500",
  "#32CD32",
  "#FFD700",
  "#8A2BE2",
  "#FF69B4",
];

const backgrounds = [
  "#2196F3",
  "#FF80AB",
  "#FFEB3B",
  "#4CAF50",
  "#7E57C2",
  "#FF7043",
];

const skinColors = ["#FFEFD5", "#FFDAB9", "#EACBA1", "#D6A57A", "#A0522D"];

const avatarThemes = [
  // Row 1 — colorful playful
  [
    {
      hairColor: "#2D1B10",
      tshirtColor: "#FF5A5F",
      skinColor: "#FFD8B4",
      background: {
        type: "gradient",
        colors: ["#FF9BCB", "#FF6BAA"],
      },
    },
    {
      hairColor: "#111111",
      tshirtColor: "#2D9CFF",
      skinColor: "#FFE5C2",
      background: {
        type: "solid",
        value: "#53A8FF",
      },
    },
    {
      hairColor: "#8B5A2B",
      tshirtColor: "#FFD93D",
      skinColor: "#E5B98C",
      background: {
        type: "lines",
        color: "#44C767",
      },
    },
    {
      hairColor: "#8A1C1C",
      tshirtColor: "#9B5DE5",
      skinColor: "#B7795D",
      background: {
        type: "solid",
        value: "#7A5AF8",
      },
    },
    {
      hairColor: "#D4A373",
      tshirtColor: "#06D6A0",
      skinColor: "#F1D3B2",
      background: {
        type: "lines",
        color: "#00B894",
      },
    },
    {
      hairColor: "#5A3825",
      tshirtColor: "#FF9F1C",
      skinColor: "#7A5230",
      background: {
        type: "gradient",
        colors: ["#7F5AF0", "#6246EA"],
      },
    },
  ],

  // Row 2 — softer colors
  [
    {
      hairColor: "#3B2A20",
      tshirtColor: "#00B4D8",
      skinColor: "#FFE0C1",
      background: {
        type: "gradient",
        colors: ["#90E0EF", "#48CAE4"],
      },
    },
    {
      hairColor: "#1A1A1A",
      tshirtColor: "#F15BB5",
      skinColor: "#FFD8B4",
      background: {
        type: "solid",
        value: "#FFAFCC",
      },
    },
    {
      hairColor: "#7A4E2B",
      tshirtColor: "#2EC4B6",
      skinColor: "#E0B287",
      background: {
        type: "dots",
        color: "#80ED99",
      },
    },
    {
      hairColor: "#A52A2A",
      tshirtColor: "#FEE440",
      skinColor: "#B7795D",
      background: {
        type: "gradient",
        colors: ["#F9C74F", "#F9844A"],
      },
    },
    {
      hairColor: "#D6A77A",
      tshirtColor: "#4361EE",
      skinColor: "#F3D5B5",
      background: {
        type: "lines",
        color: "#4CC9F0",
      },
    },
    {
      hairColor: "#2D2D2D",
      tshirtColor: "#FF006E",
      skinColor: "#8C5A3C",
      background: {
        type: "solid",
        value: "#8338EC",
      },
    },
  ],
];

const getBackgroundStyle = (bg: any) => {
  switch (bg.type) {
    case "gradient":
      return {
        background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`,
      };

    case "dots":
      return {
        background: `
          radial-gradient(rgba(255,255,255,0.35) 2px, transparent 2px),
          ${bg.color}
        `,
        backgroundSize: "16px 16px",
      };

    case "lines":
      return {
        background: `
          repeating-linear-gradient(
            45deg,
            rgba(255,255,255,.18),
            rgba(255,255,255,.18) 10px,
            transparent 10px,
            transparent 20px
          ),
          ${bg.color}
        `,
      };

    default:
      return {
        background: bg.value,
      };
  }
};

const AvatarShowcase = () => {
  return (
    <div className="flex-col w-full min-h-screen p-10 bg-white flex-center">
      <div className="mb-16 text-center">
        <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-[#7B8794] uppercase">
          Personalized Learning Experience
        </p>

        <h1 className="text-[56px] font-extrabold tracking-tight text-[#1F2937] leading-none">
          Character
          <span className="block text-[#4F8A6F]">Customization</span>
        </h1>

        <p className="max-w-2xl mx-auto mt-5 text-lg leading-relaxed text-gray-500">
          Personalized avatars with customizable hairstyles, clothing colors,
          skin tones, and backgrounds.
        </p>

        <img
          src={logo}
          alt="Sanabel Al Ihsan"
          className="object-contain mx-auto mt-8 h-44"
        />
      </div>

      <div className="space-y-8">
        {showcaseAvatars.map((avatar, index) => {
          const AvatarComponent = avatar.Component as React.FC<AvatarProps>;

          return (
            <div key={index}>
              <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
                {avatarThemes[index % avatarThemes.length].map(
                  (preset, variationIndex) => (
                    <div
                      key={variationIndex}
                      className="flex items-center justify-center w-32 h-32 transition-all duration-300  rounded-[32px]"
                    >
                      <div
                        className="w-[110px] h-[110px] overflow-hidden rounded-full  "
                        style={getBackgroundStyle(preset.background)}
                      >
                        <AvatarComponent
                          hairColor={preset.hairColor}
                          tshirtColor={preset.tshirtColor}
                          skinColor={preset.skinColor}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarShowcase;
