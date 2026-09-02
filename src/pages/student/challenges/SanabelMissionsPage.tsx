import { API_BASE_URL } from "../../../config/api";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import GoBackButton from "../../../components/GoBackButton";

import Tickcircle from "../../../icons/Sanabel/Tickcircle";
import { FaLocationArrow, FaCheck } from "react-icons/fa";

import sanabelType from "../../../data/SanabelTypeData";
import PrayerTimes from "./PrayerTimes";
import axios from "axios";
import { sanabelImgs } from "../../../data/SanabelImgs";

// Sanabel
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";
import { motion, AnimatePresence } from "framer-motion";
import { useUserContext } from "../../../context/StudentUserProvider";
import { describeApiError } from "../../../utils/apiError";

type ApprovalStatus = "pending" | "approved" | "denied" | null;

const SanabelMissionsPage: React.FC = () => {
  const { user, refreshUserData, mutateStudent } = useUserContext();
  const history = useHistory();

  // School-affiliated students go through the parent/teacher approval
  // workflow instead of completing missions instantly (matches StudentNavbar).
  const isPersonal = !user?.classId;
  const { index, subIndex } = useParams<{ index: any; subIndex: any }>();
  // Ensure index is properly parsed as a number
  const indexAsNumber = parseInt(index, 10);
  // Make sure APIIndex is correctly calculated as a number
  const APIIndex = indexAsNumber + 1;

  const { t } = useTranslation();

  const sanabelIndex = index;

  let colors = [];

  colors = ["bg-blueprimary", "bg-redprimary", "bg-yellowprimary"];

  const colorBG = colors[index % colors.length];
  let colorBorder = [];
  colorBorder = [
    "border-t-blueprimary",
    "border-t-redprimary",
    "border-t-yellowprimary",
  ];

  const colorBorderTop = colorBorder[index % colors.length];

  const [location, setLocation] = useState<string>(
    localStorage.getItem("selectedLocation") || "الإسكندرية"
  );

  // Add a list of available cities
  const availableCities = ["القاهرة", "الإسكندرية"];

  // Save location to localStorage when it changes
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    localStorage.setItem("selectedLocation", newLocation);
  };

  const [categoryName, setCategoryName] = useState("");
  const [sanabel, setSanabel] = useState<string[]>([]);
  const [missions, setMissions] = useState([]);

  // Popup states
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Approval-workflow state (school students only)
  const [hasApprovers, setHasApprovers] = useState<boolean | null>(null);
  const [approverNames, setApproverNames] = useState<
    { id?: number; type: "parent" | "teacher"; name: string }[]
  >([]);
  const [selectedApprover, setSelectedApprover] = useState<{ id?: number; type: "parent" | "teacher"; name: string } | null>(null);
  const [requestStatusMap, setRequestStatusMap] = useState<
    Record<number, ApprovalStatus>
  >({});
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [showRequestSentPopup, setShowRequestSentPopup] = useState(false);

  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    const fetchAllData = async () => {
      const authToken = localStorage.getItem("token");
      if (!authToken) return;

      try {
        // Fetch Category Name
        const categoryResponse = await axios.get(
          `${API_BASE_URL}/students/tasks-category`,
          {
            timeout: 15000,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (categoryResponse.status === 200) {
          const fetchedCategoryName =
            categoryResponse.data.data[index].category;
          if (!active) return;
          setCategoryName(fetchedCategoryName);

          // Fetch Sanabel
          const sanabelResponse = await axios.get(
            `${API_BASE_URL}/students/appear-Taskes-Type/${APIIndex}`,
            {
              timeout: 15000,
            headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (sanabelResponse.status === 200) {
            const uniqueTypes: string[] = [];
            sanabelResponse.data.data.forEach((task: { type: string }) => {
              if (!uniqueTypes.includes(task.type)) {
                uniqueTypes.push(task.type);
              }
            });

            if (!active) return;
            setSanabel(uniqueTypes);

            // Fetch Missions
            if (uniqueTypes[subIndex]) {
              const missionsResponse = await axios.get(
                `${API_BASE_URL}/students/appear-Taskes-Type-Category/${APIIndex}/${uniqueTypes[subIndex]}`,
                {
                  timeout: 15000,
            headers: {
                    Authorization: `Bearer ${authToken}`,
                  },
                }
              );

              if (missionsResponse.status === 200) {
                console.log("Missions data:", missionsResponse.data.tasks);
                console.log("API Index:", APIIndex);
                console.log("All Sanabel:", uniqueTypes);
                console.log("Current Sanabel:", uniqueTypes[subIndex]);

                // Sort missions so completed ones appear first
                const sortedMissions = missionsResponse.data.tasks.sort(
                  (a: any, b: any) => {
                    if (
                      a.completionStatus === "Completed" &&
                      b.completionStatus !== "Completed"
                    ) {
                      return -1; // a comes first
                    }
                    if (
                      a.completionStatus !== "Completed" &&
                      b.completionStatus === "Completed"
                    ) {
                      return 1; // b comes first
                    }
                    return 0; // maintain original order for items with same completion status
                  }
                );

                if (active) setMissions(sortedMissions);
              }
            }
          }
        }
      } catch (error) {
        if (active) setApprovalError(t(describeApiError(error)));
      }
    };

    void fetchAllData();
    void refreshUserData();
    return () => { active = false; };
  }, [index, subIndex, APIIndex, refreshUserData]);

  // Pull the student's approval state — who can approve, and the latest
  // request per mission — so buttons render the right one of the 4 states
  // (Link Parent / Request Approval / Waiting for Approval / Completed)
  // without waiting for the student to tap anything first.
  const fetchApprovalInfo = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken || missions.length === 0) return;

    try {
      const approversResponse = await axios.get(
        `${API_BASE_URL}/mission/myApprovers`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (approversResponse.status === 200) {
        const { hasParent, hasTeacher, approvers } = approversResponse.data.data;
        setHasApprovers(hasParent || hasTeacher);
        setApproverNames(approvers || []);
      }

      const statusEntries = await Promise.all(
        (missions as any[]).map(async (mission) => {
          try {
            // No missionDate: the server's canonical day decides which day's
            // request this is. A wrong device clock must not shift it.
            const statusResponse = await axios.get(
              `${API_BASE_URL}/mission/myRequestStatus`,
              {
                headers: { Authorization: `Bearer ${authToken}` },
                params: { taskId: mission.id },
              }
            );
            const latest = statusResponse.data.data;
            return [mission.id, latest ? latest.status : null] as const;
          } catch {
            return [mission.id, null] as const;
          }
        })
      );
      setRequestStatusMap(Object.fromEntries(statusEntries));
    } catch (error) {
      console.error("Error fetching approval info:", error);
    }
  };

  useEffect(() => {
    if (isPersonal || missions.length === 0) return;
    fetchApprovalInfo();

    // Approvals happen in another parent/teacher session, so poll while this
    // page stays open rather than requiring a manual refresh.
    const interval = setInterval(fetchApprovalInfo, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonal, missions.length]);

  const handleMarkComplete = (missionId: number) => {
    setApprovalError(null);
    setSelectedMissionId(missionId);
    setSelectedApprover(null);
    setShowConfirmPopup(true);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toISOString();
  };

  const confirmMarkComplete = async () => {
    if (!selectedMissionId || submitting.current) return;
    if (!isPersonal && !selectedApprover) return;

    submitting.current = true;
    setIsLoading(true);
    const authToken = localStorage.getItem("token");

    // School-affiliated students can't complete missions directly — they
    // send a request to their linked parent/teachers instead.
    if (!isPersonal) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/mission/requestApproval`,
          {
            // No missionDate: the server dates the request from its own
            // canonical day. A device clock never decides a reward's day.
            taskId: selectedMissionId,
            approverId: selectedApprover?.id,
            approverType: selectedApprover?.type,
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.status === 201) {
          setRequestStatusMap((prev) => ({
            ...prev,
            [selectedMissionId]: "pending",
          }));
          setShowConfirmPopup(false);
          setShowRequestSentPopup(true);
        }
      } catch (error: any) {
        setApprovalError(
          error?.response?.data?.message ||
            t("حدث خطأ أثناء إرسال طلب الموافقة")
        );
        if (
          error?.response?.data?.message?.startsWith("No parent or teacher")
        ) {
          setHasApprovers(false);
        }
        setShowConfirmPopup(false);
      } finally {
        submitting.current = false;
        setIsLoading(false);
        setSelectedMissionId(null);
      }
      return;
    }

    try {
      const response = await mutateStudent("mission", {
        taskId: selectedMissionId, time: getCurrentTime(),
      });

      if (response.status === 200 || response.status === 201) {
        // Personal checkmarks derive from the committed context snapshot.
        setShowConfirmPopup(false);
        setShowCongratsPopup(true);
      }
    } catch (error) {
      console.error("Error marking mission complete:", error);
      // This previously failed completely silently (console.error only) —
      // the student had no way to know the tap did nothing. Always show the
      // specific reason (timeout, offline, expired session, server error...).
      setShowConfirmPopup(false);
      alert(t(describeApiError(error)));
      void refreshUserData();
    } finally {
      submitting.current = false;
      setIsLoading(false);
      setSelectedMissionId(null);
    }
  };

  const renderResources = (items: any) =>
    [
      { icon: blueSanabel, value: items.snabelBlue },
      { icon: redSanabel, value: items.snabelRed },
      { icon: yellowSanabel, value: items.snabelYellow },
      { icon: xpIcon, value: items.xp },
    ].map((resource, index) => (
      <div key={index} className="flex flex-col items-center">
        <img
          src={resource.icon}
          alt="icon"
          className="w-auto h-6"
          loading="lazy"
        />
        <h1 className="text-sm text-black">{resource.value}</h1>
      </div>
    ));

  return (
    <div className="flex flex-col items-center w-full h-full p-4 overflow-y-auto">
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <div className="opacity-0 w-[25px] h-25" />
        <h1 className="self-center text-xl font-bold text-black" dir="ltr">
          {t(sanabel[subIndex])}
        </h1>
        <GoBackButton />
      </div>
      <div
        className={`w-full ${colorBG} flex justify-between items-center  p-5 rounded-lg  mt-8`}
      >
        <img
          src={sanabelImgs[sanabelIndex][subIndex]}
          alt={sanabel[subIndex]}
          className="w-1/3 object-contain drop-shadow-[0_0_1px_rgba(75,75,75,1)]"
        />

        <div className="flex flex-col justify-between gap-3">
          <h1 className="text-lg font-bold text-center text-white ">
            <span>{t("تحديات")}</span>
            <br></br>
            {t(sanabel[subIndex])}
          </h1>
          {index == 0 && subIndex == 0 && (
            <div className="flex flex-col items-center w-full scale-90">
              <div className="flex items-center gap-1 p-1 border-2 border-gray-300 rounded-lg">
                <FaLocationArrow className="text-white" />
                <select
                  className="px-2 py-1 text-white bg-transparent border-none rounded-lg outline-none cursor-pointer "
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                >
                  {availableCities.map((city) => (
                    <option
                      key={city}
                      value={city}
                      className="text-black bg-white"
                    >
                      {t(city)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {index == 0 && subIndex == 0 && <PrayerTimes location={location} />}

      {approvalError && (
        <div className="w-full px-4 py-2 mt-3 text-sm text-center text-red-700 bg-red-100 rounded-lg">
          {approvalError}
        </div>
      )}

      <div className="flex flex-col items-center justify-start w-full gap-5 mt-5 overflow-y-auto h-2/3">
        {missions.map((mission: any, index: number) => {
          const approvalStatus = requestStatusMap[mission.id];
          const isCompleted =
            (isPersonal ? (user?.completedTasks?.taskIds.includes(Number(mission.id)) ?? false) : mission.completionStatus === "Completed") ||
            approvalStatus === "approved";

          return (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex w-full flex-col items-end justify-between sanabel-shadow-bottom h-max rounded-xl p-4 gap-2 border-t-2  ${
              !isCompleted ? `${colorBorderTop}` : "border-t-[#498200]"
            }`}
          >
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex justify-between w-full"
              >
                <div className="flex justify-between w-full ">
                  <div className={`flex-center  text-[#498200]`}>
                    <h1> {t("تمت")}</h1>
                    <Tickcircle />
                  </div>
                </div>
              </motion.div>
            )}

            {!isCompleted && isPersonal && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex justify-between w-full"
              >
                <button
                  data-guide-id="mission-action"
                  onClick={() => handleMarkComplete(mission.id)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-200 text-white ${colorBG} hover:opacity-80 active:scale-95`}
                >
                  <span className="text-sm font-medium">
                    {t("تم الإنجاز")}
                  </span>
                  <FaCheck className="text-xs" />
                </button>
              </motion.div>
            )}

            {!isCompleted && !isPersonal && hasApprovers === false && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex justify-between w-full"
              >
                <button
                  onClick={() => history.push("/student/profile")}
                  className="flex items-center gap-2 px-3 py-1 text-white transition-all duration-200 rounded-lg bg-gray-500 hover:opacity-80 active:scale-95"
                >
                  <span className="text-sm font-medium">
                    {t("اربط ولي أمر لطلب الموافقة")}
                  </span>
                </button>
              </motion.div>
            )}

            {!isCompleted && !isPersonal && hasApprovers !== false && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex justify-between w-full"
              >
                {approvalStatus === "pending" ? (
                  <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
                    {t("بانتظار الموافقة...")}
                  </span>
                ) : (
                  <button
                    data-guide-id="mission-action"
                  onClick={() => handleMarkComplete(mission.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-200 text-white ${colorBG} hover:opacity-80 active:scale-95`}
                  >
                    <span className="text-sm font-medium">
                      {approvalStatus === "denied"
                        ? t("إعادة الطلب")
                        : t("طلب الموافقة")}
                    </span>
                    <FaCheck className="text-xs" />
                  </button>
                )}
              </motion.div>
            )}

            <div className="flex items-center justify-between w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: !isCompleted ? 0.5 : 1,
                }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={`flex gap-2`}
              >
                {renderResources(mission)}
              </motion.div>

              <h1 className="w-2/3 text-sm text-black ">{t(mission.title)}</h1>
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {showConfirmPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowConfirmPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="w-full max-w-sm p-6 mx-4 bg-white shadow-2xl rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div
                  className={`w-16 h-16 ${colorBG} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <FaCheck className="text-2xl text-white" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-800">
                  {isPersonal ? t("تأكيد الإنجاز") : t("إرسال طلب الموافقة")}
                </h2>
                {isPersonal ? (
                  <p className="mb-6 text-gray-600">
                    {t("هل أنت متأكد من أنك أنجزت هذه المهمة؟")}
                  </p>
                ) : (
                  <div className="mb-6 text-start">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      {t("اختر ولي الأمر أو المعلم للموافقة:")}
                    </label>
                    <select
                      className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-black bg-white outline-none focus:border-blueprimary transition-all text-sm"
                      value={selectedApprover ? `${selectedApprover.type}-${selectedApprover.id}` : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedApprover(null);
                          return;
                        }
                        const [type, idStr] = val.split("-");
                        const found = approverNames.find(a => a.type === type && String(a.id) === idStr);
                        setSelectedApprover(found ? { id: Number(idStr), type: type as "parent" | "teacher", name: found.name } : null);
                      }}
                    >
                      <option value="">{t("اختر...")}</option>
                      {approverNames.map((approver: any) => (
                        <option key={`${approver.type}-${approver.id}`} value={`${approver.type}-${approver.id}`}>
                          {approver.name} ({approver.type === "parent" ? t("ولي الأمر") : t("معلم")})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmPopup(false)}
                    className="flex-1 px-4 py-2 font-medium text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    {t("إلغاء")}
                  </button>
                  <button
                    onClick={confirmMarkComplete}
                    disabled={isLoading || (!isPersonal && !selectedApprover)}
                    className={`flex-1 py-2 px-4 ${colorBG} text-white rounded-lg font-medium hover:opacity-80 transition-all disabled:opacity-50`}
                  >
                    {isLoading ? t("جاري التحديث...") : t("تأكيد")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Congratulations Popup */}
      <AnimatePresence>
        {showCongratsPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="w-full max-w-sm p-8 mx-4 text-center bg-white shadow-2xl rounded-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full"
              >
                <Tickcircle className="text-3xl text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-gray-800"
              >
                {t("🎉 مبروك! 🎉")}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-gray-600"
              >
                {t("لقد أنجزت المهمة بنجاح")}
                <br />
                {t("استمر في التقدم الرائع 💪")}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowCongratsPopup(false)}
                className="w-full px-6 py-3 font-medium text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
              >
                {t("رائع")}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Sent Popup (school students) */}
      <AnimatePresence>
        {showRequestSentPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="w-full max-w-sm p-8 mx-4 text-center bg-white shadow-2xl rounded-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`w-20 h-20 ${colorBG} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <FaCheck className="text-3xl text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-gray-800"
              >
                {t("تم إرسال الطلب!")}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-gray-600"
              >
                {t("بانتظار موافقة ولي أمرك أو معلمك")}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowRequestSentPopup(false)}
                className={`w-full px-6 py-3 font-medium text-white transition-colors ${colorBG} rounded-lg hover:opacity-80`}
              >
                {t("حسنًا")}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SanabelMissionsPage;
