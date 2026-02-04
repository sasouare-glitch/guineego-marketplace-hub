/**
 * DELIVERIES FUNCTION: Update Delivery Status
 * Courier status updates with realtime tracking
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyCourier, verifyAdmin } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

type DeliveryStatus = 
  | 'pending'
  | 'accepted'
  | 'pickup_started'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

interface UpdateStatusData {
  missionId: string;
  status: DeliveryStatus;
  note?: string;
  photo?: string; // Proof of delivery
}

/**
 * Update delivery mission status
 * httpsCallable: updateDeliveryStatus
 */
export const updateDeliveryStatus = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateStatusData, context) => {
    const claims = context.auth?.token;
    const uid = context.auth?.uid;

    if (!claims || (claims.role !== 'courier' && claims.role !== 'admin')) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seuls les coursiers peuvent modifier les missions'
      );
    }

    const { missionId, status, note, photo } = data;

    if (!missionId || !status) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'missionId et status sont requis'
      );
    }

    try {
      const missionRef = db.collection('deliveries').doc(missionId);
      const missionDoc = await missionRef.get();

      if (!missionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Mission non trouvée');
      }

      const mission = missionDoc.data()!;

      // Verify courier assignment (or accepting new mission)
      if (status !== 'accepted' && mission.assignedCourier !== uid && claims.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous n\'êtes pas assigné à cette mission'
        );
      }

      // Validate status transition
      const validTransitions: Record<string, DeliveryStatus[]> = {
        pending: ['accepted', 'cancelled'],
        accepted: ['pickup_started', 'cancelled'],
        pickup_started: ['picked_up', 'cancelled'],
        picked_up: ['in_transit'],
        in_transit: ['arrived'],
        arrived: ['delivered']
      };

      if (!validTransitions[mission.status]?.includes(status)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Transition ${mission.status} → ${status} non autorisée`
        );
      }

      // Accept mission assignment
      if (status === 'accepted' && !mission.assignedCourier) {
        await missionRef.update({
          assignedCourier: uid,
          assignedCourierId: claims.courierId,
          acceptedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update order with courier
        await db.collection('orders').doc(mission.orderId).update({
          assignedCourier: uid,
          status: 'shipped'
        });
      }

      // Status update entry
      const statusEntry = {
        status,
        timestamp: admin.firestore.Timestamp.now(),
        performedBy: uid,
        note: note || null,
        photo: photo || null
      };

      // Update mission
      const updateData: any = {
        status,
        statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (status === 'delivered') {
        updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
        updateData.proofOfDelivery = photo || null;
      }

      await missionRef.update(updateData);

      // Update order status
      const orderStatusMap: Record<string, string> = {
        accepted: 'shipped',
        in_transit: 'in_delivery',
        delivered: 'delivered'
      };

      if (orderStatusMap[status]) {
        await db.collection('orders').doc(mission.orderId).update({
          status: orderStatusMap[status],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Notify customer
      const customerNotifications: Record<string, { title: string; body: string }> = {
        accepted: {
          title: 'Coursier en route',
          body: 'Un coursier a accepté votre livraison'
        },
        picked_up: {
          title: 'Colis récupéré',
          body: 'Le coursier a récupéré votre colis'
        },
        in_transit: {
          title: 'En route vers vous',
          body: 'Votre colis est en chemin !'
        },
        arrived: {
          title: 'Coursier arrivé',
          body: 'Le coursier est arrivé à votre adresse'
        },
        delivered: {
          title: 'Colis livré !',
          body: 'Votre commande a été livrée avec succès'
        }
      };

      if (customerNotifications[status]) {
        await sendNotification({
          userId: mission.customerId,
          type: 'delivery_started',
          ...customerNotifications[status],
          data: { missionId, orderId: mission.orderId }
        });
      }

      return {
        success: true,
        previousStatus: mission.status,
        newStatus: status,
        message: `Statut mis à jour: ${status}`
      };

    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour'
      );
    }
  });
