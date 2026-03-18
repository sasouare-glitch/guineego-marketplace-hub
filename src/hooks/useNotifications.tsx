import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { Notification as NotificationData } from "@/types/notifications";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";

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
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<globalThis.NotificationPermission | "default">("default");
  const { user } = useAuth();

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(globalThis.Notification.permission);
    }
  }, []);

  // Listen to Firestore notifications in real-time
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = safeOnSnapshot(
      q,
      (snapshot: any) => {
        const notifs: NotificationData[] = snapshot.docs.map((docSnap: any) => {
          const data = docSnap.data();
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || new Date().toISOString();

          return {
            id: docSnap.id,
            type: data.type || "system",
            title: data.title || data.body || "",
            message: data.message || data.body || "",
            orderId: data.data?.orderId || data.orderId,
            data: data.data || undefined,
            read: data.read ?? false,
            createdAt,
          };
        });
        setNotifications(notifs);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      },
      'NotificationProvider'
    );

    return unsubscribe;
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.uid, notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, "notifications", n.id));
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }, [user?.uid, notifications]);

  const addNotification = useCallback(async (notification: Omit<NotificationData, "id" | "read" | "createdAt">) => {
    if (!user?.uid) return;
    try {
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        body: notification.message,
        orderId: notification.orderId || null,
        data: notification.orderId ? { orderId: notification.orderId } : {},
        read: false,
        createdAt: serverTimestamp(),
      });

      toast(notification.title, { description: notification.message });

      if (permissionStatus === "granted" && "Notification" in window) {
        new globalThis.Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        });
      }
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  }, [user?.uid, permissionStatus]);

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
