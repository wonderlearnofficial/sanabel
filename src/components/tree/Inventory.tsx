import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/StudentUserProvider";

// Inventory Assets
import waterImg from "../../assets/resources/ماء.png";
import fertilizerImg from "../../assets/resources/سماد.png";
import redImg from "../../assets/resources/سنبلة حمراء.png";
import yellowImg from "../../assets/resources/سنبلة صفراء.png";
import blueImg from "../../assets/resources/سنبلة زرقاء.png";

interface Props {
  waterCount: number;
  fertilizerCount: number;
  blueCount: number;
  redCount: number;
  yellowCount: number;
}

const Inventory: React.FC<Props> = ({
  waterCount,
  fertilizerCount,
  blueCount,
  redCount,
  yellowCount,
}) => {
  const { t } = useTranslation();
  const { user } = useUserContext();

  const inventory = [
    { name: "سنبلة", img: blueImg, count: blueCount },
    { name: "سنبلة", img: yellowImg, count: yellowCount },
    { name: "سنبلة", img: redImg, count: redCount },
    { name: "سماد", img: fertilizerImg, count: fertilizerCount },
    { name: "ماء", img: waterImg, count: waterCount },
  ];

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const parentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger delay between children
      },
    },
  };

  return (
    <div className="flex flex-col w-full items-center justify-between shadow-md p-2 relative border-[1px] border-[#33333325] rounded-xl">
      <div className="flex flex-col w-full gap-1">
        <h1 className="text-lg text-black ">{t("الموارد الخاصة بك")}</h1>
        <motion.div
          className="flex justify-between w-full"
          variants={parentVariants}
          initial="hidden"
          animate="visible"
        >
          {inventory.map((items, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="w-1/6 h-[72px] sm:h-[80px] flex flex-col items-center rounded-lg bg-[#FFF8E5] p-1 text-xs sm:text-sm"
            >
              <h1 className="text-black">{t(items.name)}</h1>
              <img className="h-2/5" src={items.img} />
              <h1 className="text-[#E14E54] font-bold self-start">
                x{items.count}
              </h1>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Inventory;
