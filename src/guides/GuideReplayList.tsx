import React from "react";
import { useTranslation } from "react-i18next";
import GoBackButton from "../components/GoBackButton";
import ProfileArrow from "../icons/ProfileArrow";
import { useGuide } from "./GuideProvider";
import { ALL_GUIDES } from "./guideConfigs";
import { GuideRole } from "./types";

interface GuideReplayListProps {
  role: GuideRole;
  titleKey?: string;
}

// Shared Settings page: lists a role's guides and lets the user replay any of
// them (restarts it ignoring the seen-check). A guide's steps are
// self-contained scripted scenarios with their own fake data, so replaying
// doesn't need to navigate anywhere first. Reused by Student, and by the
// combined Teacher/Parent profile page (filtered per-role there); Admin's
// single guide gets its own direct button instead (see Sidebar.tsx).
const GuideReplayList: React.FC<GuideReplayListProps> = ({ role, titleKey }) => {
  const { t } = useTranslation();
  const { replayGuide } = useGuide();

  const guides = ALL_GUIDES.filter((guide) => guide.role === role);

  return (
    <div className="flex flex-col w-full h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between w-full gap-3">
        <GoBackButton />
        <h1 className="text-2xl font-bold text-black text-end dark:text-white" dir="ltr">
          {t(titleKey || "إعادة عرض الجولات التعريفية")}
        </h1>
        <div className="opacity-0 w-[45px]" />
      </div>

      <div className="flex flex-col w-full mt-6">
        {guides.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            {t("لا توجد جولات تعريفية متاحة بعد.")}
          </p>
        ) : (
          guides.map((guide) => (
            <div className="flex flex-col w-full" key={guide.id}>
              <button
                type="button"
                onClick={() => replayGuide(guide.id)}
                className="flex flex-row-reverse items-center justify-between w-full p-3 text-start"
              >
                <ProfileArrow size={25} />
                <h2 className="text-black dark:text-white">{t(guide.titleKey)}</h2>
              </button>
              <div className="h-0.5 bg-gray-200 rounded-lg dark:bg-gray-700" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GuideReplayList;
