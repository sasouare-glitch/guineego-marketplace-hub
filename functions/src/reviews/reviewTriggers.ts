/**
 * REVIEWS TRIGGERS
 * Recalcule avgRating et reviewsCount sur le produit lorsqu'un avis
 * est créé, modifié ou supprimé avec un impact sur les avis approuvés.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface ReviewData {
  productId?: string;
  rating?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Recalcule les agrégats (avgRating, reviewsCount) d'un produit
 * à partir de tous ses avis "approved".
 */
async function recomputeProductRating(productId: string): Promise<void> {
  if (!productId) return;

  const snap = await db
    .collection('reviews')
    .where('productId', '==', productId)
    .where('status', '==', 'approved')
    .get();

  let total = 0;
  let count = 0;
  snap.forEach((doc) => {
    const r = (doc.data().rating as number) || 0;
    if (r > 0) {
      total += r;
      count += 1;
    }
  });

  const avgRating = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

  await db.collection('products').doc(productId).set(
    {
      avgRating,
      reviewsCount: count,
      ratingUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `[reviews] product ${productId} updated: avgRating=${avgRating}, reviewsCount=${count}`
  );
}

export const onReviewWritten = functions
  .region('europe-west1')
  .firestore.document('reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? (change.before.data() as ReviewData) : null;
    const after = change.after.exists ? (change.after.data() as ReviewData) : null;

    const beforeApproved = before?.status === 'approved';
    const afterApproved = after?.status === 'approved';

    // Aucun impact sur les agrégats si l'avis n'a jamais été approuvé
    if (!beforeApproved && !afterApproved) {
      return;
    }

    // Cas: statut, note ou productId modifiés -> recompute
    const productIds = new Set<string>();
    if (before?.productId) productIds.add(before.productId);
    if (after?.productId) productIds.add(after.productId);

    try {
      await Promise.all(
        Array.from(productIds).map((pid) => recomputeProductRating(pid))
      );
    } catch (error) {
      console.error('[onReviewWritten] error:', error, 'reviewId=', context.params.reviewId);
    }
  });
