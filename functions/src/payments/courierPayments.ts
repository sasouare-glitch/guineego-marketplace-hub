/**
 * PAYMENTS FUNCTION: Courier Payments
 * Process payments to couriers after mission completion
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

// Courier payment rates
const COURIER_RATES = {
  basePerMission: 5000,
  perKm: 500,
  heavyItemBonus: 2000,
  expressBonus: 3000,
  peakHoursBonus: 1500,
  rainBonus: 2000,
  nightBonus: 2500,
  weekendBonus: 1000,
};

interface PayCourierData {
  missionId: string;
}

interface BatchPayoutData {
  courierIds?: string[];
  date?: string; // YYYY-MM-DD
}

/**
 * Process payment to courier for completed mission
 * httpsCallable: payCourier
 */
export const payCourier = functions
  .region('europe-west1')
  .https.onCall(async (data: PayCourierData, context) => {
    const { missionId } = data;

    if (!missionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'missionId est requis'
      );
    }

    try {
      return await db.runTransaction(async (transaction) => {
        // Get mission
        const missionRef = db.collection('deliveries').doc(missionId);
        const missionDoc = await transaction.get(missionRef);

        if (!missionDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Mission non trouvée');
        }

        const mission = missionDoc.data()!;

        // Verify mission is completed
        if (mission.status !== 'delivered') {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'La mission n\'est pas encore terminée'
          );
        }

        // Check if already paid
        if (mission.courierPaymentStatus === 'paid') {
          throw new functions.https.HttpsError(
            'already-exists',
            'Le coursier a déjà été payé pour cette mission'
          );
        }

        const courierId = mission.assignedCourier;
        if (!courierId) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Aucun coursier assigné à cette mission'
          );
        }

        // Calculate payment
        const payment = calculateCourierPaymentAmount(mission);

        // Get or create courier wallet
        const walletRef = db.collection('wallets').doc(courierId);
        const walletDoc = await transaction.get(walletRef);

        let currentBalance = 0;
        let totalEarnings = 0;
        let completedMissions = 0;

        if (walletDoc.exists) {
          const walletData = walletDoc.data()!;
          currentBalance = walletData.balance || 0;
          totalEarnings = walletData.totalEarnings || 0;
          completedMissions = walletData.completedMissions || 0;
        }

        const newBalance = currentBalance + payment.total;

        // Create transaction record
        const txRef = db.collection('transactions').doc();
        const txData = {
          id: txRef.id,
          userId: courierId,
          type: 'credit',
          category: 'courier_payment',
          amount: payment.total,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Livraison mission ${missionId}`,
          metadata: {
            missionId,
            orderId: mission.orderId,
            breakdown: payment.breakdown,
            distance: mission.estimatedDistance
          },
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Update wallet
        if (walletDoc.exists) {
          transaction.update(walletRef, {
            balance: newBalance,
            totalEarnings: totalEarnings + payment.total,
            completedMissions: completedMissions + 1,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          transaction.set(walletRef, {
            userId: courierId,
            userType: 'courier',
            balance: newBalance,
            currency: 'GNF',
            totalEarnings: payment.total,
            totalWithdrawals: 0,
            pendingWithdrawals: 0,
            completedMissions: 1,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Save transaction
        transaction.set(txRef, txData);

        // Update mission payment status
        transaction.update(missionRef, {
          courierPaymentStatus: 'paid',
          courierPaymentAmount: payment.total,
          courierPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          courierTransactionId: txRef.id
        });

        return {
          success: true,
          missionId,
          courierId,
          payment: payment.total,
          breakdown: payment.breakdown,
          transactionId: txRef.id,
          newBalance
        };
      });

    } catch (error: any) {
      console.error('Error paying courier:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du paiement du coursier'
      );
    }
  });

/**
 * Auto-pay courier when mission is marked as delivered
 */
export const onMissionDelivered = functions
  .region('europe-west1')
  .firestore.document('deliveries/{missionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const missionId = context.params.missionId;

    // Check if status changed to 'delivered'
    if (before.status !== 'delivered' && after.status === 'delivered') {
      if (after.courierPaymentStatus !== 'paid') {
        console.log(`Auto-pay triggered for courier mission ${missionId}`);

        try {
          // Mark as processing
          await change.after.ref.update({
            courierPaymentStatus: 'processing'
          });

          // Calculate and pay
          const payment = calculateCourierPaymentAmount(after);
          const courierId = after.assignedCourier;

          await db.runTransaction(async (transaction) => {
            const walletRef = db.collection('wallets').doc(courierId);
            const walletDoc = await transaction.get(walletRef);

            const currentBalance = walletDoc.exists ? walletDoc.data()!.balance || 0 : 0;
            const newBalance = currentBalance + payment.total;

            // Create transaction
            const txRef = db.collection('transactions').doc();
            transaction.set(txRef, {
              id: txRef.id,
              userId: courierId,
              type: 'credit',
              category: 'courier_payment',
              amount: payment.total,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: `Livraison mission ${missionId}`,
              metadata: { missionId, orderId: after.orderId },
              status: 'completed',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update wallet
            if (walletDoc.exists) {
              transaction.update(walletRef, {
                balance: newBalance,
                totalEarnings: admin.firestore.FieldValue.increment(payment.total),
                completedMissions: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            } else {
              transaction.set(walletRef, {
                userId: courierId,
                userType: 'courier',
                balance: newBalance,
                currency: 'GNF',
                totalEarnings: payment.total,
                completedMissions: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }

            // Update mission
            transaction.update(db.collection('deliveries').doc(missionId), {
              courierPaymentStatus: 'paid',
              courierPaymentAmount: payment.total,
              courierTransactionId: txRef.id,
              courierPaymentDate: admin.firestore.FieldValue.serverTimestamp()
            });
          });

          // Notify courier
          await sendNotification({
            userId: courierId,
            type: 'payment_received',
            title: 'Paiement reçu',
            body: `Vous avez reçu ${payment.total.toLocaleString()} GNF pour la livraison`,
            data: { missionId }
          });

        } catch (error) {
          console.error('Auto-pay courier failed:', error);
          await change.after.ref.update({
            courierPaymentStatus: 'failed',
            courierPaymentError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  });

/**
 * Batch payout for multiple couriers (admin function)
 * httpsCallable: batchCourierPayout
 */
export const batchCourierPayout = functions
  .region('europe-west1')
  .https.onCall(async (data: BatchPayoutData, context) => {
    verifyAdmin(context);

    const { courierIds, date } = data;

    try {
      // Find unpaid missions
      let query = db.collection('deliveries')
        .where('status', '==', 'delivered')
        .where('courierPaymentStatus', '!=', 'paid');

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .where('deliveredAt', '>=', startOfDay)
          .where('deliveredAt', '<=', endOfDay);
      }

      const missionsSnapshot = await query.get();

      if (missionsSnapshot.empty) {
        return {
          success: true,
          message: 'Aucune mission à payer',
          processed: 0
        };
      }

      const results: Array<{ missionId: string; courierId: string; amount: number; success: boolean }> = [];

      for (const missionDoc of missionsSnapshot.docs) {
        const mission = missionDoc.data();

        // Filter by courierIds if provided
        if (courierIds && !courierIds.includes(mission.assignedCourier)) {
          continue;
        }

        try {
          const payment = calculateCourierPaymentAmount(mission);

          await db.runTransaction(async (transaction) => {
            const walletRef = db.collection('wallets').doc(mission.assignedCourier);
            const walletDoc = await transaction.get(walletRef);

            const currentBalance = walletDoc.exists ? walletDoc.data()!.balance || 0 : 0;
            const newBalance = currentBalance + payment.total;

            const txRef = db.collection('transactions').doc();
            transaction.set(txRef, {
              id: txRef.id,
              userId: mission.assignedCourier,
              type: 'credit',
              category: 'courier_payment',
              amount: payment.total,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: `Livraison mission ${missionDoc.id}`,
              status: 'completed',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            if (walletDoc.exists) {
              transaction.update(walletRef, {
                balance: newBalance,
                totalEarnings: admin.firestore.FieldValue.increment(payment.total),
                completedMissions: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            } else {
              transaction.set(walletRef, {
                userId: mission.assignedCourier,
                userType: 'courier',
                balance: newBalance,
                currency: 'GNF',
                totalEarnings: payment.total,
                completedMissions: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }

            transaction.update(missionDoc.ref, {
              courierPaymentStatus: 'paid',
              courierPaymentAmount: payment.total,
              courierTransactionId: txRef.id,
              courierPaymentDate: admin.firestore.FieldValue.serverTimestamp()
            });
          });

          results.push({
            missionId: missionDoc.id,
            courierId: mission.assignedCourier,
            amount: payment.total,
            success: true
          });

        } catch (error) {
          console.error(`Failed to pay courier for mission ${missionDoc.id}:`, error);
          results.push({
            missionId: missionDoc.id,
            courierId: mission.assignedCourier,
            amount: 0,
            success: false
          });
        }
      }

      return {
        success: true,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalAmount: results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0),
        details: results
      };

    } catch (error) {
      console.error('Batch payout error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du paiement groupé'
      );
    }
  });

/**
 * Calculate courier payment amount with all bonuses
 */
function calculateCourierPaymentAmount(mission: any): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  // Base payment
  breakdown.base = COURIER_RATES.basePerMission;

  // Distance bonus
  const distance = mission.estimatedDistance || 0;
  if (distance > 2) {
    breakdown.distance = (distance - 2) * COURIER_RATES.perKm;
  } else {
    breakdown.distance = 0;
  }

  // Heavy item bonus
  if (mission.totalWeight && mission.totalWeight > 10) {
    breakdown.heavyItem = COURIER_RATES.heavyItemBonus;
  } else {
    breakdown.heavyItem = 0;
  }

  // Express bonus
  if (mission.isExpress) {
    breakdown.express = COURIER_RATES.expressBonus;
  } else {
    breakdown.express = 0;
  }

  // Peak hours bonus
  const pickupDate = mission.pickedUpAt?.toDate ? mission.pickedUpAt.toDate() : new Date(mission.pickedUpAt);
  const hour = pickupDate.getHours();
  if ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 20)) {
    breakdown.peakHours = COURIER_RATES.peakHoursBonus;
  } else {
    breakdown.peakHours = 0;
  }

  // Night bonus (21h - 6h)
  if (hour >= 21 || hour < 6) {
    breakdown.night = COURIER_RATES.nightBonus;
  } else {
    breakdown.night = 0;
  }

  // Weekend bonus
  const day = pickupDate.getDay();
  if (day === 0 || day === 6) {
    breakdown.weekend = COURIER_RATES.weekendBonus;
  } else {
    breakdown.weekend = 0;
  }

  // Calculate total
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Round to nearest 500 GNF
  return {
    total: Math.ceil(total / 500) * 500,
    breakdown
  };
}
