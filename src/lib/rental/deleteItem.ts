/**
 * Delete a rental item: Firestore doc + storage images (best-effort).
 * Authorized via Firestore rules: owner (active lessor) or strict admin.
 */
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";

export async function deleteRentalItem(itemId: string, images?: string[]) {
  // Best-effort image cleanup (ignore errors: rules may forbid for admin on owner path)
  if (Array.isArray(images)) {
    await Promise.all(
      images.map(async (url) => {
        try {
          if (!url) return;
          const r = ref(storage, url);
          await deleteObject(r);
        } catch (err) {
          console.warn("[deleteRentalItem] image cleanup failed", err);
        }
      })
    );
  }
  await deleteDoc(doc(db, "rental_items", itemId));
}
