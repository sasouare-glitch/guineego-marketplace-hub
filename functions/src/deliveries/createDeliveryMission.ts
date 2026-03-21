/**
 * DELIVERIES FUNCTION: Create Delivery Mission
 * Create delivery mission for courier assignment
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';
import { generateMissionId } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface CreateMissionData {
  orderId: string;
  pickupAddress: {
    address: string;
    commune: string;
    phone: string;
    instructions?: string;
  };
  priority?: 'normal' | 'express';
}

/**
 * Create delivery mission
 * httpsCallable: createDeliveryMission
 */
export const createDeliveryMission = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateMissionData, context) => {
    const claims = context.auth?.token;
    if (!claims || (claims.role !== 'admin' && claims.role !== 'ecommerce')) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Accès non autorisé'
      );
    }

    const { orderId, pickupAddress, priority = 'normal' } = data;

    if (!orderId || !pickupAddress) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId et pickupAddress sont requis'
      );
    }

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
      }

      const order = orderDoc.data()!;

      // Check if mission already exists
      if (order.deliveryMissionId) {
        throw new functions.https.HttpsError(
          'already-exists',
          'Une mission de livraison existe déjà'
        );
      }

      const missionId = generateMissionId();
      const missionRef = db.collection('deliveries').doc(missionId);

      // Calculate fee and estimated time
      const fee = calculateDeliveryFee(
        pickupAddress.commune,
        order.shippingAddress.commune,
        priority
      );

      const estimatedTime = calculateEstimatedTime(
        pickupAddress.commune,
        order.shippingAddress.commune,
        priority
      );

      await missionRef.set({
        id: missionId,
        orderId,
        customerId: order.customerId,
        sellerIds: order.sellerIds,
        pickup: pickupAddress,
        delivery: order.shippingAddress,
        priority,
        fee,
        estimatedTime,
        status: 'pending',
        assignedCourier: null,
        courierLocation: null,
        statusHistory: [{
          status: 'pending',
          timestamp: admin.firestore.Timestamp.now(),
          note: 'Mission créée'
        }],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Link mission to order
      await db.collection('orders').doc(orderId).update({
        deliveryMissionId: missionId,
        status: 'ready'
      });

      // Notify available couriers
      await notifyAvailableCouriers(
        missionId,
        order.shippingAddress.commune,
        fee
      );

      return {
        success: true,
        missionId,
        fee,
        estimatedTime,
        message: 'Mission de livraison créée'
      };

    } catch (error: any) {
      console.error('Error creating mission:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de la mission'
      );
    }
  });

/**
 * Calculate delivery fee
 */
function calculateDeliveryFee(
  pickupCommune: string,
  deliveryCommune: string,
  priority: string
): number {
  const baseFees: Record<string, number> = {
    'Kaloum': 15000,
    'Dixinn': 20000,
    'Matam': 20000,
    'Ratoma': 25000,
    'Matoto': 30000
  };

  const baseFee = baseFees[deliveryCommune] || 35000;
  const priorityMultiplier = priority === 'express' ? 1.5 : 1;

  return Math.floor(baseFee * priorityMultiplier);
}

/**
 * Calculate estimated delivery time (in minutes)
 */
function calculateEstimatedTime(
  pickupCommune: string,
  deliveryCommune: string,
  priority: string
): number {
  const baseTime = 45; // Base 45 minutes
  
  const distanceTime: Record<string, number> = {
    'Kaloum': 15,
    'Dixinn': 25,
    'Matam': 25,
    'Ratoma': 35,
    'Matoto': 45
  };

  const additionalTime = distanceTime[deliveryCommune] || 60;
  const priorityReduction = priority === 'express' ? 0.7 : 1;

  return Math.floor((baseTime + additionalTime) * priorityReduction);
}

/**
 * Notify available couriers
 */
async function notifyAvailableCouriers(
  missionId: string,
  deliveryCommune: string,
  fee: number
): Promise<void> {
  const couriersSnapshot = await db.collection('couriers')
    .where('isOnline', '==', true)
    .where('status', '==', 'active')
    .where('zones', 'array-contains', deliveryCommune)
    .limit(20)
    .get();

  const notifications = couriersSnapshot.docs.map(doc =>
    sendNotification({
      userId: doc.data().userId,
      type: 'new_mission',
      title: 'Nouvelle mission disponible !',
      body: `Livraison vers ${deliveryCommune} - ${fee.toLocaleString()} GNF`,
      data: { missionId }
    })
  );

  await Promise.all(notifications);
}
