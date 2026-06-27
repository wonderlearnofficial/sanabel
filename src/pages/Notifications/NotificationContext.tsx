import React, { createContext, useContext, useState, ReactNode } from "react";

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
  notifications: TrophyNotification[];
  addTrophyNotification: (
    notification: Omit<TrophyNotification, "id" | "timestamp" | "isRead">
  ) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<TrophyNotification[]>([]);

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

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addTrophyNotification,
        markAsRead,
        clearAll,
        unreadCount,
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
