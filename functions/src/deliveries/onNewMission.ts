/**
 * Trigger: New Delivery Mission Created
 * Notifies all active couriers via FCM push + in-app notification
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

export const onNewDeliveryMission = functions
  .region('europe-west1')
  .firestore.document('deliveries/{missionId}')
  .onCreate(async (snap, context) => {
    const mission = snap.data();
    const missionId = context.params.missionId;

    if (mission.status !== 'pending') return;

    try {
      // Get all courier user IDs
      const couriersSnap = await db.collection('users')
        .where('role', '==', 'courier')
        .get();

      // Also check users with courier in roles array
      const couriersArraySnap = await db.collection('users')
        .where('roles', 'array-contains', 'courier')
        .get();

      // Deduplicate courier IDs
      const courierIds = new Set<string>();
      couriersSnap.docs.forEach(d => courierIds.add(d.id));
      couriersArraySnap.docs.forEach(d => courierIds.add(d.id));

      if (courierIds.size === 0) {
        console.log('No couriers found to notify');
        return;
      }

      const pickupCommune = mission.pickup?.commune || 'Non spécifiée';
      const priorityLabel = mission.priority === 'express' ? '⚡ EXPRESS' : '📦 Standard';
      const feeFormatted = (mission.fee || 0).toLocaleString();

      const promises = Array.from(courierIds).map(courierId =>
        sendNotification({
          userId: courierId,
          type: 'new_mission',
          title: `${priorityLabel} - Nouvelle mission disponible`,
          body: `Pickup à ${pickupCommune} • ${feeFormatted} GNF`,
          data: {
            missionId,
            orderId: mission.orderId || '',
            commune: pickupCommune,
            fee: feeFormatted,
            priority: mission.priority || 'normal',
          },
        })
      );

      await Promise.all(promises);
      console.log(`Notified ${courierIds.size} couriers about mission ${missionId}`);
    } catch (error) {
      console.error('Error notifying couriers:', error);
    }
  });
