import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Notification as NotificationData } from "@/types/notifications";
import { mockNotifications } from "@/types/notifications";
import { toast } from "sonner";

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<NotificationData, "id" | "read" | "createdAt">) => void;
  requestPermission: () => Promise<boolean>;
  permissionStatus: globalThis.NotificationPermission | "default";
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>(mockNotifications);
  const [permissionStatus, setPermissionStatus] = useState<globalThis.NotificationPermission | "default">("default");

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(globalThis.Notification.permission);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const addNotification = (notification: Omit<NotificationData, "id" | "read" | "createdAt">) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // Show toast for new notification
    toast(notification.title, {
      description: notification.message,
    });

    // Show browser notification if permitted
    if (permissionStatus === "granted" && "Notification" in window) {
      new globalThis.Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("Votre navigateur ne supporte pas les notifications");
      return false;
    }

    try {
      const permission = await globalThis.Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        toast.success("Notifications activées !");
        return true;
      } else if (permission === "denied") {
        toast.error("Notifications refusées. Vous pouvez les activer dans les paramètres de votre navigateur.");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        requestPermission,
        permissionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
