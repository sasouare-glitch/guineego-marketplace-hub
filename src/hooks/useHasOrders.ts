import { useEffect, useState } from "react";
import { collection, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the connected user has at least one order in Firestore.
 * Uses a realtime listener so menu entries appear immediately on first order.
 */
export function useHasOrders() {
  const { user } = useAuth();
  const [hasOrders, setHasOrders] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasOrders(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid),
      limit(1)
    );

    const unsub = safeOnSnapshot(
      q,
      (snap: any) => {
        setHasOrders(!snap.empty);
        setLoading(false);
      },
      (err) => {
        console.error("[useHasOrders] error:", err);
        setHasOrders(false);
        setLoading(false);
      }
    );

    return () => {
      try {
        unsub?.();
      } catch {
        /* noop */
      }
    };
  }, [user]);

  return { hasOrders, loading };
}
