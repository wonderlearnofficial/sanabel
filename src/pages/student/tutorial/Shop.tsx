import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import i18n from "../../../i18n";
import { useTranslation } from "react-i18next";

// Import images (using placeholders since actual paths aren't available)
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import waterImg from "../../../assets/resources/ماء.png";
import fertilizerImg from "../../../assets/resources/سماد.png";
import shopping from "../../../assets/shop-icon-3-624730632.png";

const Shop: React.FC<{
  seIsShopDone: (index: boolean) => void;
  isShopDone: boolean;
}> = ({ seIsShopDone, isShopDone }) => {
  const [boughtWater, setBoughtWater] = useState(false);
  const [boughtFertilizer, setBoughtFertilizer] = useState(false);
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);
  const [showPurchaseEffect, setShowPurchaseEffect] = useState<{
    type: string;
    amount: number;
  } | null>(null);

  // Track previous values for animation
  const [prevInventory, setPrevInventory] = useState({
    blueSanabel: 50,
    redSanabel: 50,
    yellowSanabel: 50,
    water: 0,
    fertilizer: 0,
  });

  const calculateCount = () => {
    if (boughtWater && boughtFertilizer) return 0;
    if (boughtWater) return 30;
    if (boughtFertilizer) return 20;
    return 50;
  };

  // Update previous inventory after animation completes
  useEffect(() => {
    const current = {
      blueSanabel: calculateCount(),
      redSanabel: calculateCount(),
      yellowSanabel: calculateCount(),
      water: boughtWater ? 1 : 0,
      fertilizer: boughtFertilizer ? 1 : 0,
    };

    const timeout = setTimeout(() => {
      setPrevInventory(current);
      setAnimatingItem(null);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [boughtWater, boughtFertilizer]);

  const inventory = [
    {
      icon: blueSanabel,
      name: "سنبلة",
      color: "bg-blue-100",
      textColor: "text-blue-800",
      id: "blueSanabel",
      count: calculateCount(),
      prevCount: prevInventory.blueSanabel,
    },
    {
      icon: redSanabel,
      name: "سنبلة",
      color: "bg-red-100",
      textColor: "text-red-800",
      id: "redSanabel",
      count: calculateCount(),
      prevCount: prevInventory.redSanabel,
    },
    {
      icon: yellowSanabel,
      name: "سنبلة",
      color: "bg-yellow-100",
      textColor: "text-yellow-800",
      id: "yellowSanabel",
      count: calculateCount(),
      prevCount: prevInventory.yellowSanabel,
    },
    {
      icon: waterImg,
      name: "مياه",
      color: "bg-blue-100",
      textColor: "text-blue-800",
      id: "water",
      count: boughtWater ? 1 : 0,
      prevCount: prevInventory.water,
    },
    {
      icon: fertilizerImg,
      name: "سماد",
      color: "bg-brown-100",
      textColor: "text-brown-800",
      id: "fertilizer",
      count: boughtFertilizer ? 1 : 0,
      prevCount: prevInventory.fertilizer,
    },
  ];

  const handlePurchase = (type: string) => {
    // Show visual feedback
    setAnimatingItem(type);

    if (type === "water") {
      setBoughtWater(true);
      setShowPurchaseEffect({ type: "water", amount: 1 });

      // Also show resource decrease
      setTimeout(() => {
        setShowPurchaseEffect({ type: "sanabel", amount: -20 });
      }, 500);

      if (boughtFertilizer) seIsShopDone(true);
    } else {
      setBoughtFertilizer(true);
      setShowPurchaseEffect({ type: "fertilizer", amount: 1 });

      // Also show resource decrease
      setTimeout(() => {
        setShowPurchaseEffect({ type: "sanabel", amount: -30 });
      }, 500);

      if (boughtWater) seIsShopDone(true);
    }

    // Clear effects after animation
    setTimeout(() => {
      setShowPurchaseEffect(null);
    }, 1500);
  };

  const purchaseOptions = [
    {
      icon: waterImg,
      name: "مياه",
      description: "احصل على مياه لري السنابل الخاصة بك",
      action: () => handlePurchase("water"),
      isBought: boughtWater,
      type: "water",
      cost: 20,
    },
    {
      icon: fertilizerImg,
      name: "سماد",
      description: "عزز نمو وإنتاجية سنابلك",
      action: () => handlePurchase("fertilizer"),
      isBought: boughtFertilizer,
      type: "fertilizer",
      cost: 30,
    },
  ];

  const { t } = useTranslation();

  const itemVariants = {
    hidden: { opacity: 0, scale: 1 },
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
        staggerChildren: 0.1,
      },
    },
  };

  // Animation for count changes
  const countVariants = {
    initial: { opacity: 0, y: -20, scale: 0 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0 },
  };

  // Effects that fly from purchase to inventory
  const purchaseEffectVariants = {
    initial: (index: number) => ({
      opacity: 0,
      scale: 0,
      x: index === 0 ? -100 : 100,
      y: 100,
    }),
    animate: {
      opacity: [0, 1, 1, 0.8, 0],
      scale: [0, 1.2, 1, 0.8, 0],
      x: 0,
      y: -100,
      transition: { duration: 1 },
    },
  };

  return (
    <motion.div
      className="relative flex flex-col items-center justify-between w-full h-full gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Purchase effect animation */}
      <AnimatePresence>
        {showPurchaseEffect && (
          <motion.div
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            variants={purchaseEffectVariants}
            custom={showPurchaseEffect.type === "water" ? 0 : 1}
          >
            <div className="flex flex-col items-center">
              <img
                src={
                  showPurchaseEffect.type === "water"
                    ? waterImg
                    : showPurchaseEffect.type === "fertilizer"
                    ? fertilizerImg
                    : blueSanabel
                }
                className="w-auto h-16"
                alt="Purchase effect"
              />
              <div
                className={`text-2xl font-bold ${
                  showPurchaseEffect.amount > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {showPurchaseEffect.amount > 0 ? "+" : ""}
                {showPurchaseEffect.amount}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.div
        className="w-full text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src={shopping}
          alt="Shop"
          className="w-24 h-24 mx-auto mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: 1,
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <h1 className="mb-4 text-3xl font-bold text-black/80">{t("المتجر")}</h1>
        {!isShopDone && (
          <motion.p
            initial={{ opacity: 1, scale: 0.95, y: -1 }}
            animate={{
              opacity: [1, 0.8, 1],
              scale: [1, 1.05, 1],
              y: [0, -2, 0],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="mx-auto text-xl font-bold text-blueprimary"
          >
            {t("قم بشراء المياه والسماد")}
          </motion.p>
        )}
      </motion.div>

      {/* Inventory Section */}
      <div className="flex flex-col w-full gap-1 p-4">
        <h1 className="text-black text-end text-md">
          {t("الموارد الخاصة بك")}
        </h1>
        <motion.div
          className="flex justify-between w-full p-2 shadow-md rounded-2xl bg-gray-50"
          variants={parentVariants}
          initial="hidden"
          animate="visible"
        >
          {inventory.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`w-1/6 h-[80px] flex flex-col items-center rounded-lg p-1 text-sm
                ${
                  animatingItem === item.id
                    ? "ring-2 ring-offset-2 ring-cyan-500"
                    : ""
                }`}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-[#666]">{t(item.name)}</h1>
              <img
                className={`h-2/5 ${
                  animatingItem === item.id ? "animate-bounce" : ""
                }`}
                src={item.icon}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={item.count}
                  className="relative"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={countVariants}
                >
                  <h1
                    className={`text-[#666] self-center ${
                      item.count > item.prevCount
                        ? "text-green-600 font-bold"
                        : item.count < item.prevCount
                        ? "text-red-600 font-bold"
                        : ""
                    }`}
                  >
                    x{item.count}
                  </h1>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Purchase Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid w-full grid-cols-2 gap-4 px-4"
      >
        {purchaseOptions.map((option, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center gap-2 p-4 text-center border border-gray-100 shadow-md rounded-2xl"
            whileHover={
              !option.isBought
                ? {
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }
                : {}
            }
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.img
              src={option.icon}
              alt={option.name}
              className="w-auto h-16"
              animate={
                !option.isBought
                  ? {
                      y: [0, -5, 0],
                      scale: [1, 1.05, 1],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <h3
              className={`font-bold text-lg mb-2 ${
                index === 0 ? "text-blue-600" : "text-amber-700"
              }`}
            >
              {t(option.name)}
            </h3>

            {/* Cost visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="grid w-full grid-cols-3 gap-2 p-2 rounded-lg bg-gray-50"
            >
              {inventory.slice(0, 3).map((resource, idx) => (
                <motion.div
                  key={idx}
                  className="flex flex-col items-center p-1 text-center rounded-md"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={resource.icon}
                    alt={resource.name}
                    className="w-auto h-8 mb-1"
                  />
                  <h1 className="text-[#666] text-xs font-medium">
                    {index === 0 ? "20" : "30"}
                  </h1>
                </motion.div>
              ))}
            </motion.div>

            {/* Purchase Button */}
            {!option.isBought ? (
              <motion.button
                initial={{ scale: 0.95 }}
                animate={{
                  scale: [0.95, 1, 0.95],
                  boxShadow: [
                    "0 4px 6px rgba(0,0,0,0.1)",
                    "0 10px 15px rgba(0,0,0,0.2)",
                    "0 4px 6px rgba(0,0,0,0.1)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-center p-2 shadow-md w-full rounded-xl text-white font-medium ${
                  index === 0
                    ? "bg-gradient-to-t from-[#4AAAD6] to-[#8ED6F8]"
                    : "bg-gradient-to-t from-[#7F4333] to-[#b46a56]"
                } `}
                onClick={option.action}
              >
                <h1 className="">{t("اشتري")}</h1>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex-center p-2 text-md w-full rounded-xl border ${
                  index === 0
                    ? "text-[#4AAAD6] border-[#4AAAD6] bg-blue-50"
                    : "text-[#7F4333] border-[#7F4333] bg-amber-50"
                } `}
              >
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("تم الشراء")}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Success message when both items are purchased */}
      <AnimatePresence>
        {isShopDone && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed inset-0 z-20 flex items-center justify-center px-3 pointer-events-none top-1/3 bg-white/20"
          >
            <motion.div
              className="flex-col w-full gap-2 p-4 text-center border-2 border-green-500 shadow-xl bg-green-50 h-1/3 flex-center rounded-xl"
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0px 0px 0px rgba(0,0,0,0.1)",
                  "0px 0px 20px rgba(0,200,0,0.3)",
                  "0px 0px 0px rgba(0,0,0,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="mx-auto mb-2 text-4xl text-green-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 359] }}
                transition={{ type: "spring", duration: 1 }}
              >
                ✓
              </motion.div>
              <h2 className="text-xl font-bold text-green-700">{t("أحسنت")}</h2>
              <p className="text-green-600">{t("تم الشراء بنجاح")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Shop;
