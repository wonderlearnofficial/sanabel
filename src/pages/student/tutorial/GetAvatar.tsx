import { API_BASE_URL } from "../../../config/api";
import React from "react";
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

import { useTranslation } from "react-i18next";
import axios from "axios";

const GetAvatar = ({ userAvatarData = {} }) => {
  const defaultAvatarData = {
    avatarId: 0,
    bgColor: "#2196F3",
    bgPattern: "solid",
    gender: "boy",
    hairColor: "",
    skinColor: "",
    tshirtColor: "",
  };

  // Compute avatarData directly from props
  const avatarData = {
    ...defaultAvatarData,
    ...userAvatarData,
  };

  const avatarComponents = {
    boy: [
      Boy1,
      Boy2,
      Boy3,
      Boy4,
      Boy5,
      Boy6,
      Boy7,
      Boy8,
      Man1,
      Man2,
      Man3,
      Man4,
      Man5,
      Man6,
      Man7,
      Man8,
    ],
    girl: [
      Girl1,
      Girl2,
      Girl3,
      Girl4,
      Girl5,
      Girl6,
      Girl7,
      Girl8,
      Woman1,
      Woman2,
      Woman3,
      Woman4,
      Woman5,
      Woman6,
      Woman7,
      Woman8,
    ],
  };

  const { t } = useTranslation();

  const adjustColorBrightness = (hex: any, percent: any) => {
    if (!hex || !hex.startsWith("#") || hex.length !== 7) {
      return "#000000";
    }

    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const getGradientString = (color: any) => {
    return `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(
      color,
      -30,
    )} 100%)`;
  };

  const getAvatarComponent = () => {
    const gender =
      avatarData.gender === "boy" || avatarData.gender === "girl"
        ? avatarData.gender
        : "boy";

    const avatarId =
      avatarData.avatarId !== undefined ? avatarData.avatarId : 0;
    const safeAvatarId = Math.min(
      Math.max(0, avatarId),
      avatarComponents[gender].length - 1,
    );

    return avatarComponents[gender][safeAvatarId];
  };

  const AvatarComponent = getAvatarComponent();

  const updatePhoto = async (token: any) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      console.error("No authentication token found.");
      return false;
    }

    if (!avatarData || !avatarData.avatarId) {
      console.error("Invalid avatar data.");
      return false;
    }

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/students/update-profile-image`,
        {
          profileImg: {
            avatarId: avatarData.avatarId,
            bgColor: avatarData.bgColor,
            bgPattern: avatarData.bgPattern,
            gender: avatarData.gender,
            hairColor: avatarData.hairColor,
            skinColor: avatarData.skinColor,
            tshirtColor: avatarData.tshirtColor,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        console.log("Profile image updated successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating profile image:", error);
      return false;
    }
  };

  return (
    <div
      className="w-full h-full overflow-y-auto rounded-full"
      style={{
        background:
          avatarData.bgPattern === "gradient"
            ? getGradientString(avatarData.bgColor)
            : avatarData.bgPattern === "dots"
            ? `radial-gradient(circle, ${
                avatarData.bgColor
              } 2px, ${adjustColorBrightness(
                avatarData.bgColor,
                30,
              )} 2px) 0 0 / 10px 10px`
            : avatarData.bgPattern === "lines"
            ? `repeating-linear-gradient(45deg, ${avatarData.bgColor}, ${
                avatarData.bgColor
              } 5px, ${adjustColorBrightness(
                avatarData.bgColor,
                20,
              )} 5px, ${adjustColorBrightness(avatarData.bgColor, 20)} 10px)`
            : avatarData.bgColor || "#2196F3",
      }}
    >
      {AvatarComponent && (
        <AvatarComponent
          tshirtColor={avatarData.tshirtColor || undefined}
          hairColor={avatarData.hairColor || undefined}
          skinColor={avatarData.skinColor || undefined}
        />
      )}
    </div>
  );
};

export default GetAvatar;
