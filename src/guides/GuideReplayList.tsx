import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import GoBackButton from "../components/GoBackButton";
import ProfileArrow from "../icons/ProfileArrow";
import { useGuide } from "./GuideProvider";
import { ALL_GUIDES } from "./guideConfigs";
import { GuideRole } from "./types";
import { Redirect } from 'react-router-dom';
import { useOptionalGuideV2 } from './v2/GuideProviderV2';

interface GuideReplayListProps {
  role: GuideRole;
  titleKey?: string;
}

// Shared Settings page: lists a role's guides and lets the user replay any of
// them (restarts it ignoring the seen-check). Reused by Student, and by the
// combined Teacher/Parent profile page (filtered per-role there); Admin's
// single guide gets its own direct button instead (see Sidebar.tsx).
//
// A guide's steps point at real elements, not scripted fake data, so a guide
// that spotlights something outside this page cannot run from here.
// `replayGuide` reports that instead of activating an invisible guide, and the
// row explains it in place.
const GuideReplayList: React.FC<GuideReplayListProps> = ({ role, titleKey }) => {
  const { t } = useTranslation();
  const { replayGuide } = useGuide();
  const [unavailableGuideId, setUnavailableGuideId] = useState<string | null>(
    null,
  );

  const guides = ALL_GUIDES.filter((guide) => guide.role === role);
  const v2 = useOptionalGuideV2();
  if (role === 'Parent' && v2?.enabled && v2.context.experience === 'parent') return <Redirect to="/parent/help" />;

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
                onClick={() =>
                  setUnavailableGuideId(replayGuide(guide.id) ? null : guide.id)
                }
                className="flex flex-row-reverse items-center justify-between w-full p-3 text-start"
              >
                <ProfileArrow size={25} />
                <h2 className="text-black dark:text-white">{t(guide.titleKey)}</h2>
              </button>
              {unavailableGuideId === guide.id && (
                <p
                  role="status"
                  className="px-3 pb-2 text-sm leading-6 text-amber-700 dark:text-amber-400"
                >
                  {t("افتح هذه الجولة من صفحتها لتعمل.")}
                </p>
              )}
              <div className="h-0.5 bg-gray-200 rounded-lg dark:bg-gray-700" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GuideReplayList;
