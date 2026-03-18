import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { useAlertSound, type AlertSoundType } from "@/hooks/useAlertSound";
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import { toast } from "sonner";

export type DeliveryStatus =
  | "pending"
  | "accepted"
  | "pickup_started"
  | "picked_up"
  | "in_transit"
  | "arrived"
  | "delivered"
  | "cancelled";

export interface DeliveryMission {
  id: string;
  orderId: string;
  customerId: string;
  sellerIds?: string[];
  pickup: {
    address: string;
    commune: string;
    phone: string;
    instructions?: string;
  };
  delivery: {
    address: string;
    commune: string;
    phone?: string;
    fullName?: string;
  };
  priority: "normal" | "express";
  fee: number;
  estimatedTime: number;
  status: DeliveryStatus;
  assignedCourier: string | null;
  statusHistory: { status: string; timestamp: Timestamp; note?: string }[];
  createdAt?: Timestamp;
  deliveredAt?: Timestamp;
}

// Map delivery status → order status
const orderStatusMap: Record<string, string> = {
  accepted: "shipped",
  picked_up: "in_delivery",
  in_transit: "in_delivery",
  delivered: "delivered",
};

export function useCourierMissions() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<DeliveryMission[]>([]);
  const [myMissions, setMyMissions] = useState<DeliveryMission[]>([]);
  const [loading, setLoading] = useState(true);
  const { playUrgentAlert } = useAlertSound();
  const prevMissionIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const courierSettingsRef = useRef<{
    soundAlerts: boolean;
    alertVolume: number;
    alertSoundType: AlertSoundType;
    vibrationEnabled: boolean;
  }>({ soundAlerts: true, alertVolume: 0.5, alertSoundType: "classic", vibrationEnabled: true });

  // Load courier alert preferences
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "courier_settings", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        courierSettingsRef.current = {
          soundAlerts: data.soundAlerts ?? true,
          alertVolume: data.alertVolume ?? 0.5,
          alertSoundType: data.alertSoundType ?? "classic",
          vibrationEnabled: data.vibrationEnabled ?? true,
        };
      }
    }).catch(() => {});
  }, [user?.uid]);

  // Fetch available (pending) missions + play sound for new express ones
  useEffect(() => {
    const q = query(
      collection(db, "deliveries"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const missions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as DeliveryMission));
      
      // Detect new express missions (skip initial load)
      if (!isInitialLoadRef.current) {
        const prevIds = prevMissionIdsRef.current;
        const hasNewUrgent = missions.some(
          (m) => !prevIds.has(m.id) && m.priority === "express"
        );
        if (hasNewUrgent) {
          const prefs = courierSettingsRef.current;
          if (prefs.soundAlerts) {
            playUrgentAlert({
              volume: prefs.alertVolume,
              soundType: prefs.alertSoundType,
              vibrate: prefs.vibrationEnabled,
            });
          }
          toast.warning("⚡ Nouvelle mission EXPRESS disponible !", {
            duration: 6000,
          });
        } else {
          const hasNewNormal = missions.some((m) => !prevIds.has(m.id));
          if (hasNewNormal) {
            toast.info("📦 Nouvelle mission disponible");
          }
        }
      }
      isInitialLoadRef.current = false;
      prevMissionIdsRef.current = new Set(missions.map((m) => m.id));

      setAvailable(missions);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching available missions:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [playUrgentAlert]);

  // Fetch courier's own missions (accepted+)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "deliveries"),
      where("assignedCourier", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyMissions(snap.docs.map((d) => ({ ...d.data(), id: d.id } as DeliveryMission)));
    });
    return () => unsub();
  }, [user]);

  // Accept a mission
  const acceptMission = async (missionId: string) => {
    if (!user) return;
    try {
      const missionRef = doc(db, "deliveries", missionId);
      const statusEntry = {
        status: "accepted",
        timestamp: Timestamp.now(),
        performedBy: user.uid,
        note: "Mission acceptée par le coursier",
      };
      await updateDoc(missionRef, {
        status: "accepted",
        assignedCourier: user.uid,
        acceptedAt: serverTimestamp(),
        statusHistory: arrayUnion(statusEntry),
        updatedAt: serverTimestamp(),
      });

      // Also update the linked order
      const mission = [...available, ...myMissions].find((m) => m.id === missionId);
      if (mission?.orderId) {
        await updateDoc(doc(db, "orders", mission.orderId), {
          assignedCourier: user.uid,
          status: "shipped",
          statusHistory: arrayUnion({
            status: "shipped",
            timestamp: Timestamp.now(),
            performedBy: user.uid,
            role: "courier",
            note: "Coursier assigné",
          }),
          updatedAt: serverTimestamp(),
        });
      }

      toast.success("Mission acceptée !");
    } catch (error: any) {
      console.error("Error accepting mission:", error);
      toast.error("Erreur lors de l'acceptation");
    }
  };

  // Update mission status (pickup, in_transit, arrived, delivered)
  const updateMissionStatus = async (
    missionId: string,
    newStatus: DeliveryStatus,
    note?: string
  ) => {
    if (!user) return;
    try {
      const missionRef = doc(db, "deliveries", missionId);
      const statusEntry = {
        status: newStatus,
        timestamp: Timestamp.now(),
        performedBy: user.uid,
        note: note || null,
      };

      const updateData: any = {
        status: newStatus,
        statusHistory: arrayUnion(statusEntry),
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "delivered") {
        updateData.deliveredAt = serverTimestamp();
      }

      await updateDoc(missionRef, updateData);

      // Sync order status
      const mission = myMissions.find((m) => m.id === missionId);
      if (mission?.orderId && orderStatusMap[newStatus]) {
        await updateDoc(doc(db, "orders", mission.orderId), {
          status: orderStatusMap[newStatus],
          statusHistory: arrayUnion({
            status: orderStatusMap[newStatus],
            timestamp: Timestamp.now(),
            performedBy: user.uid,
            role: "courier",
            note: note || null,
          }),
          updatedAt: serverTimestamp(),
        });
      }

      toast.success(`Statut mis à jour : ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating mission status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return {
    available,
    myMissions,
    loading,
    acceptMission,
    updateMissionStatus,
  };
}
