import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Import avatar components correctly
import Boy1 from "../../../assets/avatars/Boys/Boy1";
import Boy2 from "../../../assets/avatars/Boys/Boy2";
import Boy3 from "../../../assets/avatars/Boys/Boy3";
import Boy4 from "../../../assets/avatars/Boys/Boy4";
import Boy5 from "../../../assets/avatars/Boys/Boy5";
import Boy6 from "../../../assets/avatars/Boys/Boy6";
import Boy7 from "../../../assets/avatars/Boys/Boy7";
import Boy8 from "../../../assets/avatars/Boys/Boy8";

import Man1 from "../../../assets/avatars/Boys/Man1";
import Man2 from "../../../assets/avatars/Boys/Man2";
import Man3 from "../../../assets/avatars/Boys/Man3";
import Man4 from "../../../assets/avatars/Boys/Man4";
import Man5 from "../../../assets/avatars/Boys/Man5";
import Man6 from "../../../assets/avatars/Boys/Man6";
import Man7 from "../../../assets/avatars/Boys/Man7";
import Man8 from "../../../assets/avatars/Boys/Man8";

import Girl1 from "../../../assets/avatars/Girls/Girl1";
import Girl2 from "../../../assets/avatars/Girls/Girl2";
import Girl3 from "../../../assets/avatars/Girls/Girl3";
import Girl4 from "../../../assets/avatars/Girls/Girl4";
import Girl5 from "../../../assets/avatars/Girls/Girl5";
import Girl6 from "../../../assets/avatars/Girls/Girl6";
import Girl7 from "../../../assets/avatars/Girls/Girl7";
import Girl8 from "../../../assets/avatars/Girls/Girl8";

import Woman1 from "../../../assets/avatars/Girls/Woman1";
import Woman2 from "../../../assets/avatars/Girls/Woman2";
import Woman3 from "../../../assets/avatars/Girls/Woman3";
import Woman4 from "../../../assets/avatars/Girls/Woman4";
import Woman5 from "../../../assets/avatars/Girls/Woman5";
import Woman6 from "../../../assets/avatars/Girls/Woman6";
import Woman7 from "../../../assets/avatars/Girls/Woman7";
import Woman8 from "../../../assets/avatars/Girls/Woman8";

import { IoSparkles } from "react-icons/io5";
import { GiMale, GiFemale } from "react-icons/gi";

import { FaTshirt } from "react-icons/fa";
import { FaPaintBrush } from "react-icons/fa";
import { MdOutlineWallpaper } from "react-icons/md";
import { IoCheckmarkCircle } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { MdPalette } from "react-icons/md";

// Define interfaces for our avatar components
interface CustomIconProps {
  tshirtColor?: string;
  hairColor?: string;
  skinColor?: string;
  className?: string;
}

// Define avatar types for easier manipulation
interface AvatarOption {
  id: number;
  Component: React.FC<CustomIconProps>;
}

// Group avatars by category with proper typing
const boysAvatars: AvatarOption[] = [
  {
    id: 0,
    Component: Boy1,
  },
  {
    id: 1,
    Component: Boy2,
  },
  {
    id: 2,
    Component: Boy3,
  },
  {
    id: 3,
    Component: Boy4,
  },
  {
    id: 4,
    Component: Boy5,
  },
  {
    id: 5,
    Component: Boy6,
  },
  {
    id: 6,
    Component: Boy7,
  },
  {
    id: 7,
    Component: Boy8,
  },
  {
    id: 8,
    Component: Man1,
  },
  {
    id: 9,
    Component: Man2,
  },
  {
    id: 10,
    Component: Man3,
  },
  {
    id: 11,
    Component: Man4,
  },
  {
    id: 12,
    Component: Man5,
  },
  {
    id: 13,
    Component: Man6,
  },
  {
    id: 14,
    Component: Man7,
  },
  {
    id: 15,
    Component: Man8,
  },
];

const girlsAvatars: AvatarOption[] = [
  {
    id: 0,
    Component: Girl1,
  },
  {
    id: 1,
    Component: Girl2,
  },
  {
    id: 2,
    Component: Girl3,
  },
  {
    id: 3,
    Component: Girl4,
  },
  {
    id: 4,
    Component: Girl5,
  },
  {
    id: 5,
    Component: Girl6,
  },
  {
    id: 6,
    Component: Girl7,
  },
  {
    id: 7,
    Component: Girl8,
  },
  {
    id: 8,
    Component: Woman1,
  },
  {
    id: 9,
    Component: Woman2,
  },
  {
    id: 10,
    Component: Woman3,
  },
  {
    id: 11,
    Component: Woman4,
  },
  {
    id: 12,
    Component: Woman5,
  },
  {
    id: 13,
    Component: Woman6,
  },
  {
    id: 14,
    Component: Woman7,
  },
  {
    id: 15,
    Component: Woman8,
  },
];

// Enhanced color palettes with exactly 8 colors per category
const hairColors = [
  { color: "#000000", name: "أسود" }, // Black
  { color: "#2C2C2C", name: "أسود فحمي" }, // Charcoal Black
  { color: "#4B3621", name: "بني داكن" }, // Dark Brown
  { color: "#654321", name: "بني محروق" }, // Burnt Brown
  { color: "#8B4513", name: "بني متوسط" }, // Medium Brown
  { color: "#A0522D", name: "بني فاتح" }, // Light Brown
  { color: "#CD853F", name: "بني ذهبي" }, // Golden Brown
  { color: "#D2B48C", name: "أشقر" }, // Blonde
  { color: "#E6BE8A", name: "أشقر فاتح" }, // Light Blonde
  { color: "#F5DEB3", name: "أشقر ذهبي" }, // Golden Blonde
  { color: "#A52A2A", name: "كستنائي" }, // Auburn
  { color: "#8B0000", name: "كستنائي داكن" }, // Dark Auburn
  { color: "#FF6347", name: "أحمر" }, // Reddish Brown
  { color: "#CD5C5C", name: "أحمر نحاسي" }, // Copper Red
  { color: "#708090", name: "رمادي" }, // Gray
  { color: "#C0C0C0", name: "فضي" }, // Silver/Gray
];

const shirtColors = [
  { color: "#FFFFFF", name: "أبيض" }, // White
  { color: "#F5F5F5", name: "أبيض مائل للرمادي" }, // Off-White
  { color: "#000000", name: "أسود" }, // Black
  { color: "#36454F", name: "أسود فحمي" }, // Charcoal Black
  { color: "#1E90FF", name: "أزرق" }, // Dodger Blue
  { color: "#4169E1", name: "أزرق ملكي" }, // Royal Blue
  { color: "#FF4500", name: "برتقالي" }, // Orange Red
  { color: "#FF8C00", name: "برتقالي ذهبي" }, // Dark Orange
  { color: "#32CD32", name: "أخضر" }, // Lime Green
  { color: "#228B22", name: "أخضر غابة" }, // Forest Green
  { color: "#FFD700", name: "ذهبي" }, // Gold
  { color: "#DAA520", name: "ذهبي داكن" }, // Goldenrod
  { color: "#8A2BE2", name: "بنفسجي" }, // Blue Violet
  { color: "#9400D3", name: "بنفسجي داكن" }, // Dark Violet
  { color: "#FF69B4", name: "وردي" }, // Hot Pink
  { color: "#FF1493", name: "وردي غامق" }, // Deep Pink
];

const backgrounds = [
  { color: "#2196F3", name: "أزرق ملكي" }, // Royal Blue
  { color: "#BBDEFB", name: "أزرق باهت" }, // Pale Blue
  { color: "#FF80AB", name: "وردي زاهي" }, // Hot Pink
  { color: "#F8BBD0", name: "وردي حريري" }, // Silky Pink
  { color: "#FFEB3B", name: "أصفر ذهبي" }, // Golden Yellow
  { color: "#FFF176", name: "أصفر مشع" }, // Radiant Yellow
  { color: "#E1BEE7", name: "أرجواني خفيف" }, // Soft Lavender
  { color: "#CE93D8", name: "أرجواني وردي" }, // Orchid Pink
  { color: "#4CAF50", name: "أخضر زمردي" }, // Emerald Green
  { color: "#A5D6A7", name: "أخضر نعناعي" }, // Mint Green
  { color: "#FF7043", name: "برتقالي غروب الشمس" }, // Sunset Orange
  { color: "#FFAB91", name: "برتقالي وردي" }, // Coral Orange
  { color: "#7E57C2", name: "أرجواني ملكي" }, // Royal Purple
  { color: "#B39DDB", name: "أرجواني مخملي" }, // Velvet Purple
  { color: "#F44336", name: "أحمر بركاني" }, // Volcanic Red
  { color: "#EF9A9A", name: "وردي قرمزي" }, // Crimson Pink
];

// Define background patterns for the background tab
const backgroundPatterns = [
  { id: "solid", name: "لون واحد" },
  { id: "gradient", name: "تدرج" },
  { id: "dots", name: "نقاط" },
  { id: "lines", name: "خطوط" },
];

const skinColor = [
  { color: "#FFEFD5", name: "فاتح جداً" }, // Papaya Whip (Very Light)
  { color: "#FFF8DC", name: "أبيض كريمي" }, // Cornsilk (Cream)
  { color: "#FFDAB9", name: "فاتح" }, // Peachpuff (Light)
  { color: "#FFE4C4", name: "بيج" }, // Bisque (Light Beige)
  { color: "#EACBA1", name: "فاتح متوسط" }, // Medium Light
  { color: "#E3BC98", name: "ذهبي فاتح" }, // Light Golden
  { color: "#D6A57A", name: "متوسط" }, // Medium Skin
  { color: "#CBA375", name: "برونزي فاتح" }, // Light Bronze
  { color: "#C68A6D", name: "متوسط داكن" }, // Medium Dark
  { color: "#B87C59", name: "برونزي" }, // Bronze
  { color: "#A0522D", name: "داكن" }, // Dark Skin
  { color: "#956642", name: "بني نحاسي" }, // Copper Brown
  { color: "#8B4513", name: "داكن جداً" }, // Darker Skin
  { color: "#7B3F00", name: "بني محروق" }, // Burnt Umber
  { color: "#654321", name: "غامق جداً" }, // Very Dark
  { color: "#513620", name: "بني أسود" }, // Dark Chocolate
];

const Step1 = () => {
  const { t } = useTranslation();

  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(
    boysAvatars[0]
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Avatar customization state
  const [avatarState, setAvatarState] = useState({
    avatarId: 0,
    gender: gender,
    hairColor: "",
    tshirtColor: "",
    bgColor: gender === "boy" ? backgrounds[0].color : backgrounds[1].color,
    skinColor: "",
    bgPattern: backgroundPatterns[0].id,
  });

  useEffect(() => {
    localStorage.setItem("avatarData", JSON.stringify(avatarState));
  }, [avatarState]);

  console.log(avatarState);
  // Current active tab
  const [currentTab, setCurrentTab] = useState("الشخصية");

  // Toggle between boy and girl avatars

  const toggleGender = () => {
    const newGender = gender === "boy" ? "girl" : "boy";
    setGender(newGender);

    // Set default avatar ID for the selected gender
    const newAvatarId = 0; // Default to first avatar
    setSelectedAvatar(newGender === "boy" ? boysAvatars[0] : girlsAvatars[0]);

    // Update avatarState with the new gender, avatar ID, and appropriate background color
    setAvatarState((prev) => ({
      ...prev,
      gender: newGender,
      avatarId: newAvatarId, // Store ID instead of avatar object
      bgColor:
        newGender === "boy" ? backgrounds[0].color : backgrounds[2].color,
    }));

    // Trigger animation
    triggerAnimation();
  };
  // Get current avatar list based on gender
  const currentAvatarList = gender === "boy" ? boysAvatars : girlsAvatars;

  // Update any avatar property
  const updateAvatarProperty = (
    property: keyof typeof avatarState,
    value: string
  ) => {
    setAvatarState((prev) => ({ ...prev, [property]: value }));
    triggerAnimation();
  };

  // Trigger animation effect
  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // The tabs definition with added avatar tab
  const tabs = [
    { id: "الشخصية", title: "الشخصية", icon: <BsPerson className="text-lg" /> },
    { id: "الشعر", title: "الشعر", icon: <FaPaintBrush className="text-lg" /> },
    { id: "القميص", title: "القميص", icon: <FaTshirt className="text-lg" /> },
    {
      id: "الخلفية",
      title: "الخلفية",
      icon: <MdOutlineWallpaper className="text-lg" />,
    },
    {
      id: "البشرة",
      title: "البشرة",
      icon: <MdPalette className="text-lg" />,
    },
  ];

  // Helper function to generate a gradient string
  const getGradientString = (color: string) => {
    return `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(
      color,
      -30
    )} 100%)`;
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const getCurrentAvatarComponent = () => {
    const avatarList =
      avatarState.gender === "boy" ? boysAvatars : girlsAvatars;
    return (
      avatarList.find((avatar) => avatar.id === avatarState.avatarId)
        ?.Component ||
      (avatarState.gender === "boy"
        ? boysAvatars[0].Component
        : girlsAvatars[0].Component)
    );
  };

  const currentLanguage = localStorage.getItem("language");

  // Render content based on current tab
  const renderTabContent = () => {
    // Common style for all tab content containers
    const contentContainerStyle =
      "bg-white rounded-xl shadow-md p-2 w-full h-64 overflow-y-auto";

    if (currentTab === "الشخصية") {
      return (
        <motion.div
          className={contentContainerStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Avatars Gallery */}
          <AnimatePresence mode="wait">
            {/* Gender Toggle */}
            <motion.div
              className="flex justify-center gap-4 p-2 mb-1 rounded-full"
              whileHover={{ scale: 1.02 }}
              dir={currentLanguage === "en" ? "ltr" : "rtl"}
            >
              <button
                onClick={toggleGender}
                className={`px-5 py-2 flex items-center justify-center gap-1 rounded-full font-bold text-md transition-all duration-300 ${
                  gender === "boy"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <GiMale />
                {t("ولد")}
              </button>
              <button
                onClick={toggleGender}
                className={`px-5 py-2 flex items-center justify-center gap-1 rounded-full font-bold text-md transition-all duration-300 ${
                  gender === "girl"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <GiFemale />
                {t("بنت")}
              </button>
            </motion.div>
            <motion.div
              key={gender}
              initial={{ opacity: 0, x: gender === "boy" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: gender === "boy" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="grid grid-cols-4 gap-4"
                dir={currentLanguage === "en" ? "ltr" : "rtl"}
              >
                {currentAvatarList.map((avatar) => (
                  <motion.div
                    key={avatar.id}
                    className={`relative w-16 h-16 rounded-full cursor-pointer transition-all duration-200 ${
                      selectedAvatar.id === avatar.id
                        ? "ring-4 ring-yellow-400 scale-110"
                        : ""
                    }`}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setAvatarState((prev) => ({
                        ...prev,
                        avatarId: avatar.id,
                        tshirtColor: "",
                        hairColor: "",
                        skinColor: "",
                      }));
                      triggerAnimation();
                    }}
                  >
                    <div
                      className="w-full h-full overflow-hidden rounded-full"
                      style={{ backgroundColor: avatarState.bgColor }}
                    >
                      <avatar.Component
                        tshirtColor={undefined}
                        hairColor={undefined}
                        skinColor={undefined}
                      />
                    </div>
                    {selectedAvatar.id === avatar.id && (
                      <motion.div
                        className="absolute flex items-center justify-center w-6 h-6 text-xs text-white bg-green-500 rounded-full -top-1 -right-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <IoCheckmarkCircle size={16} />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      );
    } else if (currentTab === "القميص") {
      // Shirt tab with shirt icons and colors
      return (
        <motion.div
          className={contentContainerStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-4 gap-3">
            {shirtColors.map((colorOption, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.button
                  className={`w-full h-full border-[1px] rounded-lg relative flex items-center justify-center overflow-hidden ${
                    avatarState.tshirtColor === colorOption.color
                      ? "ring-3 ring-blue-400"
                      : ""
                  }`}
                  onClick={() =>
                    updateAvatarProperty("tshirtColor", colorOption.color)
                  }
                >
                  <FaTshirt
                    className="w-full h-full p-1 stroke-2 stroke-black"
                    style={{ color: colorOption.color }}
                  />

                  {avatarState.tshirtColor === colorOption.color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute p-1 text-white bg-blue-500 rounded-full"
                    >
                      <IoCheckmarkCircle size={16} />
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    } else if (currentTab === "الخلفية") {
      // Background tab with patterns and colors
      return (
        <motion.div
          className={contentContainerStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="mb-3 text-lg font-bold text-blueprimary">
            نمط الخلفية
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {backgroundPatterns.map((pattern) => (
              <motion.div
                key={pattern.id}
                className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer ${
                  avatarState.bgPattern === pattern.id
                    ? "bg-blue-100 ring-2 ring-blue-400"
                    : "bg-gray-50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateAvatarProperty("bgPattern", pattern.id)}
              >
                <div
                  className="w-10 h-10 mb-1 overflow-hidden rounded-md"
                  style={{
                    background:
                      pattern.id === "gradient"
                        ? getGradientString(avatarState.bgColor)
                        : pattern.id === "dots"
                        ? `radial-gradient(circle, ${avatarState.bgColor} 1px, transparent 1px) 0 0 / 10px 10px`
                        : pattern.id === "lines"
                        ? `repeating-linear-gradient(45deg, ${
                            avatarState.bgColor
                          }, ${
                            avatarState.bgColor
                          } 5px, ${adjustColorBrightness(
                            avatarState.bgColor,
                            20
                          )} 5px, ${adjustColorBrightness(
                            avatarState.bgColor,
                            20
                          )} 10px)`
                        : avatarState.bgColor,
                  }}
                ></div>
                <span className="text-xs font-medium text-[#999]">
                  {t(pattern.name)}
                </span>
              </motion.div>
            ))}
          </div>

          <h3 className="mb-3 text-lg font-bold text-blueprimary">
            {t("لون الخلفية")}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {backgrounds.map((bgOption, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.button
                  className={`w-12 h-12 rounded-md shadow-md relative flex items-center justify-center ${
                    avatarState.bgColor === bgOption.color
                      ? "ring-3 ring-blue-400"
                      : ""
                  }`}
                  style={{
                    background:
                      avatarState.bgPattern === "gradient"
                        ? getGradientString(bgOption.color)
                        : avatarState.bgPattern === "dots"
                        ? `radial-gradient(circle, ${bgOption.color} 2px, transparent 2px) 0 0 / 10px 10px`
                        : avatarState.bgPattern === "lines"
                        ? `repeating-linear-gradient(45deg, ${
                            bgOption.color
                          }, ${bgOption.color} 5px, ${adjustColorBrightness(
                            bgOption.color,
                            20
                          )} 5px, ${adjustColorBrightness(
                            bgOption.color,
                            20
                          )} 10px)`
                        : bgOption.color,
                  }}
                  onClick={() =>
                    updateAvatarProperty("bgColor", bgOption.color)
                  }
                >
                  {avatarState.bgColor === bgOption.color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute p-1 text-white bg-blue-500 rounded-full"
                    >
                      <IoCheckmarkCircle size={16} />
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    } else if (currentTab === "الشعر") {
      // Hair color tab
      return (
        <motion.div
          className={contentContainerStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="mb-3 text-lg font-bold text-blueprimary">
            {t("لون الشعر")}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {hairColors.map((colorOption, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.button
                  className={`w-12 h-12 rounded-full shadow-md relative flex items-center justify-center ${
                    avatarState.hairColor === colorOption.color
                      ? "ring-3 ring-blue-400"
                      : ""
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  onClick={() =>
                    updateAvatarProperty("hairColor", colorOption.color)
                  }
                >
                  {avatarState.hairColor === colorOption.color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white"
                    >
                      <IoCheckmarkCircle size={24} />
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    } else if (currentTab === "البشرة") {
      // Skin color tab
      return (
        <motion.div
          className={contentContainerStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="mb-3 text-lg font-bold text-blueprimary">
            {t("لون البشرة")}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {skinColor.map((colorOption, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.button
                  className={`w-12 h-12 rounded-full shadow-md relative flex items-center justify-center ${
                    avatarState.skinColor === colorOption.color
                      ? "ring-3 ring-blue-400"
                      : ""
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  onClick={() =>
                    updateAvatarProperty("skinColor", colorOption.color)
                  }
                >
                  {avatarState.skinColor === colorOption.color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white"
                    >
                      <IoCheckmarkCircle size={24} />
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-3 p-1">
      {/* Main Content */}
      <div className="flex flex-col items-center w-full gap-4 mx-auto">
        {/* Header */}
        <motion.div
          className="w-full text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-blueprimary" dir="ltr">
            {t("!اختر شخصيتك")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("صمم الشخصية المثالية للمغامرة")}
          </p>
        </motion.div>

        {/* Avatar Preview */}
        <motion.div
          className="relative w-44 h-44"
          whileHover={{ scale: 1.05 }}
          animate={
            isAnimating ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : {}
          }
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 transform rounded-full shadow-lg bg-gradient-to-br from-yellow-300 to-orange-400 -rotate-3"></div>
          <div className="absolute bg-white rounded-full shadow-inner inset-2"></div>
          {/* Avatar rendering with background color and pattern */}

          <div
            className="absolute overflow-hidden rounded-full inset-3"
            style={{
              background:
                avatarState.bgPattern === "gradient"
                  ? getGradientString(avatarState.bgColor)
                  : avatarState.bgPattern === "dots"
                  ? `radial-gradient(circle, ${
                      avatarState.bgColor
                    } 2px, ${adjustColorBrightness(
                      avatarState.bgColor,
                      30
                    )} 2px) 0 0 / 10px 10px`
                  : avatarState.bgPattern === "lines"
                  ? `repeating-linear-gradient(45deg, ${avatarState.bgColor}, ${
                      avatarState.bgColor
                    } 5px, ${adjustColorBrightness(
                      avatarState.bgColor,
                      20
                    )} 5px, ${adjustColorBrightness(
                      avatarState.bgColor,
                      20
                    )} 10px)`
                  : avatarState.bgColor,
            }}
          >
            {selectedAvatar && (
              <selectedAvatar.Component
                tshirtColor={avatarState.tshirtColor || undefined}
                hairColor={avatarState.hairColor || undefined}
                skinColor={avatarState.skinColor || undefined}
              />
            )}
          </div>
          {/* Decorative elements */}
          <motion.div
            className="absolute -top-1 -right-1 text-yellowprimary"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <IoSparkles className="w-6 h-6" />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-2 text-yellowprimary"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <IoSparkles className="w-6 h-6" />
          </motion.div>
        </motion.div>

        {/* Tab Navigation */}
        <div
          className="flex w-full p-2 bg-white shadow-md rounded-t-xl"
          dir={currentLanguage === "en" ? "ltr" : "rtl"}
        >
          <div className="grid w-full grid-cols-5 gap-1 grid-reversse">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
                  currentTab === tab.id
                    ? "bg-blue-100 text-blue-600 shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentTab(tab.id)}
              >
                <div className="mb-1 text-xl">{tab.icon}</div>
                <div className="text-xs font-medium">{t(tab.title)}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
      </div>
    </div>
  );
};

export default Step1;
