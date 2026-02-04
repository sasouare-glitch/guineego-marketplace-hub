/**
 * DELIVERIES FUNCTION: Update Courier Location
 * Real-time GPS tracking
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyCourier } from '../utils/auth';

const db = admin.firestore();

interface LocationData {
  missionId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Update courier location (realtime)
 * httpsCallable: updateCourierLocation
 */
export const updateCourierLocation = functions
  .region('europe-west1')
  .https.onCall(async (data: LocationData, context) => {
    const claims = verifyCourier(context);
    const uid = context.auth!.uid;

    const { missionId, latitude, longitude, accuracy, heading, speed } = data;

    if (latitude === undefined || longitude === undefined) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'latitude et longitude sont requis'
      );
    }

    try {
      const location = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || null,
        heading: heading || null,
        speed: speed || null,
        timestamp: admin.firestore.Timestamp.now()
      };

      // Update courier document
      await db.collection('couriers').doc(claims.courierId!).update({
        currentLocation: new admin.firestore.GeoPoint(latitude, longitude),
        lastLocationUpdate: admin.firestore.FieldValue.serverTimestamp()
      });

      // If active mission, update mission location for customer tracking
      if (missionId) {
        const missionRef = db.collection('deliveries').doc(missionId);
        const missionDoc = await missionRef.get();

        if (missionDoc.exists && missionDoc.data()?.assignedCourier === uid) {
          await missionRef.update({
            courierLocation: location,
            lastLocationUpdate: admin.firestore.FieldValue.serverTimestamp()
          });

          // Store location history for route tracking
          await db.collection('location_history').add({
            missionId,
            courierId: claims.courierId,
            location,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Error updating location:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour de la position'
      );
    }
  });
