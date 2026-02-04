/**
 * DELIVERIES TRIGGERS: Firestore Triggers for Deliveries
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { updateWalletTransaction } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

/**
 * Trigger: Delivery Status Changed
 * - Pay courier on delivery
 * - Update courier stats
 * - Log analytics
 */
export const onDeliveryStatusChanged = functions
  .region('europe-west1')
  .firestore.document('deliveries/{missionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const missionId = context.params.missionId;

    // Only process status changes
    if (before.status === after.status) {
      return;
    }

    const newStatus = after.status;

    try {
      // Process delivery completion
      if (newStatus === 'delivered') {
        // Pay courier
        const courierDoc = await db.collection('couriers')
          .doc(after.assignedCourierId)
          .get();
        
        if (courierDoc.exists) {
          const courierUserId = courierDoc.data()!.userId;
          
          // Add delivery fee to courier wallet
          await updateWalletTransaction(
            courierUserId,
            after.fee,
            'credit',
            `Livraison mission ${missionId}`,
            { missionId, orderId: after.orderId, type: 'delivery_fee' }
          );

          // Update courier stats
          await courierDoc.ref.update({
            totalDeliveries: admin.firestore.FieldValue.increment(1),
            totalEarnings: admin.firestore.FieldValue.increment(after.fee)
          });

          // Notify courier
          await sendNotification({
            userId: courierUserId,
            type: 'payment_received',
            title: 'Livraison complétée !',
            body: `${after.fee.toLocaleString()} GNF ajoutés à votre solde`,
            data: { missionId, amount: after.fee.toString() }
          });
        }

        // Calculate delivery time
        const deliveryTime = after.deliveredAt && after.acceptedAt
          ? (after.deliveredAt.toMillis() - after.acceptedAt.toMillis()) / 60000
          : null;

        // Log analytics
        await db.collection('analytics_events').add({
          event: 'delivery_completed',
          missionId,
          orderId: after.orderId,
          courierId: after.assignedCourierId,
          fee: after.fee,
          deliveryTimeMinutes: deliveryTime,
          priority: after.priority,
          deliveryCommune: after.delivery.commune,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Mission accepted - notify customer
      if (newStatus === 'accepted') {
        await db.collection('analytics_events').add({
          event: 'delivery_accepted',
          missionId,
          orderId: after.orderId,
          courierId: after.assignedCourierId,
          timeToAcceptSeconds: after.acceptedAt && after.createdAt
            ? (after.acceptedAt.toMillis() - after.createdAt.toMillis()) / 1000
            : null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error in onDeliveryStatusChanged:', error);
    }
  });
