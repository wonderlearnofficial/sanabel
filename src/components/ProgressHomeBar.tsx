import { useTranslation } from "react-i18next";

function ProgressHomeBar() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between p-3  rounded-xl relative bg-blueprimary w-full">
      <div className="w-16 h-16 rounded-full bg-white"></div>
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-right">{t("تقدم حسناتك")}</h1>
        <h1 className="text-white text-right">1000 حسنة</h1>
      </div>
    </div>
  );
}
export default ProgressHomeBar;
