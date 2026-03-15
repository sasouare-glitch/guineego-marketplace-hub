/**
 * SUBSCRIPTION WEBHOOKS: Mobile Money Callback Handlers for Seller Plans
 * Confirms pending subscription payments and activates the new plan
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface SubscriptionWebhookData {
  transactionId: string;
  amount: number;
  phone: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SUCCESSFUL';
  reference: string; // paymentDocId
  sellerId: string;
  provider: 'orange_money' | 'mtn_money';
  reason?: string;
}

/**
 * Confirm a pending subscription payment and activate the plan
 * REST endpoint: /confirmSubscriptionPayment
 */
export const confirmSubscriptionPayment = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const data = req.body as SubscriptionWebhookData;
      console.log('Subscription webhook received:', data);

      // Normalize status (MTN uses SUCCESSFUL, OM uses SUCCESS)
      const normalizedStatus = data.status === 'SUCCESSFUL' ? 'SUCCESS' : data.status;

      // Find the pending subscription payment
      // Strategy: search by reference (paymentDocId) or by sellerId + pending status
      let paymentDoc: admin.firestore.QueryDocumentSnapshot | null = null;
      let sellerId: string | null = data.sellerId || null;

      if (data.reference) {
        // Direct lookup by payment doc ID across all seller_settings
        const allSettingsSnap = await db.collectionGroup('subscription_payments')
          .where('status', '==', 'pending')
          .get();

        for (const doc of allSettingsSnap.docs) {
          if (doc.id === data.reference) {
            paymentDoc = doc;
            // Extract sellerId from path: seller_settings/{sellerId}/subscription_payments/{paymentId}
            sellerId = doc.ref.parent.parent?.id || null;
            break;
          }
        }
      }

      // Fallback: find by sellerId
      if (!paymentDoc && sellerId) {
        const pendingQuery = await db
          .collection('seller_settings')
          .doc(sellerId)
          .collection('subscription_payments')
          .where('status', '==', 'pending')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (!pendingQuery.empty) {
          paymentDoc = pendingQuery.docs[0];
        }
      }

      if (!paymentDoc || !sellerId) {
        console.error('Pending subscription payment not found:', data);
        res.status(404).json({ success: false, error: 'Pending payment not found' });
        return;
      }

      const paymentData = paymentDoc.data();

      if (normalizedStatus === 'SUCCESS') {
        // 1. Mark payment as completed
        await paymentDoc.ref.update({
          status: 'completed',
          providerTransactionId: data.transactionId,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Activate the new plan on seller_settings
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db.collection('seller_settings').doc(sellerId).update({
          subscription: {
            planId: paymentData.planId,
            planName: paymentData.planName,
            subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 3. Notify seller
        await sendNotification({
          userId: sellerId,
          type: 'payment_received',
          title: 'Abonnement activé !',
          body: `Votre plan ${paymentData.planName} est maintenant actif pour 30 jours.`,
          data: { planId: paymentData.planId },
        });

        console.log(`Subscription activated: ${sellerId} → ${paymentData.planId}`);
        res.status(200).json({ success: true, planId: paymentData.planId });

      } else if (normalizedStatus === 'FAILED') {
        // Mark payment as failed — plan stays unchanged
        await paymentDoc.ref.update({
          status: 'failed',
          failureReason: data.reason || 'Paiement mobile money échoué',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await sendNotification({
          userId: sellerId,
          type: 'payment_received',
          title: 'Paiement échoué',
          body: `Le paiement pour le plan ${paymentData.planName} a échoué. Veuillez réessayer.`,
          data: { planId: paymentData.planId },
        });

        console.log(`Subscription payment failed: ${sellerId}`);
        res.status(200).json({ success: true, status: 'failed' });

      } else {
        // Still pending
        res.status(200).json({ success: true, status: 'pending' });
      }

    } catch (error) {
      console.error('Error processing subscription webhook:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });
