import { useAutoStartGuide } from "../../guides/useAutoStartGuide";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
import { toFiniteNumber } from "../../utils/numericData";
import { computeMissingByColor } from "../../utils/shopMath";
import { describeApiError } from "../../utils/apiError";
import { AudioManager } from "../../utils/AudioManager";

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
  const { user, refreshUserData, mutateStudent, isLoading: isUserLoading } = useUserContext();
  useAutoStartGuide("student-shop", true);

  const shop = [
    { icon: blueSanabel },
    { icon: redSanabel },
    { icon: yellowSanabel },
  ];

  const waterCount = toFiniteNumber(user?.water);
  const fertilizerCount = toFiniteNumber(user?.fertilizer);

  const blueCount = toFiniteNumber(user?.snabelBlue);
  const redCount = toFiniteNumber(user?.snabelRed);
  const yellowCount = toFiniteNumber(user?.snabelYellow);

  const waterNeeded = toFiniteNumber(user?.waterNeeded);
  const fertilizerNeeded = toFiniteNumber(user?.fertilizerNeeded);

  //  المرحلة
  const treeStage = toFiniteNumber(user?.treeStage);
  const treeProgress = toFiniteNumber(user?.treeProgress);

  const waterCost = treeProgress == 1 ? 10 : 20;
  const fertilizerCost = treeProgress == 1 ? 15 : 30;

  const [buyWaterCount, setBuyWaterCount] = useState(0);
  const [buyFertilizerCount, setBuyFertilizerCount] = useState(0);

  // Calculate remaining needed resources
  const remainingWaterNeeded = Math.max(0, waterNeeded - waterCount);
  const remainingFertilizerNeeded = Math.max(
    0,
    fertilizerNeeded - fertilizerCount,
  );

  const isProgressReady = !!user && treeProgress > 0 &&
    waterCount >= waterNeeded && fertilizerCount >= fertilizerNeeded;
  const submitting = useRef(false);
  const [isGrowing, setIsGrowing] = useState(false);
  useEffect(() => { void refreshUserData(); }, [refreshUserData]);

  function changeBuyWaterCount(operation: any) {
    if (submitting.current) return;
    if (operation === "-" && buyWaterCount !== 0) {
      setBuyWaterCount(count => Math.max(0, count - 1));
    } else if (operation === "+" && buyWaterCount < remainingWaterNeeded) {
      setBuyWaterCount(count => Math.min(remainingWaterNeeded, count + 1));
    } else if (operation === "+" && buyWaterCount === remainingWaterNeeded) {
      toast.warning(t("لقد وصلت إلى الحد الأقصى المطلوب من الماء"));
    }
  }

  function changeBuyFertilizerCount(operation: any) {
    if (operation === "-" && buyFertilizerCount !== 0) {
      setBuyFertilizerCount(count => Math.max(0, count - 1));
    } else if (
      operation === "+" &&
      buyFertilizerCount < remainingFertilizerNeeded
    ) {
      setBuyFertilizerCount(count => Math.min(remainingFertilizerNeeded, count + 1));
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
  const [isBuying, setIsBuying] = useState(false);

  // The server charges the SAME total cost from EACH sanabel color, so the
  // shortage must be computed per color — not by "spending" one pooled budget
  // across the colors (the old logic returned an empty list whenever a single
  // color could cover the total, leaving the insufficient-funds popup blank).
  const buildMissingSanabelList = (missingByColor: {
    snabelBlue: number;
    snabelRed: number;
    snabelYellow: number;
  }) =>
    [
      {
        type: "blue",
        icon: blueSanabel,
        name: t("سنبلة زرقاء"),
        needed: toFiniteNumber(missingByColor.snabelBlue),
        available: blueCount,
      },
      {
        type: "red",
        icon: redSanabel,
        name: t("سنبلة حمراء"),
        needed: toFiniteNumber(missingByColor.snabelRed),
        available: redCount,
      },
      {
        type: "yellow",
        icon: yellowSanabel,
        name: t("سنبلة صفراء"),
        needed: toFiniteNumber(missingByColor.snabelYellow),
        available: yellowCount,
      },
    ].filter((sanabel) => sanabel.needed > 0);

  const calculateMissingSanabel = (totalCost: number) => {
    const missing = computeMissingByColor(totalCost, {
      blue: blueCount,
      red: redCount,
      yellow: yellowCount,
    });
    return buildMissingSanabelList({
      snabelBlue: missing.blue,
      snabelRed: missing.red,
      snabelYellow: missing.yellow,
    });
  };

  // Buy Shop
  const buyShop = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setIsBuying(true);
    try {
      const response = await mutateStudent("purchase", {
        water: buyWaterCount, seeders: buyFertilizerCount,
      });

      if (response.status === 200) {
        setBuyWaterCount(0);
        setBuyFertilizerCount(0);
        setIsPopupVisible(false);
        setIsPurchaseConfirmed(true);
      }
    } catch (error: any) {
      AudioManager.play("error");
      console.error("Error purchasing items:", error);

      // Only a real insufficient-balance rejection opens the "you need more
      // sanabel" popup. Every other failure (network, timeout, server error)
      // used to fall in here too and blame the student's balance for it.
      const status = error?.response?.status;
      const data = error?.response?.data;
      const isInsufficientBalance =
        status === 400 &&
        (data?.missing || /insufficient/i.test(String(data?.error || "")));

      if (isInsufficientBalance) {
        const totalCost =
          buyFertilizerCount * fertilizerCost + buyWaterCount * waterCost;
        // Prefer the server's own numbers; fall back to the local estimate.
        const missing = data?.missing
          ? buildMissingSanabelList(data.missing)
          : calculateMissingSanabel(totalCost);

        setIsPopupVisible(false);
        if (missing.length > 0) {
          setMissingSanabel(missing);
          setIsInsufficientFundsVisible(true);
        } else {
          toast.error(t(describeApiError(error)));
        }
      } else {
        // Always tell the user exactly what went wrong (timeout, offline,
        // expired session, server rejection...) — never a vague failure.
        setIsPopupVisible(false);
        toast.error(t(describeApiError(error)));
      }
      // A lost response does not prove the purchase failed on the server.
      void refreshUserData();
    } finally {
      submitting.current = false;
      setIsBuying(false);
    }
  };

  const progressTree = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setIsGrowing(true);
    try {
      setIsPurchaseConfirmed(false);
      const response = await mutateStudent("tree");

      if (response.status === 200) {

        setIsCelebrationVisible(true);
        // Refresh user data to show updated tree stage
      }
    } catch (error) {
      AudioManager.play("error");
      console.error("Error progress tree:", error);
      toast.error(t(describeApiError(error)));
      // The resource counts on screen may be stale — resync with the server.
      void refreshUserData();
    } finally {
      submitting.current = false;
      setIsGrowing(false);
    }
  };

  return (
    <div
      className="flex-col w-full  flex-center shadow-md p-2 border-[1px] border-[#33333325] rounded-xl"
    >
      {isUserLoading && <p role="status">{t("جاري تحميل البيانات...")}</p>}
      <div className="absolute">
        <Toaster />
      </div>
      {(!isProgressReady || isPurchaseConfirmed) && !isCelebrationVisible ? (
        <div className="flex flex-col w-full h-full gap-1">
          <h1 className="text-lg text-black text-start">{t("المتجر")}</h1>

          <div className="flex-col gap-2 bg-[#FFF8E5] rounded-xl w-full flex justify-between p-2">
            <div className="flex flex-row-reverse justify-between">
              <div className="flex-center">
                <div className="gap-1 p-1 bg-white flex-center rounded-3xl select-none">
                  <button
                    type="button"
                    aria-label={t("تقليل السماد")}
                    disabled={!user || isUserLoading || isBuying || isGrowing}
                    className="w-11 h-11 rounded-full flex-center bg-blueprimary text-white select-none active:scale-90 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => changeBuyFertilizerCount("-")}
                  >
                    <span className="text-white font-bold select-none text-xs">-</span>
                  </button>
                  <span className="text-black font-semibold select-none px-1"> x{buyFertilizerCount}</span>
                  <button
                    type="button"
                    aria-label={t("زيادة السماد")}
                    disabled={!user || isUserLoading || isBuying || isGrowing}
                    className="w-11 h-11 rounded-full flex-center bg-blueprimary text-white select-none active:scale-90 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => changeBuyFertilizerCount("+")}
                  >
                    <span className="text-white font-bold select-none text-xs">+</span>
                  </button>
                </div>
                <img src={fertilizerImg} alt="" className="w-auto h-8 select-none pointer-events-none" />
              </div>
              <div className="flex-center">
                <div className="gap-1 p-1 bg-white flex-center rounded-3xl select-none">
                  <button
                    type="button"
                    aria-label={t("تقليل الماء")}
                    disabled={!user || isUserLoading || isBuying || isGrowing}
                    className="w-11 h-11 rounded-full flex-center bg-blueprimary text-white select-none active:scale-90 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => changeBuyWaterCount("-")}
                  >
                    <span className="text-white font-bold select-none text-xs">-</span>
                  </button>
                  <span className="text-black font-semibold select-none px-1"> x{buyWaterCount}</span>
                  <button
                    type="button"
                    aria-label={t("زيادة الماء")}
                    disabled={!user || isUserLoading || isBuying || isGrowing}
                    data-testid="shop-add-water"
                    className="w-11 h-11 rounded-full flex-center bg-blueprimary text-white select-none active:scale-90 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => changeBuyWaterCount("+")}
                  >
                    <span className="text-white font-bold select-none text-xs">+</span>
                  </button>
                </div>
                <img src={waterImg} alt="" className="w-auto h-8 select-none pointer-events-none" />
              </div>
            </div>
            {(buyWaterCount > 0 || buyFertilizerCount > 0) && (
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center justify-between w-full gap-2 p-3 bg-white border-2 rounded-3xl">
                  <div className="gap-2 flex-center">
                    {shop.map((item, index) => (
                      <div key={index} className="gap-1 flex-center select-none">
                        <img
                          src={item.icon}
                          alt="icon"
                          className="w-auto h-8 select-none pointer-events-none"
                        />
                        <span className="text-sm font-semibold text-black select-none">
                          x
                          {buyFertilizerCount * fertilizerCost +
                            buyWaterCount * waterCost}
                        </span>
                      </div>
                    ))}
                  </div>
                  <h1 className="py-1 text-sm font-bold text-center text-black select-none">
                    {t("الاجمالي")}
                  </h1>
                </div>
                <div className="w-full flex-center pt-2">
                  <button
                    type="button"
                    data-testid="shop-buy-button"
                    disabled={!user || isUserLoading || isBuying || isGrowing || (buyWaterCount === 0 && buyFertilizerCount === 0)}
                    className="w-full max-w-[220px] min-h-[48px] py-3 px-6 text-base font-bold text-white text-center bg-blueprimary rounded-2xl select-none cursor-pointer shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none touch-manipulation flex items-center justify-center border-0 outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPopupVisible(true);
                    }}
                  >
                    <span className="pointer-events-none select-none">{t("شراء")}</span>
                  </button>
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
                  <h1 className="mb-4 text-xl font-bold text-black select-none">
                    {t("تأكيد الشراء")}
                  </h1>

                  <div className="bg-[#FFF8E5] rounded-xl p-4 ">
                    <div className="flex items-center justify-center gap-8 my-3">
                      <div className="flex flex-col items-center">
                        <h2 className="mb-2 text-black text-md select-none">{t("ماء")}</h2>
                        <div className="p-3 mb-2 bg-blue-100 rounded-full shadow-md">
                          <img
                            src={waterImg}
                            alt=""
                            className="object-contain w-14 h-14 select-none pointer-events-none"
                          />
                        </div>
                        <div className="px-3 py-1 text-white bg-blue-500 rounded-full">
                          <h2 className="font-bold select-none">x{buyWaterCount}</h2>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <h2 className="mb-2 text-black text-md select-none">{t("سماد")}</h2>
                        <div className="p-3 mb-2 bg-green-100 rounded-full shadow-md">
                          <img
                            src={fertilizerImg}
                            alt=""
                            className="object-contain w-14 h-14 select-none pointer-events-none"
                          />
                        </div>
                        <div className="px-3 py-1 text-white bg-green-500 rounded-full">
                          <h2 className="font-bold select-none">x{buyFertilizerCount}</h2>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-between w-full gap-2 p-2 bg-gray-100/25 rounded-2xl">
                      <h1 className="font-bold text-center text-black text-md select-none">
                        {t("الاجمالي")}
                      </h1>

                      <div className="gap-4 p-5 flex-center rounded-xl">
                        {shop.map((item, index) => (
                          <div key={index} className="gap-1 flex-center select-none">
                            <img
                              src={item.icon}
                              alt="icon"
                              className="w-auto h-8 select-none pointer-events-none"
                            />
                            <span className="text-sm font-semibold text-black select-none">
                              x
                              {buyFertilizerCount * fertilizerCost +
                                buyWaterCount * waterCost}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      type="button"
                      className="flex-1 min-h-[48px] px-4 py-3 font-bold text-white transition-transform transform shadow-md bg-blueprimary rounded-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer touch-manipulation border-0 outline-none flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        void buyShop();
                      }}
                      disabled={isBuying}
                    >
                      <span className="pointer-events-none select-none">
                        {isBuying ? t("جاري الشراء...") : t("تأكيد الشراء")}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="min-h-[48px] px-6 py-3 font-bold text-gray-700 transition-transform transform bg-white border-2 border-gray-300 shadow-sm rounded-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer touch-manipulation outline-none flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPopupVisible(false);
                      }}
                      disabled={isBuying}
                    >
                      <span className="pointer-events-none select-none">{t("إلغاء")}</span>
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
                  <div className="mb-4 text-6xl text-red-600 select-none">!</div>
                  <h1 className="mb-4 text-xl font-bold text-red-600 select-none">
                    {t("رصيد غير كافي")}
                  </h1>

                  <p className="mb-4 text-gray-700 select-none">
                    {t("تحتاج إلى المزيد من السنابل لإتمام هذه العملية")}
                  </p>

                  <div className="p-2 mb-4 bg-red-50 rounded-xl">
                    <h3 className="mb-3 font-bold text-red-800 select-none">
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
                              className="w-6 h-auto pointer-events-none select-none"
                            />
                            <span className="font-medium text-gray-800 select-none">
                              {sanabel.name}
                            </span>
                          </div>
                          <div className="text-end">
                            <div className="text-sm text-gray-600 select-none">
                              {t("لديك")}: {sanabel.available}
                            </div>
                            <div className="text-sm font-bold text-red-600 select-none">
                              {t("تحتاج")}: {sanabel.needed} {t("إضافية")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full min-h-[48px] px-6 py-3 font-bold text-white transition-transform transform bg-red-500 shadow-md rounded-xl active:scale-95 select-none cursor-pointer touch-manipulation border-0 outline-none flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsInsufficientFundsVisible(false);
                      setMissingSanabel([]);
                    }}
                  >
                    <span className="pointer-events-none select-none">{t("فهمت")}</span>
                  </button>
                </motion.div>
              </div>
            )}

            {/* Purchase Success Popup */}
            {isPurchaseConfirmed && (
              <div className="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-50 flex-center">
                <div className="w-4/5 max-w-sm p-6 text-center bg-white rounded-2xl shadow-xl">
                  <CheckmarkAnimation />

                  <h1 className="mt-3 text-lg font-bold text-black select-none">
                    {t("تمت عملية الشراء بنجاح")}
                  </h1>
                  <button
                    type="button"
                    className="w-full min-h-[48px] px-6 py-3 mt-4 font-bold text-white bg-blueprimary rounded-xl select-none cursor-pointer touch-manipulation active:scale-95 transition-transform border-0 outline-none flex items-center justify-center shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPurchaseConfirmed(false);
                    }}
                  >
                    <span className="pointer-events-none select-none">{t("إغلاق")}</span>
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
              disabled={isGrowing || !user}
              aria-busy={isGrowing}
            >
              <div className="">
                <span>🌟</span>
                {t("كبر الشجرة")}
              </div>
            </motion.button>
          )}

          {/* Celebration Popup */}
          {isCelebrationVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center w-full mx-auto ">
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
                <div className="absolute inset-0 overflow-hidden opacity-25 pointer-events-none flex-center">
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
                <div className="relative items-center justify-center w-3/4 mx-auto mb-4 h-96 flex-center">
                  <AnimatePresence>
                    <motion.img
                      key={treeProgress - 1}
                      src={treeStages[treeProgress - 1 + 3]}
                      alt={`Current tree stage ${treeProgress}`}
                      className="absolute inset-0 object-contain object-bottom w-full h-full"
                    />
                    <motion.img
                      key={treeProgress + 1}
                      src={treeStages[Math.min(treeProgress + 2, treeStages.length - 1)]}
                      alt={`Next tree stage ${treeProgress + 1}`}
                      className="absolute inset-0 object-contain object-bottom w-full h-full"
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
                <div className="mt-2 text-center">
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
                  className="w-full py-3 font-bold text-white shadow-md bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  onClick={() => {
                    setIsCelebrationVisible(false);

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
