import { FaStar, FaMoon } from "react-icons/fa";
import { useTranslation } from "react-i18next";

type DarkModeComingSoonProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DarkModeComingSoon: React.FC<DarkModeComingSoonProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="relative w-full max-w-sm p-6 overflow-hidden bg-white rounded-lg dark:bg-gray-800"
        style={{ direction: "rtl" }}
      >
        {/* Animation elements */}
        <div className="absolute top-2 right-2 animate-ping">
          <FaStar className="text-yellow-400" size={12} />
        </div>
        <div className="absolute top-10 left-6 animate-bounce">
          <FaStar className="text-yellow-400" size={8} />
        </div>
        <div className="absolute bottom-8 right-8 animate-pulse">
          <FaStar className="text-yellow-400" size={10} />
        </div>

        {/* Moon animation */}
        <div className="flex justify-center w-full mb-4">
          <div className="animate-bounce">
            <FaMoon className="text-4xl text-purple-600" />
          </div>
        </div>

        <h2 className="mb-3 text-xl font-bold text-center text-gray-800 dark:text-white">
          {t("الوضع الليلي قادم قريباً")}
        </h2>

        <p className="mb-6 text-center text-gray-600 dark:text-gray-300">
          {t("نحن نعمل بجد لتوفير تجربة مظلمة مريحة للعينين. ترقبوا")}
        </p>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white transition-colors rounded-lg bg-blueprimary hover:bg-blue-600"
          >
            {t("حسناً، سأنتظر")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DarkModeComingSoon;
