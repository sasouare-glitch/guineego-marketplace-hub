/**
 * Hook: useRentalItems
 * Liste les rental_items (avec filtre catégorie optionnel) via safeOnSnapshot.
 */
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit as fbLimit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import type { RentalItem, RentalCategoryId } from "@/types/rental";

interface Options {
  category?: RentalCategoryId;
  ownerId?: string;
  max?: number;
}

export function useRentalItems(opts: Options = {}) {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const constraints: any[] = [where("status", "==", "active")];
      if (opts.category) constraints.push(where("category", "==", opts.category));
      if (opts.ownerId) constraints.push(where("ownerId", "==", opts.ownerId));
      constraints.push(orderBy("createdAt", "desc"));
      if (opts.max) constraints.push(fbLimit(opts.max));

      const q = query(collection(db, "rental_items"), ...constraints);
      const unsub = safeOnSnapshot(
        q as any,
        (snap: any) => {
          const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as RentalItem[];
          setItems(data);
          setLoading(false);
        },
        () => setLoading(false),
        "useRentalItems"
      );
      return unsub;
    } catch (e) {
      console.error("[useRentalItems] init error", e);
      setLoading(false);
    }
  }, [opts.category, opts.ownerId, opts.max]);

  return { items, loading };
}
