import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import TeacherNavbar from "../../components/navbar/TeacherNavbar";
import GoBackButton from "../../components/GoBackButton";

import StudentNavbar from "../../components/navbar/StudentNavbar";
import ParentNavbar from "../../components/navbar/ParentNavbar";
import { HiUsers } from "react-icons/hi";
import GetAvatar from "../student/tutorial/GetAvatar";
import MedalAndLevel from "../../components/MedalAndLevel";

import blueSanabel from "../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../assets/resources/اكس بي.png";

import waterImg from "../../assets/resources/ماء.png";
import fertilizerImg from "../../assets/resources/سماد.png";
import { treeStages } from "../../data/Tree";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "../../components/PrimaryButton";

const renderResources = (items: any) =>
  [
    { icon: blueSanabel, value: items.snabelBlue },
    { icon: redSanabel, value: items.snabelRed },
    { icon: yellowSanabel, value: items.snabelYellow },
    { icon: xpIcon, value: items.xp },
  ].map((resource, index) => (
    <div
      key={index}
      className="flex flex-col items-center p-2 bg-white rounded-lg shadow-md"
    >
      <img
        src={resource.icon}
        alt="icon"
        className="w-auto h-6"
        loading="lazy"
      />
      <h1 className="text-sm text-black">{resource.value}</h1>
    </div>
  ));

const TeacherView: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const role = localStorage.getItem("role") || "Student";

  const [code, setCode] = useState("");
  const [student, setStudent] = useState(null as any);
  const [viewingStudent, setViewingStudent] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const viewStudent = async () => {
    // Validate code before making API call
    if (!code || !code.trim()) {
      setErrorMessage(t("يرجى إدخال كود الطالب"));
      setShowErrorPopup(true);
      return;
    }

    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setErrorMessage(t("خطأ في المصادقة"));
      setShowErrorPopup(true);
      return;
    }

    try {
      const response = await fetch(
        `https://sanabel.wonderlearn.net/parents/search-student-by-code/${code.trim()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Check if data exists and is valid
        if (data && data.data) {
          setStudent(data.data);
          setViewingStudent(true);
          console.log("Student data:", data.data);
        } else {
          setErrorMessage(t("لم يتم العثور على طالب بهذا الكود"));
          setShowErrorPopup(true);
          setViewingStudent(false);
        }
      } else if (response.status === 404) {
        // Student not found
        setErrorMessage(t("لم يتم العثور على طالب بهذا الكود"));
        setShowErrorPopup(true);
        setViewingStudent(false);
      } else if (response.status === 401) {
        setErrorMessage(t("خطأ في المصادقة"));
        setShowErrorPopup(true);
        setViewingStudent(false);
      } else {
        // Handle error response with message from backend
        const errorMsg = data?.message || t("حدث خطأ أثناء البحث عن الطالب");
        setErrorMessage(errorMsg);
        setShowErrorPopup(true);
        setViewingStudent(false);
      }
    } catch (error) {
      console.error("Error in viewing student:", error);
      setErrorMessage(t("حدث خطأ في الاتصال بالسيرفر"));
      setShowErrorPopup(true);
      setViewingStudent(false);
    }
  };

  const handleInvite = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setErrorMessage(t("خطأ في المصادقة"));
      setShowErrorPopup(true);
      return;
    }

    try {
      const response = await fetch(
        `https://sanabel.wonderlearn.net/parents/connect-student-to-parent`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ code: code.trim() }),
        }
      );

      if (response.ok) {
        setShowPopup(true);
        setViewingStudent(false);
      } else if (response.status === 400) {
        setErrorMessage(t("الطالب مرتبط بالفعل بولي أمر آخر"));
        setShowErrorPopup(true);
        setViewingStudent(false);
      } else if (response.status === 401) {
        setErrorMessage(t("خطأ في المصادقة"));
        setShowErrorPopup(true);
      } else {
        setErrorMessage(t("فشلت عملية الدعوة"));
        setShowErrorPopup(true);
        setViewingStudent(false);
      }
    } catch (error) {
      console.error("Error in inviting student:", error);
      setErrorMessage(t("حدث خطأ في الاتصال بالخادم"));
      setShowErrorPopup(true);
      setViewingStudent(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-between gap-5 p-4"
      id="page-height"
    >
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <div className="w-16"></div>
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-black ">
            {t("دعوة الابناء")}
          </h1>
        </div>
        <GoBackButton />
      </div>

      {/* Content */}
      {!viewingStudent && (
        <div className="flex flex-col w-full gap-4 p-2 bg-white rounded-lg flex-center">
          {/* Instructions Card */}
          <div className="w-full p-6 border border-blue-200 rounded-lg shadow-sm bg-blue-50 ">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-blue-800">
                {t("كيفية العثور على كود الطفل")}
              </h2>
            </div>
            <p className="leading-relaxed text-blue-700">
              {t(
                "يمكن للطفل العثور على الكود الخاص به من خلال الدخول إلى حسابه والذهاب إلى صفحة الملف الشخصي. سيجد الكود مُعرَّض بوضوح في قسم معلومات الحساب"
              )}
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center justify-center p-4 rounded-full shadow-lg bg-gradient-to-r from-blueprimary to-indigo-400"
          >
            <HiUsers className="text-6xl text-white" />
          </motion.div>
          <div className="w-full space-y-4">
            <input
              type="text"
              placeholder={t("ادخل كود دعوة الطفل")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-4 font-medium text-center text-gray-700 transition duration-200 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              onKeyPress={(e) => e.key === "Enter" && viewStudent()}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 font-semibold text-white transition duration-300 shadow-lg bg-gradient-to-r from-blueprimary to-indigo-400 rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={viewStudent}
              disabled={!code.trim()}
            >
              {t("بحث")}
            </motion.button>
          </div>
          <div className="h-12"></div>
        </div>
      )}

      {viewingStudent && student && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-between w-full gap-1 py-1 mx-auto bg-white rounded-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-full shadow-lg w-28 h-28"
          >
            <GetAvatar userAvatarData={student.user.profileImg} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h1 className="mb-1 text-2xl font-bold text-gray-800">
              {student.user.firstName} {student.user.lastName}
            </h1>
            <h2 className="px-6 text-red-500 rounded-lg text-md bg-red-50">
              {student.connectCode}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <MedalAndLevel
              level={student.level}
              color="text-[#DBB42C]"
              dir=""
              size="w-20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full gap-3 flex-center"
          >
            <div className="flex gap-2">{renderResources(student)}</div>
            <div className="flex gap-2">
              <div className="flex flex-col items-center p-2 px-3 shadow-md bg-blue-50 rounded-xl">
                <img src={waterImg} alt="Water" className="w-auto h-6" />
                <span className="ml-1 text-sm font-semibold text-blue-700">
                  {student.water}
                </span>
              </div>
              <div className="flex flex-col items-center p-2 px-3 shadow-md bg-green-50 rounded-xl">
                <img
                  src={fertilizerImg}
                  alt="Fertilizer"
                  className="w-auto h-6"
                />
                <span className="ml-1 text-sm font-semibold text-green-700">
                  {student.seeders}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center justify-center gap-2 my-4"
          >
            <motion.img
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              src={treeStages[student.treeProgress - 1]}
              alt="tree"
              className="h-auto w-[40vw]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-2 font-semibold text-white transition duration-300 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleInvite}
            >
              {t("دعوة")}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Error Popup */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowErrorPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="w-full max-w-sm p-8 mx-4 bg-white shadow-2xl rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  damping: 25,
                  stiffness: 500,
                }}
                className="flex justify-center mb-4"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </motion.div>

              {/* Sad Emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  damping: 25,
                  stiffness: 500,
                }}
                className="flex justify-center mb-4"
              >
                <div className="text-6xl">😔</div>
              </motion.div>

              {/* Error Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-center"
              >
                <h2 className="mb-2 text-2xl font-bold text-gray-800">
                  {t("عذراً!")}
                </h2>
                <p className="mb-2 text-lg text-gray-600">{errorMessage}</p>
                <p className="text-sm text-gray-500">
                  {t("يرجى التحقق من الكود والمحاولة مرة أخرى")}
                </p>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-3 font-semibold text-white transition duration-300 shadow-lg bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:shadow-xl"
                  onClick={() => {
                    setShowErrorPopup(false);
                    setCode("");
                  }}
                >
                  {t("حاول مرة أخرى")}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showPopup && student && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="w-full max-w-sm p-8 mx-4 bg-white shadow-2xl rounded-2xl"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  damping: 25,
                  stiffness: 500,
                }}
                className="flex justify-center mb-4"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </motion.div>

              {/* Student Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  damping: 25,
                  stiffness: 500,
                }}
                className="flex justify-center mb-4"
              >
                <div className="w-20 h-20 overflow-hidden rounded-full shadow-lg">
                  <GetAvatar userAvatarData={student.user.profileImg} />
                </div>
              </motion.div>

              {/* Congratulations Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-center"
              >
                <h2 className="mb-2 text-2xl font-bold text-gray-800">
                  {t("تهانينا!")}
                </h2>
                <p className="mb-2 text-gray-600">
                  {t("لقد تمت دعوة الطالب بنجاح")}
                </p>
                <p className="text-lg font-semibold text-blue-600">
                  {student.user.firstName} {student.user.lastName}
                </p>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-3 font-semibold text-white transition duration-300 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:shadow-xl"
                  onClick={() => {
                    setShowPopup(false);
                    history.push("/parent/home");
                  }}
                >
                  {t("الذهاب إلى الصفحة الرئيسية")}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {role == "Student" ? (
        <StudentNavbar />
      ) : role == "Teacher" ? (
        <TeacherNavbar />
      ) : (
        <ParentNavbar />
      )}
    </div>
  );
};

export default TeacherView;
