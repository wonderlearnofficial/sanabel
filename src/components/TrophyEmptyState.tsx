import { useTranslation } from "react-i18next";

const TrophyEmptyState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center w-full px-6 py-10 text-center"
      dir="rtl"
    >
      <div
        className="flex items-center justify-center w-16 h-16 mb-4 text-3xl rounded-full bg-yellow-50"
        aria-hidden="true"
      >
        🏆
      </div>
      <h2 className="mb-2 text-lg font-bold text-gray-800">
        {t("لا توجد جوائز بعد")}
      </h2>
      <p className="max-w-xs text-sm leading-6 text-gray-500">
        {t("أكمل التحديات لتحصل على جوائزك الأولى")}
      </p>
    </div>
  );
};

export default TrophyEmptyState;
