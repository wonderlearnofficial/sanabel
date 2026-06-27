import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";

import missionImg from "../../../assets/target.png";
// Define the resources that can be earned
const resources = [
  {
    icon: blueSanabel,
    name: "سنبلة زرقاء",
    value: 2,
    color: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
  },
  {
    icon: redSanabel,
    name: "سنبلة حمراء",
    value: 2,
    color: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
  },
  {
    icon: yellowSanabel,
    name: "سنبلة صفراء",
    value: 2,
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
  },
];
const xpResource = {
  icon: xpIcon,
  name: "نقاط خبرة",
  value: 5,
  color: "bg-purple-100",
  textColor: "text-purple-700",
  borderColor: "border-purple-300",
};

// Animation variants for the container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

// Animation variants for each item
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const Rewards: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-col w-full h-full gap-6 py-4 flex-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-col w-full gap-4 text-center flex-center"
      >
        <motion.img
          src={missionImg}
          alt="Mission Target"
          className="object-contain w-24 h-24 mb-4 animate-pulse"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <motion.h1
          className="mb-3 text-3xl text-black font-boldtext-amber-800"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {t("مكافآت إكمال المهمة")}
        </motion.h1>
        <p className="w-5/6 mb-4 text-center text-gray-600" dir="ltr">
          {t("عند إكمال المهام، ستحصل على المكافآت الرائعة!")}
        </p>
      </motion.div>

      <motion.div
        className="flex-col w-full gap-4 flex-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="flex-col w-full gap-3 p-1 shadow-sm bg-gradient-to-br flex-center rounded-2xl "
          variants={itemVariants}
        >
          <div className="flex justify-between w-full gap-2">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                className={`flex-1 bg-white rounded-xl p-2 text-center shadow-sm border hover:shadow-md transition-all duration-300 ${resource.borderColor}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center h-16 mb-2">
                  <img
                    src={resource.icon}
                    alt={resource.name}
                    className="object-contain w-12 h-12"
                  />
                </div>
                <p className="w-full mb-2 text-xs text-gray-600">
                  {t(resource.name)}
                </p>
                <div
                  className={`
                  w-10 h-10 mx-auto rounded-full flex items-center justify-center 
                  ${resource.color} ${resource.borderColor} border-2
                `}
                >
                  <p className={`font-bold ${resource.textColor}`} dir="ltr">
                    +{resource.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          {/* XP Resource */}
          <motion.div
            variants={itemVariants}
            className={` p-4 rounded-2xl shadow-md border border-purple-200 flex items-center justify-between w-full ${xpResource.borderColor}`}
          >
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center 
                ${xpResource.color} ${xpResource.borderColor} border-2
                `}
            >
              <p className={`font-bold ${xpResource.textColor}`} dir="ltr">
                +{xpResource.value}
              </p>
            </div>
            <div className="flex items-center justify-between space-x-4 justi">
              <p className="w-full text-sm text-gray-700">
                {t(xpResource.name)}
              </p>
              <img
                src={xpResource.icon}
                alt={xpResource.name}
                className="object-contain w-12 h-12"
              />
              <div></div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Rewards;
