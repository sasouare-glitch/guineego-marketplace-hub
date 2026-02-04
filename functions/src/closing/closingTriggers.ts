/**
 * CLOSING TRIGGERS: Firestore Triggers for Closing
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { updateWalletTransaction } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

/**
 * Trigger: Closing Task Completed
 * - Pay closer commission if converted
 * - Update leaderboard
 */
export const onClosingCompleted = functions
  .region('europe-west1')
  .firestore.document('closing_tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const taskId = context.params.taskId;

    // Only process completion
    if (before.status === after.status || after.status !== 'completed') {
      return;
    }

    try {
      if (after.outcome === 'converted') {
        // Calculate commission
        const commission = Math.floor(after.orderTotal * 0.02);

        // Add to closer's wallet
        await updateWalletTransaction(
          after.closerUserId,
          commission,
          'credit',
          `Commission closing commande ${after.orderId}`,
          { orderId: after.orderId, taskId, type: 'closer_commission' }
        );

        // Notify closer
        await sendNotification({
          userId: after.closerUserId,
          type: 'payment_received',
          title: 'Commission reçue !',
          body: `${commission.toLocaleString()} GNF ajoutés pour la conversion de ${after.orderId}`,
          data: { orderId: after.orderId, amount: commission.toString() }
        });
      }

      // Update daily closer stats
      const today = new Date().toISOString().split('T')[0];
      const leaderboardRef = db.collection('closer_leaderboard').doc(`${today}_${after.closerId}`);
      
      await leaderboardRef.set({
        closerId: after.closerId,
        date: today,
        calls: admin.firestore.FieldValue.increment(after.attempts || 1),
        conversions: after.outcome === 'converted' 
          ? admin.firestore.FieldValue.increment(1) 
          : admin.firestore.FieldValue.increment(0),
        revenue: after.outcome === 'converted'
          ? admin.firestore.FieldValue.increment(after.orderTotal)
          : admin.firestore.FieldValue.increment(0),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Log analytics
      await db.collection('analytics_events').add({
        event: 'closing_completed',
        taskId,
        orderId: after.orderId,
        closerId: after.closerId,
        outcome: after.outcome,
        attempts: after.attempts,
        callDuration: after.callDuration,
        orderTotal: after.orderTotal,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error in onClosingCompleted:', error);
    }
  });
