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

interface StudentUser extends BaseUser {
  grade: number;
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

type User = StudentUser | TeacherUser | ParentUser;

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
  Student: "https://sanabel.wonderlearn.net/students/data",
  Teacher: "https://sanabel.wonderlearn.net/teachers/teacher-data",
  Parent: "https://sanabel.wonderlearn.net/parents/parent-data",
};

// Provide the context
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch user data based on role
  const fetchUserData = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!authToken || !role) return;

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
              snabelRed: userData.student.snabelRed,
              snabelBlue: userData.student.snabelBlue,
              snabelYellow: userData.student.snabelYellow,
              xp: userData.student.xp,
              water: userData.student.water,
              fertilizer: userData.student.seeders,
              connectCode: userData.student.connectCode,
              canAssignTask: userData.student.canAssignTask,
              waterNeeded: userData.treePoint.water,
              fertilizerNeeded: userData.treePoint.seeders,
              treeStage: userData.treePoint.stage,
              treeProgress: userData.treePoint.treeProgress,
              profileImg: userData.student.user.profileImg,
              gender: userData.student.user.gender,
              dateOfBirth: userData.student.user.dateOfBirth,
              isAccess: userData.student.user.isAccess,
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
