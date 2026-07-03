import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export interface TrophyNotification {
  id: string;
  trophyTitle: string;
  trophyImage: string;
  milestone: number;
  rewards: Array<{
    value: number;
    icon: string;
    type: string;
  }>;
  description: string;
  timestamp: Date;
  isRead: boolean;
}

interface NotificationContextType {
  // Compatibility fields
  notifications: TrophyNotification[];
  addTrophyNotification: (
    notification: Omit<TrophyNotification, "id" | "timestamp" | "isRead">
  ) => void;
  clearAll: () => void;

  // New fields for completed trophies
  allTrophies: any[];
  readChallengeIds: number[];
  markAsRead: (challengeId: number) => void;
  markAllAsRead: (challengeIds: number[]) => void;
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<TrophyNotification[]>([]);
  const [allTrophies, setAllTrophies] = useState<any[]>([]);
  const [readChallengeIds, setReadChallengeIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize read IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("read_trophy_challenge_ids");
    if (stored) {
      try {
        setReadChallengeIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse read trophy ids", e);
      }
    }
  }, []);

  const saveReadChallengeIds = (ids: number[]) => {
    setReadChallengeIds(ids);
    localStorage.setItem("read_trophy_challenge_ids", JSON.stringify(ids));
  };

  const refreshNotifications = async () => {
    const authToken = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!authToken || role !== "Student") {
      setAllTrophies([]);
      return;
    }
    setIsLoading(true);
    try {
      const [sanabelRes, otherRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students/student-trophy-primaire-completed`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_BASE_URL}/students/student-trophy-secondaire-completed`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      if (sanabelRes.status === 200 && otherRes.status === 200) {
        setAllTrophies([...sanabelRes.data.data, ...otherRes.data.data]);
      }
    } catch (error) {
      console.error("Error fetching trophies in provider:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications on mount and when storage event fires (e.g. login)
  useEffect(() => {
    refreshNotifications();

    const handleStorageChange = () => {
      refreshNotifications();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // For compatibility with old system
  const addTrophyNotification = (
    notification: Omit<TrophyNotification, "id" | "timestamp" | "isRead">
  ) => {
    const newNotification: TrophyNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (challengeId: number) => {
    if (!readChallengeIds.includes(challengeId)) {
      saveReadChallengeIds([...readChallengeIds, challengeId]);
    }
  };

  const markAllAsRead = (challengeIds: number[]) => {
    const newIds = [...readChallengeIds];
    challengeIds.forEach((id) => {
      if (!newIds.includes(id)) {
        newIds.push(id);
      }
    });
    saveReadChallengeIds(newIds);
  };

  // Unread count is unread trophies (plus any local compatibility notifications that are unread)
  const unreadTrophiesCount = allTrophies.filter(
    (trophy) => !readChallengeIds.includes(trophy.challengeId)
  ).length;

  const unreadLocalCount = notifications.filter((n) => !n.isRead).length;
  const unreadCount = unreadTrophiesCount + unreadLocalCount;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addTrophyNotification,
        clearAll,
        allTrophies,
        readChallengeIds,
        markAsRead,
        markAllAsRead,
        unreadCount,
        isLoading,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
