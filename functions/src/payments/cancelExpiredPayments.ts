/**
 * Scheduled function: cancels pending subscription payments
 * older than 15 minutes without webhook confirmation.
 * Runs every 5 minutes.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();
const TIMEOUT_MINUTES = 15;

export const cancelExpiredPayments = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

    // Query all seller_settings documents
    const sellersSnap = await db.collection('seller_settings').get();

    let cancelled = 0;

    for (const sellerDoc of sellersSnap.docs) {
      const paymentsSnap = await sellerDoc.ref
        .collection('subscription_payments')
        .where('status', '==', 'pending')
        .where('createdAt', '<=', cutoff)
        .get();

      for (const paymentDoc of paymentsSnap.docs) {
        const paymentData = paymentDoc.data();
        await paymentDoc.ref.update({
          status: 'cancelled',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelReason: 'timeout_15min',
        });

        // Notify seller
        await sendNotification({
          userId: sellerDoc.id,
          type: 'payment_received',
          title: 'Paiement expiré',
          body: `Votre paiement de ${(paymentData.amount || 0).toLocaleString()} GNF pour le plan ${paymentData.plan || ''} a été annulé après 15 min sans confirmation.`,
          data: { paymentId: paymentDoc.id, reason: 'timeout_15min' },
        });

        cancelled++;
      }
    }

    if (cancelled > 0) {
      functions.logger.info(`Cancelled ${cancelled} expired pending payment(s).`);
    }

    return null;
  });
