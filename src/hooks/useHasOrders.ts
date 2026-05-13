import { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the connected user has at least one order in Firestore.
 * Used to conditionally show "Mes commandes" / "Suivre ma commande" entries.
 */
export function useHasOrders() {
  const { user } = useAuth();
  const [hasOrders, setHasOrders] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

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

    getDocs(q)
      .then((snap) => {
        if (!cancelled) {
          setHasOrders(!snap.empty);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[useHasOrders] error:", err);
        if (!cancelled) {
          setHasOrders(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { hasOrders, loading };
}
