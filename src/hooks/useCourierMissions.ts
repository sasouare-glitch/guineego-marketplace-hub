import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
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
  in_transit: "in_delivery",
  delivered: "delivered",
};

export function useCourierMissions() {
  const { user } = useAuth();
  const [available, setAvailable] = useState<DeliveryMission[]>([]);
  const [myMissions, setMyMissions] = useState<DeliveryMission[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available (pending) missions
  useEffect(() => {
    const q = query(
      collection(db, "deliveries"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAvailable(snap.docs.map((d) => ({ ...d.data(), id: d.id } as DeliveryMission)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching available missions:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
