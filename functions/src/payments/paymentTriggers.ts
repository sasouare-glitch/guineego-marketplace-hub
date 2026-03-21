/**
 * PAYMENTS TRIGGERS: Firestore Triggers for Payments
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// Notification utils available if needed

const db = admin.firestore();

/**
 * Trigger: Payment Completed
 * - Update order status
 * - Update seller stats
 * - Log analytics
 */
export const onPaymentCompleted = functions
  .region('europe-west1')
  .firestore.document('payments/{paymentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const paymentId = context.params.paymentId;

    // Only process status changes to completed
    if (before.status === after.status || after.status !== 'completed') {
      return;
    }

    try {
      // Log payment analytics
      await db.collection('analytics_events').add({
        event: 'payment_completed',
        paymentId,
        orderId: after.orderId,
        customerId: after.customerId,
        amount: after.amount,
        method: after.method,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update daily revenue stats
      const today = new Date().toISOString().split('T')[0];
      const statsRef = db.collection('daily_stats').doc(today);
      
      await statsRef.set({
        date: today,
        totalRevenue: admin.firestore.FieldValue.increment(after.amount),
        totalOrders: admin.firestore.FieldValue.increment(1),
        paymentMethods: {
          [after.method]: admin.firestore.FieldValue.increment(1)
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`Payment ${paymentId} completed successfully`);

    } catch (error) {
      console.error('Error in onPaymentCompleted:', error);
    }
  });
