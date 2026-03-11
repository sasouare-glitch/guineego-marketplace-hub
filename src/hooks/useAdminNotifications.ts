import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, doc, deleteDoc,
  updateDoc, addDoc, serverTimestamp, Timestamp, limit, writeBatch,
  where, getDoc, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

// ─── Channel Preferences ─────────────────────────────────────────────────────

export interface ChannelPreference {
  key: string;
  label: string;
  desc: string;
  push: boolean;
  email: boolean;
  sms: boolean;
}

const DEFAULT_CHANNELS: ChannelPreference[] = [
  { key: 'new_order', label: 'Nouvelles commandes', desc: 'Alerte à chaque nouvelle commande reçue', push: true, email: true, sms: false },
  { key: 'low_stock', label: 'Stock faible', desc: 'Alerte quand un produit passe sous le seuil critique', push: true, email: false, sms: false },
  { key: 'delivery_alert', label: 'Alertes livraison', desc: 'Retards, annulations, livreurs en zone', push: true, email: false, sms: true },
  { key: 'payment', label: 'Paiements & virements', desc: 'Confirmation de paiements et retraits', push: true, email: true, sms: true },
  { key: 'new_seller', label: 'Nouveau vendeur', desc: 'Inscription et validation des e-commerçants', push: true, email: true, sms: false },
  { key: 'report', label: 'Rapports automatiques', desc: 'Rapports quotidiens et hebdomadaires', push: false, email: true, sms: false },
  { key: 'security', label: 'Alertes sécurité', desc: "Connexion suspecte, tentatives d'accès échouées", push: true, email: true, sms: true },
  { key: 'promo', label: 'Campagnes promotionnelles', desc: 'Envoi de promotions aux clients', push: true, email: false, sms: false },
];

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

    return () => { try { unsubscribe(); } catch (e) { /* ignore */ } };
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

  // ─── Channel Preferences (config/notification_channels) ───────────────────

  const [channels, setChannels] = useState<ChannelPreference[]>(DEFAULT_CHANNELS);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState(false);

  useEffect(() => {
    const docRef = doc(db, "config", "notification_channels");
    const unsubChannels = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const saved = data.channels as Record<string, { push: boolean; email: boolean; sms: boolean }> | undefined;
        if (saved) {
          setChannels(DEFAULT_CHANNELS.map(ch => ({
            ...ch,
            push: saved[ch.key]?.push ?? ch.push,
            email: saved[ch.key]?.email ?? ch.email,
            sms: saved[ch.key]?.sms ?? ch.sms,
          })));
        }
      }
      setChannelsLoading(false);
    }, () => setChannelsLoading(false));

    return () => unsubChannels();
  }, []);

  const toggleChannel = useCallback((key: string, channel: 'push' | 'email' | 'sms') => {
    setChannels(prev => prev.map(c =>
      c.key === key ? { ...c, [channel]: !c[channel] } : c
    ));
  }, []);

  const saveChannels = useCallback(async () => {
    setSavingChannels(true);
    try {
      const channelsMap: Record<string, { push: boolean; email: boolean; sms: boolean }> = {};
      channels.forEach(ch => {
        channelsMap[ch.key] = { push: ch.push, email: ch.email, sms: ch.sms };
      });
      await setDoc(doc(db, "config", "notification_channels"), {
        channels: channelsMap,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Préférences enregistrées !");
    } catch (error) {
      console.error("Error saving channel preferences:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingChannels(false);
    }
  }, [channels]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sentCount = notifications.filter((n) => n.status === "sent").length;
  const scheduledCount = notifications.filter((n) => n.status === "scheduled").length;

  return {
    notifications, loading, unreadCount, sentCount, scheduledCount,
    sendNotification, deleteNotification, markAsRead,
    channels, channelsLoading, savingChannels, toggleChannel, saveChannels,
  };
}
