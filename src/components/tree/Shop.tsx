import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import trophy from "../../../assets/trophy.png";
import { ToastContainer, toast } from "react-toastify";

// Inventory Assets
import waterImg from "../../assets/resources/ماء.png";
import fertilizerImg from "../../assets/resources/سماد.png";

// Sanabel
import blueSanabel from "../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../assets/resources/اكس بي.png";
import { useUserContext } from "../../context/StudentUserProvider";

import CheckmarkAnimation from "../../assets/checkmarkAnimation";
import { treeStages } from "../../data/Tree";
import axios from "axios";

const Toaster = () => (
  <ToastContainer
    position="top-center"
    autoClose={1000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

const Shop: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUserData } = useUserContext();

  const shop = [
    { icon: blueSanabel },
    { icon: redSanabel },
    { icon: yellowSanabel },
  ];

  const waterCount = Number(user?.water);
  const fertilizerCount = Number(user?.fertilizer);

  const blueCount = Number(user?.snabelBlue);
  const redCount = Number(user?.snabelRed);
  const yellowCount = Number(user?.snabelYellow);

  const waterNeeded = Number(user?.waterNeeded);
  const fertilizerNeeded = Number(user?.fertilizerNeeded);

  //  المرحلة
  const treeStage = Number(user?.treeStage);
  const treeProgress = Number(user?.treeProgress);

  const waterCost = treeProgress == 1 ? 10 : 20;
  const fertilizerCost = treeProgress == 1 ? 15 : 30;

  const [buyWaterCount, setBuyWaterCount] = useState(0);
  const [buyFertilizerCount, setBuyFertilizerCount] = useState(0);

  // Calculate remaining needed resources
  const remainingWaterNeeded = Math.max(0, waterNeeded - waterCount);
  const remainingFertilizerNeeded = Math.max(
    0,
    fertilizerNeeded - fertilizerCount
  );

  // Check if tree progress is ready
  const [isProgressReady, setIsProgressReady] = useState(false);

  useEffect(() => {
    setIsProgressReady(
      waterCount >= waterNeeded && fertilizerCount >= fertilizerNeeded
    );
  }, [waterCount, fertilizerCount, waterNeeded, fertilizerNeeded]);

  function changeBuyWaterCount(operation: any) {
    if (operation === "-" && buyWaterCount !== 0) {
      setBuyWaterCount(buyWaterCount - 1);
    } else if (operation === "+" && buyWaterCount !== remainingWaterNeeded) {
      setBuyWaterCount(buyWaterCount + 1);
    } else if (operation === "+" && buyWaterCount === remainingWaterNeeded) {
      toast.warning(t("لقد وصلت إلى الحد الأقصى المطلوب من الماء"));
    }
  }

  function changeBuyFertilizerCount(operation: any) {
    if (operation === "-" && buyFertilizerCount !== 0) {
      setBuyFertilizerCount(buyFertilizerCount - 1);
    } else if (
      operation === "+" &&
      buyFertilizerCount !== remainingFertilizerNeeded
    ) {
      setBuyFertilizerCount(buyFertilizerCount + 1);
    } else if (
      operation === "+" &&
      buyFertilizerCount === remainingFertilizerNeeded
    ) {
      toast.warning(t("لقد وصلت إلى الحد الأقصى المطلوب من السماد"));
    }
  }

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isPurchaseConfirmed, setIsPurchaseConfirmed] = useState(false);
  const [isCelebrationVisible, setIsCelebrationVisible] = useState(false);
  const [isInsufficientFundsVisible, setIsInsufficientFundsVisible] =
    useState(false);
  const [missingSanabel, setMissingSanabel] = useState<any[]>([]);

  // Function to calculate missing sanabel
  const calculateMissingSanabel = (totalCost: number) => {
    const missing = [];
    let remainingCost = totalCost;

    // Check blue sanabel first (most valuable)
    if (remainingCost > 0) {
      const blueNeeded = Math.min(Math.ceil(remainingCost / 1), blueCount); // Assuming 1 blue = 1 unit
      const blueShortage = Math.ceil(remainingCost / 1) - blueCount;
      if (blueShortage > 0) {
        missing.push({
          type: "blue",
          icon: blueSanabel,
          name: t("سنبلة زرقاء"),
          needed: blueShortage,
          available: blueCount,
        });
        remainingCost -= blueCount * 1;
      } else {
        remainingCost = 0;
      }
    }

    // Check red sanabel
    if (remainingCost > 0) {
      const redNeeded = Math.min(Math.ceil(remainingCost / 1), redCount);
      const redShortage = Math.ceil(remainingCost / 1) - redCount;
      if (redShortage > 0) {
        missing.push({
          type: "red",
          icon: redSanabel,
          name: t("سنبلة حمراء"),
          needed: redShortage,
          available: redCount,
        });
        remainingCost -= redCount * 1;
      } else {
        remainingCost = 0;
      }
    }

    // Check yellow sanabel
    if (remainingCost > 0) {
      const yellowNeeded = Math.min(Math.ceil(remainingCost / 1), yellowCount);
      const yellowShortage = Math.ceil(remainingCost / 1) - yellowCount;
      if (yellowShortage > 0) {
        missing.push({
          type: "yellow",
          icon: yellowSanabel,
          name: t("سنبلة صفراء"),
          needed: yellowShortage,
          available: yellowCount,
        });
      }
    }

    return missing;
  };

  // Buy Shop
  const buyShop = async () => {
    try {
      const token = localStorage.getItem("token");
      const totalCost =
        buyFertilizerCount * fertilizerCost + buyWaterCount * waterCost;

      const response = await axios.patch(
        "https://sanabel.wonderlearn.net/students/buy-water-seeder",
        {
          water: buyWaterCount,
          seeders: buyFertilizerCount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setBuyWaterCount(0);
        setBuyFertilizerCount(0);
        setIsPopupVisible(false);
        setIsPurchaseConfirmed(true);
        setIsPopupVisible(false);
        setIsProgressReady(false);

        // Refresh user data to update UI with new resource counts
        await refreshUserData();

        // Reset purchase counts after successful purchase
        setTimeout(() => {
          setBuyWaterCount(0);
          setBuyFertilizerCount(0);
        }, 2000);
      }
    } catch (error) {
      const totalCost =
        buyFertilizerCount * fertilizerCost + buyWaterCount * waterCost;
      const missing = calculateMissingSanabel(totalCost);

      setMissingSanabel(missing);
      setIsPopupVisible(false);
      setIsInsufficientFundsVisible(true);

      console.error("Error purchasing items:", error);
    }
  };

  const progressTree = async () => {
    try {
      setIsPurchaseConfirmed(false);
      const token = localStorage.getItem("token");
      console.log(token);
      const response = await axios.patch(
        "https://sanabel.wonderlearn.net/students/grow-tree",
        {}, // Empty request body or you can add payload data here if needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setIsCelebrationVisible(true);
        // Refresh user data to show updated tree stage
      }
    } catch (error) {
      console.error("Error progress tree:", error);
    }
  };

  return (
    <div className="flex-col w-full h-full flex-center shadow-md p-2 border-[1px] border-[#33333325] rounded-xl">
      <div className="absolute">
        <Toaster />
      </div>
      {isProgressReady == false ? (
        <div className="flex flex-col w-full h-full gap-1">
          <h1 className="text-lg text-black text-start">{t("المتجر")}</h1>

          <div className="flex-col gap-2 bg-[#FFF8E5] rounded-xl w-full flex justify-between p-2">
            <div className="flex flex-row-reverse justify-between">
              <div className="flex-center">
                <div className="gap-1 p-1 bg-white flex-center rounded-3xl">
                  {" "}
                  <div
                    className="w-6 h-6 rounded-full flex-center bg-blueprimary"
                    onClick={() => changeBuyFertilizerCount("-")}
                  >
                    <h1 className="text-white"> -</h1>
                  </div>
                  <h1 className="text-black"> x{buyFertilizerCount}</h1>
                  <div
                    className="w-6 h-6 rounded-full flex-center bg-blueprimary"
                    onClick={() => changeBuyFertilizerCount("+")}
                  >
                    <h1 className="text-white"> +</h1>
                  </div>
                </div>
                <img src={fertilizerImg} alt="" className="w-auto h-8" />
              </div>
              <div className="flex-center">
                <div className="gap-1 p-1 bg-white flex-center rounded-3xl">
                  {" "}
                  <div
                    className="w-6 h-6 rounded-full flex-center bg-blueprimary"
                    onClick={() => changeBuyWaterCount("-")}
                  >
                    <h1 className="text-white"> -</h1>
                  </div>
                  <h1 className="text-black"> x{buyWaterCount}</h1>
                  <div
                    className="w-6 h-6 rounded-full flex-center bg-blueprimary"
                    onClick={() => changeBuyWaterCount("+")}
                  >
                    <h1 className="text-white"> +</h1>
                  </div>
                </div>
                <img src={waterImg} alt="" className="w-auto h-8" />
              </div>
            </div>
            {(buyWaterCount > 0 || buyFertilizerCount > 0) && (
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center justify-between w-full gap-2 p-3 bg-white border-2 rounded-3xl">
                  <div className="gap-2 flex-center">
                    {shop.map((item) => (
                      <div className="gap-1 flex-center">
                        <img
                          src={item.icon}
                          alt="icon"
                          className="w-auto h-8"
                        />
                        <h1 className="text-sm text-black">
                          x
                          {buyFertilizerCount * fertilizerCost +
                            buyWaterCount * waterCost}
                        </h1>
                      </div>
                    ))}
                  </div>
                  <h1 className="py-1 text-sm font-bold text-center text-black ">
                    {t("الاجمالي")}
                  </h1>
                </div>
                <div
                  className="w-full flex-center"
                  onClick={() => setIsPopupVisible(true)}
                >
                  <div className="w-1/3 ">
                    {" "}
                    <h1 className="py-2 text-sm text-center bg-blueprimary rounded-3xl">
                      {t("شراء")}
                    </h1>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Confirmation Popup */}
            {isPopupVisible && (
              <div className="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-70 flex-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-4/5 max-w-md p-6 text-center bg-white shadow-xl rounded-2xl"
                >
                  <h1 className="mb-4 text-xl font-bold text-black">
                    {t("تأكيد الشراء")}
                  </h1>

                  <div className="bg-[#FFF8E5] rounded-xl p-4 ">
                    <div className="flex items-center justify-center gap-8 my-3">
                      <div className="flex flex-col items-center">
                        <h2 className="mb-2 text-black text-md">{t("ماء")}</h2>
                        <div className="p-3 mb-2 bg-blue-100 rounded-full shadow-md">
                          <img
                            src={waterImg}
                            alt=""
                            className="object-contain w-14 h-14"
                          />
                        </div>
                        <div className="px-3 py-1 text-white bg-blue-500 rounded-full">
                          <h2 className="font-bold">x{buyWaterCount}</h2>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <h2 className="mb-2 text-black text-md">{t("سماد")}</h2>
                        <div className="p-3 mb-2 bg-green-100 rounded-full shadow-md">
                          <img
                            src={fertilizerImg}
                            alt=""
                            className="object-contain w-14 h-14"
                          />
                        </div>
                        <div className="px-3 py-1 text-white bg-green-500 rounded-full">
                          <h2 className="font-bold">x{buyFertilizerCount}</h2>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-between w-full gap-2 p-2 bg-gray-100/25 rounded-2xl">
                      <h1 className="font-bold text-center text-black text-md">
                        {t("الاجمالي")}
                      </h1>

                      <div className="gap-4 p-5 flex-center rounded-xl">
                        {shop.map((item) => (
                          <div className="gap-1 flex-center">
                            <img
                              src={item.icon}
                              alt="icon"
                              className="w-auto h-8"
                            />
                            <h1 className="text-sm text-black">
                              x
                              {buyFertilizerCount * fertilizerCost +
                                buyWaterCount * waterCost}
                            </h1>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mt-4">
                    <button
                      className="flex-1 px-6 py-3 font-bold text-white transition-transform transform shadow-md bg-blueprimary rounded-xl hover:scale-105 active:scale-95"
                      onClick={buyShop}
                    >
                      {t("تأكيد الشراء")}
                    </button>
                    <button
                      className="px-4 py-3 font-bold text-gray-700 transition-transform transform bg-white border-2 border-gray-300 shadow-sm rounded-xl hover:scale-105 active:scale-95"
                      onClick={() => setIsPopupVisible(false)}
                    >
                      {t("إلغاء")}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Insufficient Funds Popup */}
            {isInsufficientFundsVisible && (
              <div className="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-70 flex-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-4/5 max-w-md p-3 text-center bg-white shadow-xl rounded-2xl"
                >
                  <div className="mb-4 text-6xl text-red-600">!</div>
                  <h1 className="mb-4 text-xl font-bold text-red-600">
                    {t("رصيد غير كافي")}
                  </h1>

                  <p className="mb-4 text-gray-700">
                    {t("تحتاج إلى المزيد من السنابل لإتمام هذه العملية")}
                  </p>

                  <div className="p-2 mb-4 bg-red-50 rounded-xl">
                    <h3 className="mb-3 font-bold text-red-800">
                      {t("السنابل المطلوبة")}
                    </h3>

                    <div className="space-y-1">
                      {missingSanabel.map((sanabel, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={sanabel.icon}
                              alt={sanabel.name}
                              className="w-6 h-auto"
                            />
                            <span className="font-medium text-gray-800">
                              {sanabel.name}
                            </span>
                          </div>
                          <div className="text-end">
                            <div className="text-sm text-gray-600">
                              {t("لديك")}: {sanabel.available}
                            </div>
                            <div className="text-sm font-bold text-red-600">
                              {t("تحتاج")}: {sanabel.needed} {t("إضافية")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="w-full px-6 py-3 font-bold text-white transition-transform transform bg-red-500 shadow-md rounded-xl hover:scale-105 active:scale-95"
                    onClick={() => {
                      setIsInsufficientFundsVisible(false);
                      setMissingSanabel([]);
                    }}
                  >
                    {t("فهمت")}
                  </button>
                </motion.div>
              </div>
            )}

            {/* Purchase Success Popup */}
            {isPurchaseConfirmed && (
              <div className="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-50 flex-center ">
                <div className="w-2/3 p-4 text-center bg-white rounded-xl">
                  <CheckmarkAnimation />

                  <h1 className="text-lg text-black">
                    {t("تمت عملية الشراء بنجاح")}
                  </h1>
                  <button
                    className="px-4 py-2 mt-4 text-white bg-blueprimary rounded-xl"
                    onClick={() => setIsPurchaseConfirmed(false)}
                  >
                    {t("إغلاق")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-2/3">
          {treeProgress < 51 && (
            <motion.button
              className="w-full gap-2 px-6 py-3 font-bold text-white rounded-full shadow-lg flex-center bg-gradient-to-r from-blueprimary to-blue-400"
              initial={{ scale: 1 }}
              animate={{
                y: [0, -5, 0],
                transition: { repeat: Infinity, duration: 1.5 },
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={progressTree}
            >
              <div className="">
                <span>🌟</span>
                {t("كبر الشجرة")}
              </div>
            </motion.button>
          )}

          {/* Celebration Popup */}
          {isCelebrationVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop with blur effect */}
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsCelebrationVisible(false)}
              />

              {/* Celebration popup content */}
              <motion.div
                className="relative z-10 w-full max-w-md p-6 mx-4 overflow-hidden shadow-2xl bg-gradient-to-b from-white to-blue-50 rounded-2xl"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 12 }}
              >
                {/* Confetti particles */}
                <div className="absolute inset-0 overflow-hidden opacity-25 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{
                        x: Math.random() * 400 - 200,
                        y: -20,
                        rotate: Math.random() * 360,
                        opacity: 0,
                      }}
                      animate={{
                        y: Math.random() * 400 + 100,
                        opacity: [0, 1, 0],
                        rotate: Math.random() * 360 + 180,
                      }}
                      transition={{
                        duration: Math.random() * 3 + 2,
                        delay: Math.random() * 0.5,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2,
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        color: [
                          "#FFD700",
                          "#FF6347",
                          "#9ACD32",
                          "#20B2AA",
                          "#BA55D3",
                        ][Math.floor(Math.random() * 5)],
                      }}
                    >
                      {
                        ["✦", "★", "✴", "✷", "✸", "✹", "✺", "❀", "❁"][
                          Math.floor(Math.random() * 9)
                        ]
                      }
                    </motion.div>
                  ))}
                </div>

                {/* Growing tree animation */}
                <div className="relative h-[50vh] w-[70vw] flex-center items-center justify-center mx-auto">
                  <AnimatePresence>
                    <motion.img
                      key={treeProgress - 1}
                      src={treeStages[treeProgress - 1 + 3]}
                      alt={`Current tree stage ${treeProgress}`}
                      className="absolute w-full h-auto"
                    />
                    <motion.img
                      key={treeProgress + 1}
                      src={treeStages[treeProgress + 3]}
                      alt={`Next tree stage ${treeProgress + 1}`}
                      className="absolute w-full h-auto "
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 1 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                  </AnimatePresence>
                </div>

                {/* Congratulatory message */}
                <div className="text-center">
                  <motion.h2
                    className="mb-3 text-xl font-bold text-green-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {t("مبروك، شجرتك تزدهر وتثمر بنجاح")}
                  </motion.h2>

                  <motion.p
                    className="mb-6 text-green-600"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    {t("ثمار إحسانك تنمو لتضيء طريق الخير")}
                  </motion.p>
                </div>

                {/* Call to action button */}
                <motion.button
                  className="w-full py-3 font-bold text-white shadow-md bg-gradient-to-r from-green-500 to-blue-500 rounded-xl"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  onClick={() => {
                    setIsCelebrationVisible(false);
                    refreshUserData();
                  }}
                >
                  {t("رائع")}
                </motion.button>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;
