/**
 * Hook: useLessorRentalBookings
 * Liste les réservations de location pour un loueur (ownerId).
 */
import { useEffect, useState } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import type { RentalBooking } from "@/types/rental";

export function useLessorRentalBookings(ownerId: string | undefined) {
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "rental_bookings"),
        where("ownerId", "==", ownerId),
        orderBy("createdAt", "desc")
      );
      const unsub = safeOnSnapshot(
        q as any,
        (snap: any) => {
          const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as RentalBooking[];
          setBookings(data);
          setLoading(false);
        },
        (err) => {
          console.error("[useLessorRentalBookings] error", err);
          setLoading(false);
        },
        "useLessorRentalBookings"
      );
      return unsub;
    } catch (e) {
      console.error("[useLessorRentalBookings] init error", e);
      setLoading(false);
    }
  }, [ownerId]);

  return { bookings, loading };
}
