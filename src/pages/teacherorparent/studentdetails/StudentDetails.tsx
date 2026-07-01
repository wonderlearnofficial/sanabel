import { API_BASE_URL } from "../../../config/api";
import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GoBackButton from "../../../components/GoBackButton";
import TeacherNavbar from "../../../components/navbar/TeacherNavbar";
import GetAvatar from "../../student/tutorial/GetAvatar";
import MedalAndLevel from "../../../components/MedalAndLevel";
import { calculateLevel } from "../../../utils/LevelCalculator";
import axios from "axios";

import { IonRouterLink } from "@ionic/react";

import { IoMdSettings } from "react-icons/io";
import edit from "../../../icons/edit.svg";
// overview icons

import LeaderboardIcon from "../../../icons/navbar/LeaderboardsIcon";
import activityDoneImg from "../../../../assets/profile/Medallions.png";
import { useUserContext } from "../../../context/StudentUserProvider";

// Navbar

import StudentProfileTree from "../studentdetails/StudentProfileTree";
import StudentProfileTrophies from "../studentdetails/StudentProfileTrophies";
import StudentProfileActivity from "../studentdetails/StudentProfileActivity";
import StudentProfileOverview from "../studentdetails/StudentProfileOverview";

import { avatars } from "../../../data/Avatars";
import StudentNavbar from "../../../components/navbar/StudentNavbar";
import ParentNavbar from "../../../components/navbar/ParentNavbar";

// Define types for better type safety
interface User {
  firstName: string;
  lastName: string;
  email?: string;
  profileImg: any;
  gender?: string;
  dateOfBirth?: string;
}

interface StudentData {
  id: number;
  userId: number;
  level: number;
  xp: number;
  medal: number;
  connectCode: string;
  snabelRed: number;
  snabelYellow: number;
  snabelBlue: number;
  treeProgress: number;
  treeStage: number;
  createdAt: string;
  updatedAt: string;
  class: any;
  organization: any;
  user: User;
}

interface StudentResponse {
  student: StudentData;
  totalCompletedTasks: number;
  categoryCounts: {
    [key: string]: number;
  };
}

const Profile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const history = useHistory();
  const { t } = useTranslation();
  const [studentData, setStudentData]: any = useState(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const profileNav = ["نظرة عامة", "الشجرة", "الجوائز", "النشاط"];
  const [show, setShow] = useState(profileNav[0]);

  // Fetch student detailed data on component mount
  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const role = localStorage.getItem("role");

  const fetchStudentData = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await axios.get(
        role === "Teacher"
          ? `${API_BASE_URL}/teachers/appear-student-deatiled/${studentId}`
          : `${API_BASE_URL}/parents/appear-student-deatiled/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.status === 200) {
        setStudentData(response.data);
        console.log("Student data profile DETAILS:", studentData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      setError("Failed to load student details");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const student = studentData?.student;
  const totalCompletedTasks = studentData?.totalCompletedTasks;
  const categoryCounts = studentData?.categoryCounts;
  const studentLevel = student ? calculateLevel(student.xp) : 0;

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error || !student) {
    return <div>{error || "Student data not found."}</div>;
  }

  return (
    <div
      className="z-10 flex flex-col items-center justify-between w-full h-full overflow-y-auto"
      id="page-height"
    >
      <div className="flex flex-row-reverse items-center justify-end bg-yellowprimary py-7 w-full  p-4 rounded-b-[25px] ">
        <div className="self-end bg-white flex-center b rounded-xl">
          <GoBackButton />
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-1">
        <div className="w-32 h-32 -mt-6 border-8 border-white rounded-full">
          <GetAvatar userAvatarData={student.user.profileImg} />
        </div>
        <h1 className="text-black">
          {`${student.user.firstName} ${student.user.lastName}`}
        </h1>
        <h1 className="text-[#B3B3B3]"> {t("طالب")}</h1>
        <h1 className="text-[#B3B3B3] capitalize">
          {" "}
          {student.class?.classname}
        </h1>
        <h1 className="text-[#B3B3B3] capitalize">
          {" "}
          {student.class?.category}
        </h1>
      </div>
      {/* Navbar */}
      <div className="flex flex-col justify-between w-full gap-3 p-4">
        <div className="flex items-center w-full gap-1">
          {profileNav.map((item) => (
            <div
              className={`${
                show === item
                  ? "bg-blueprimary text-white"
                  : "bg-[#E6E6E6] text-[#999]"
              }  p-2 rounded-3xl text-sm  w-full text-center`}
              onClick={() => setShow(item)}
            >
              {t(item)}
            </div>
          ))}
        </div>
      </div>
      {show === profileNav[0] && (
        <StudentProfileOverview
          xp={studentData.student.xp}
          categoryCounts={studentData.categoryCounts}
          totalCompletedTasks={studentData.totalCompletedTasks}
        />
      )}
      {show == profileNav[1] && (
        <StudentProfileTree
          treeStage={student.treeStage}
          treeProgress={student.treeProgress}
        />
      )}
      {show === profileNav[2] && (
        <StudentProfileTrophies trophies={student.challengeStudent} />
      )}
      {show == profileNav[3] && (
        <StudentProfileActivity
          recentActivity={student.TasksStudents}
          studentData={studentData}
          totalCompletedTasks={totalCompletedTasks}
          categoryCounts={categoryCounts}
        />
      )}

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

export default Profile;
