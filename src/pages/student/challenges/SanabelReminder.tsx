import { useTranslation } from "react-i18next";
import { useState } from "react";
import { delay, motion } from "framer-motion";
import { useHistory } from "react-router-dom";

import reminderImg from "../../../assets/توصيات عامة.svg";

const SanabelType: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  localStorage.setItem("sanabelReminder", "true");

  const [reminderPopup, setReminderPopup] = useState(
    localStorage.getItem("sanabelReminder") === "true"
  );

  const reminderData = [
    "️اختر عددًا من التحديات اليومية والأسبوعية بحسب وقتك وظروفك",
    "اجعل الهدف الرئيسي هو الإحسان في كل عمل تقوم به لتترك أثرًا إيجابيًا في نفسك ومحيطك",
    "الحرص على التوازن بين العلاقات وعدم إهمال أي جانب",
    "التدرج في الأهداف وتجنب إرهاق النفس في بداية التحدي",
  ];

  const handleStartClick = () => {
    setReminderPopup(false);
    localStorage.setItem("sanabelReminder", "false");
  };

  const popupVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.5,
      },
    },
    exit: { y: "100%", opacity: 0, transition: { duration: 0.5 } },
  };

  const listItemVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: (index: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: index * 0.2, duration: 0.5 },
    }),
  };

  return (
    <div
      className="flex flex-col items-center justify-between w-full h-full p-4 px-3 "
      id="page-height"
    >
      {/* Popup */}
      {reminderPopup && (
        <motion.div
          className="absolute bottom-0 z-30 flex flex-col items-center justify-between w-full h-screen p-4 bg-white rounded-t-3xl"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupVariants}
        >
          {/* Image */}
          <motion.img
            src={reminderImg}
            alt="Reminder"
            style={{ width: "150px" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.5,
            }}
          />

          {/* Title */}
          <motion.h1
            className="text-2xl font-bold text-black"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {t("توصيات عامة")}
          </motion.h1>

          {/* List Items */}
          <div className="flex flex-col items-end gap-2">
            {reminderData.map((item, index) => (
              <motion.div
                key={index}
                className="flex gap-2"
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
              >
                <p className="text-end text-[#333]">{t(item)}</p>
                <p>⭐</p>
              </motion.div>
            ))}
          </div>

          {/* Button */}
          <motion.div
            className="w-full p-3 text-white bg-blueprimary rounded-2xl flex-center"
            onClick={handleStartClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {t("أبدا")}
          </motion.div>
        </motion.div>
      )}
      {/* Popup */}
    </div>
  );
};

export default SanabelType;
