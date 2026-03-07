import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, doc, deleteDoc,
  updateDoc, addDoc, serverTimestamp, Timestamp, limit, writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  audience: string;
  status: string;
  read: boolean;
  sentAt: string;
  userId?: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AdminNotification[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt || Date.now());

        return {
          id: docSnap.id,
          title: data.title || "",
          body: data.message || data.body || "",
          type: data.type || "system",
          audience: data.audience || (data.userId ? "user" : "all"),
          status: data.status || "sent",
          read: data.read ?? false,
          sentAt: createdAt.toLocaleString("fr-GN", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
          }),
          userId: data.userId,
        };
      });
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to admin notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendNotification = useCallback(async (data: {
    title: string;
    body: string;
    audience: string;
    type: string;
  }) => {
    try {
      await addDoc(collection(db, "notifications"), {
        title: data.title,
        message: data.body,
        body: data.body,
        type: data.type,
        audience: data.audience,
        status: "sent",
        read: false,
        createdAt: serverTimestamp(),
      });
      toast.success("Notification envoyée !");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Erreur lors de l'envoi");
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sentCount = notifications.filter((n) => n.status === "sent").length;
  const scheduledCount = notifications.filter((n) => n.status === "scheduled").length;

  return {
    notifications, loading, unreadCount, sentCount, scheduledCount,
    sendNotification, deleteNotification, markAsRead,
  };
}
