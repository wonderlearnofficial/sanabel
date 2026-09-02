import { API_BASE_URL } from "../config/api";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { describeApiError } from "../utils/apiError";
import { AudioManager } from "../utils/AudioManager";
import { GameplayAction, gameplayEndpoints, gameplaySound, reconcileGameplay } from "../utils/gameplay";
import { toFiniteNumber } from "../utils/numericData";
import { localStore } from "../utils/safeStorage";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// Define the shape of the user data for different roles
interface BaseUser {
  completedTasks?: { date: string; taskIds: number[] };
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
  mutateStudent: (action: GameplayAction, body?: Record<string, unknown>) => Promise<any>;
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
  const { t } = useTranslation();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // Start in loading state so protected pages do not interpret the first render
  // (before this provider's effect runs) as a missing session.
  const [isLoading, setIsLoading] = useState(true);

  const requestVersion = useRef(0);
  const mutationInFlight = useRef(false);
  const currentUser = useRef<User | null>(null);
  currentUser.current = user;

  const mutateStudent = useCallback(async (action: GameplayAction, body: Record<string, unknown> = {}) => {
    const token = localStore.getItem("token");
    const reject = (message: string) => Object.assign(new Error(message), { response: { status: 400, data: { message } } });
    if (!token || !currentUser.current) throw reject("يرجى تسجيل الدخول أولاً");
    if (mutationInFlight.current) throw reject("يرجى الانتظار حتى تكتمل العملية الحالية");
    mutationInFlight.current = true;
    ++requestVersion.current;
    AudioManager.unlock();
    try {
      const endpoint = gameplayEndpoints[action];
      const response = await axios.request({
        method: endpoint.method, url: `${API_BASE_URL}/students/${endpoint.path}`,
        data: body, headers: { Authorization: `Bearer ${token}` }, timeout: 15000,
      });
      if (token !== localStore.getItem("token") || !currentUser.current) throw reject("يرجى تسجيل الدخول أولاً");
      const previous = currentUser.current;
      const next = reconcileGameplay(previous, response.data);
      currentUser.current = next;
      setUser(next);
      setRefreshError(null);
      if (!response.data.alreadyCompleted) {
        AudioManager.play(gameplaySound(action, previous.xp, next.xp), true);
      }
      return response;
    } finally {
      ++requestVersion.current;
      mutationInFlight.current = false;
      setIsLoading(false);
    }
  }, []);

  // Function to fetch user data based on role
  const fetchUserData = useCallback(async (token?: string) => {
    const version = ++requestVersion.current;
    const authToken = token || localStore.getItem("token");
    const role = localStore.getItem("role");

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
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (version !== requestVersion.current || mutationInFlight.current || authToken !== localStore.getItem("token")) return;
      if (response.status === 200) {
        setRefreshError(null);
        const userData = response.data.data;

        // Handle different response structures based on role
        switch (role) {
          case "Student":
            setUser({
              id: userData.student.id,
              completedTasks: userData.completedTasks,
              firstName: userData.student.user.firstName,
              lastName: userData.student.user.lastName,
              email: userData.student.user.email,
              role: role,
              grade: userData.student.grade,
              gradeId: userData.student.gradeId,
              classname: userData.student.Class?.classname || userData.student.class?.classname || null,
              gradeName: userData.student.GradeEntity?.name || userData.student.Class?.GradeEntity?.name || userData.student.class?.GradeEntity?.name || userData.student.grade || null,
              snabelRed: toFiniteNumber(userData.student.snabelRed),
              snabelBlue: toFiniteNumber(userData.student.snabelBlue),
              snabelYellow: toFiniteNumber(userData.student.snabelYellow),
              xp: toFiniteNumber(userData.student.xp),
              water: toFiniteNumber(userData.student.water),
              fertilizer: toFiniteNumber(userData.student.seeders),
              connectCode: userData.student.connectCode,
              canAssignTask: userData.student.canAssignTask,
              classId: userData.student.classId,
              organizationId: userData.student.organizationId,
              waterNeeded: toFiniteNumber(userData.treePoint?.water),
              fertilizerNeeded: toFiniteNumber(userData.treePoint?.seeders),
              treeStage: toFiniteNumber(userData.treePoint?.stage),
              treeProgress: toFiniteNumber(userData.student.treeProgress),
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


      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (version === requestVersion.current) setRefreshError(describeApiError(error));
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserData();
    const refresh = () => { if (!mutationInFlight.current) void fetchUserData(); };
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      ++requestVersion.current;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [fetchUserData]);

  useEffect(() => {
    // A calendar boundary, not a delay used to synchronize mutations. The
    // backend remains authoritative for which tasks belong to the new day.
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnightRefresh = () => {
      const nextMidnight = new Date();
      nextMidnight.setUTCHours(24, 0, 0, 0);
      timer = setTimeout(() => {
        void fetchUserData();
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - Date.now());
    };
    scheduleMidnightRefresh();
    return () => clearTimeout(timer);
  }, [fetchUserData]);

  useEffect(() => {
    let checkInFlight = false;

    const validateOpenSession = async () => {
      const token = localStore.getItem("token");
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
      value={{ user, setUser, refreshUserData: fetchUserData, isLoading, mutateStudent }}
    >
      {refreshError && (
        <div role="alert" className="bg-red-50 text-red-800 p-3">
          {t("تعذر تحديث بيانات الطالب")}: {t(refreshError)}
          <button type="button" onClick={() => void fetchUserData()}>{t("إعادة المحاولة")}</button>
        </div>
      )}
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
