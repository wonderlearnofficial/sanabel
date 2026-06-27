import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { motion } from "framer-motion";
import xpIcon from "../../../assets/resources/اكس بي.png";

const StudentTutorial: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <motion.div
      className="flex-center gap-4 flex-col w-full  flex items-center justify-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Icon */}
      <motion.img
        src={xpIcon}
        alt="XP Icon"
        className="w-28"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1.1 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1.5,
          ease: "easeInOut",
        }}
      />

      {/* Animated Header Text */}
      <motion.h1
        className="text-2xl font-bold text-center text-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {t("اجمع نقاط الخبرة لترتفع في المستوى!")}
      </motion.h1>

      {/* Animated Subtext */}
      <motion.h2
        className="text-lg text-center text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.5,
          duration: 1,
          ease: "easeInOut",
        }}
      >
        {t("كلما لعبت أكثر، زادت مكافآتك")}
      </motion.h2>
    </motion.div>
  );
};

export default StudentTutorial;
