import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import GetAvatar from "../pages/student/tutorial/GetAvatar";
import { useUserContext } from "../context/StudentUserProvider";

// Define the type for the component props
interface GreetingProps {
  name: string;
  text: string;
  hello?: string; // Optional prop
}

const Greeting: React.FC<GreetingProps> = ({ name, text, hello }) => {
  const { t } = useTranslation();

  const { user } = useUserContext();
  const avatar = user?.profileImg;

  return (
    <div className="gap-3 p-0 flex-center">
      <div className="gap-3 flex-center">
        <div className="w-16 h-16">
          <GetAvatar userAvatarData={avatar ?? {}} />
        </div>{" "}
        <div className="flex flex-col ">
          <h1 className="text-[#040415] dark:text-white">
            {hello === "yes" && t("مرحباً")} {name}
          </h1>
          <h2 className="text-[#B3B3B3]">{t(text)}</h2>
        </div>
      </div>
    </div>
  );
};

export default Greeting;
