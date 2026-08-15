import { API_BASE_URL } from "../config/api";
import axios from "axios";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the shape of the user data for different roles
interface BaseUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImg: object | null;
  gender?: string;
  dateOfBirth?: string | null;
  isAccess?: boolean;
  grade: number;
  gradeId?: number | null;
  snabelRed: number;
  snabelBlue: number;
  snabelYellow: number;
  xp: number;
  water: number;
  fertilizer: number;
  waterNeeded: number;
  fertilizerNeeded: number;
  treeStage: number;
  treeProgress: number;
  connectCode: string;
  canAssignTask: boolean;
  classId?: number | null;
  organizationId?: number | null;
  seenGuides: string[];
}

interface StudentUser extends BaseUser {
  grade: number;
  gradeId?: number | null;
  classname?: string | null;
  gradeName?: string | null;
  snabelRed: number;
  snabelBlue: number;
  snabelYellow: number;
  xp: number;
  water: number;
  fertilizer: number;
  waterNeeded: number;
  fertilizerNeeded: number;
  treeStage: number;
  treeProgress: number;
  connectCode: string;
  canAssignTask: boolean;
}

interface TeacherUser extends BaseUser {
  organizationId: number;
}

interface ParentUser extends BaseUser {
  // Add parent-specific fields here if needed
}

interface AdminUser extends BaseUser {
  // Admin has no extra fields beyond BaseUser
}

type User = StudentUser | TeacherUser | ParentUser | AdminUser;

interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUserData: (token?: string) => Promise<void>;
  isLoading: boolean;
}

// Create the context
const UserContext = createContext<UserContextProps | undefined>(undefined);

// API endpoints mapping
const API_ENDPOINTS = {
  Student: `${API_BASE_URL}/students/data`,
  Teacher: `${API_BASE_URL}/teachers/teacher-data`,
  Parent: `${API_BASE_URL}/parents/parent-data`,
  Admin: `${API_BASE_URL}/admin/me`,
};

// Provide the context
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  // Start in loading state so protected pages do not interpret the first render
  // (before this provider's effect runs) as a missing session.
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch user data based on role
  const fetchUserData = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!authToken || !role) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = API_ENDPOINTS[role as keyof typeof API_ENDPOINTS];

      if (!endpoint) {
        console.error(`Unknown role: ${role}`);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 200) {
        const userData = response.data.data;

        // Handle different response structures based on role
        switch (role) {
          case "Student":
            setUser({
              id: userData.student.id,
              firstName: userData.student.user.firstName,
              lastName: userData.student.user.lastName,
              email: userData.student.user.email,
              role: role,
              grade: userData.student.grade,
              gradeId: userData.student.gradeId,
              classname: userData.student.Class?.classname || userData.student.class?.classname || null,
              gradeName: userData.student.GradeEntity?.name || userData.student.Class?.GradeEntity?.name || userData.student.class?.GradeEntity?.name || userData.student.grade || null,
              snabelRed: userData.student.snabelRed,
              snabelBlue: userData.student.snabelBlue,
              snabelYellow: userData.student.snabelYellow,
              xp: userData.student.xp,
              water: userData.student.water,
              fertilizer: userData.student.seeders,
              connectCode: userData.student.connectCode,
              canAssignTask: userData.student.canAssignTask,
              classId: userData.student.classId,
              organizationId: userData.student.organizationId,
              waterNeeded: userData.treePoint.water,
              fertilizerNeeded: userData.treePoint.seeders,
              treeStage: userData.treePoint.stage,
              treeProgress: userData.treePoint.treeProgress,
              profileImg: userData.student.user.profileImg,
              gender: userData.student.user.gender,
              dateOfBirth: userData.student.user.dateOfBirth,
              isAccess: userData.student.user.isAccess,
              seenGuides: userData.student.user.seenGuides || [],
            } as StudentUser);
            break;

          case "Teacher":
            setUser({
              id: userData.id, // Assuming teacher data structure has id directly
              firstName: userData.user.firstName,
              lastName: userData.user.lastName,
              email: userData.user.email,
              role: role,
              organizationId: userData.organizationId,
              profileImg: userData.user.profileImg,
              gender: userData.user.gender,
              dateOfBirth: userData.user.dateOfBirth,
              isAccess: userData.user.isAccess,
              seenGuides: userData.user.seenGuides || [],
              // Default values for teacher (you may need to adjust based on actual API response)
              grade: 0,
              snabelRed: 0,
              snabelBlue: 0,
              snabelYellow: 0,
              xp: 0,
              water: 0,
              fertilizer: 0,
              waterNeeded: 0,
              fertilizerNeeded: 0,
              treeStage: 0,
              treeProgress: 0,
              connectCode: "",
              canAssignTask: false,
            } as TeacherUser);
            break;

          case "Parent":
            setUser({
              id: userData.id, // Assuming parent data structure has id directly
              firstName: userData.user.firstName,
              lastName: userData.user.lastName,
              email: userData.user.email,
              role: role,
              profileImg: userData.user.profileImg,
              gender: userData.user.gender,
              dateOfBirth: userData.user.dateOfBirth,
              isAccess: userData.user.isAccess,
              seenGuides: userData.user.seenGuides || [],
              // Default values for parent (you may need to adjust based on actual API response)
              grade: 0,
              snabelRed: 0,
              snabelBlue: 0,
              snabelYellow: 0,
              xp: 0,
              water: 0,
              fertilizer: 0,
              waterNeeded: 0,
              fertilizerNeeded: 0,
              treeStage: 0,
              treeProgress: 0,
              connectCode: "",
              canAssignTask: false,
            } as ParentUser);
            break;

          case "Admin":
            setUser({
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              role: role,
              profileImg: userData.profileImg ?? null,
              gender: userData.gender,
              dateOfBirth: userData.dateOfBirth,
              isAccess: userData.isAccess,
              seenGuides: userData.seenGuides || [],
              grade: 0,
              snabelRed: 0,
              snabelBlue: 0,
              snabelYellow: 0,
              xp: 0,
              water: 0,
              fertilizer: 0,
              waterNeeded: 0,
              fertilizerNeeded: 0,
              treeStage: 0,
              treeProgress: 0,
              connectCode: "",
              canAssignTask: false,
            } as AdminUser);
            break;

          default:
            console.error(`Unhandled role: ${role}`);
        }

        console.log("User data:", userData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    let checkInFlight = false;

    const validateOpenSession = async () => {
      const token = localStorage.getItem("token");
      if (!token || checkInFlight) return;

      checkInFlight = true;
      try {
        await axios.get(`${API_BASE_URL}/users/session`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Confirmed deletion/expiry is handled by the global axios interceptor.
        // Network and server outages deliberately leave the local session intact.
      } finally {
        checkInFlight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void validateOpenSession();
      }
    };

    void validateOpenSession();
    const intervalId = window.setInterval(validateOpenSession, 10_000);
    window.addEventListener("focus", validateOpenSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", validateOpenSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ user, setUser, refreshUserData: fetchUserData, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUserContext = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

// Type guards to check user role
export const isStudent = (user: User | null): user is StudentUser => {
  return user?.role === "Student";
};

export const isTeacher = (user: User | null): user is TeacherUser => {
  return user?.role === "Teacher";
};

export const isParent = (user: User | null): user is ParentUser => {
  return user?.role === "Parent";
};

export const isAdmin = (user: User | null): user is AdminUser => {
  return user?.role === "Admin";
};
