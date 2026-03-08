/**
 * DELIVERIES FUNCTION: Update Courier Location
 * Real-time GPS tracking + proximity notification
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyCourier } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

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
 * Haversine formula: distance in meters between two GPS points
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PROXIMITY_THRESHOLD_METERS = 300;

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

          // === Proximity notification ===
          const missionData = missionDoc.data()!;
          const status = missionData.status;

          // Only check proximity when courier is heading to delivery point
          if (['picked_up', 'in_transit'].includes(status)) {
            await checkProximityAndNotify(
              missionId,
              missionData,
              latitude,
              longitude
            );
          }
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

/**
 * Check if courier is near delivery address and send push notification
 * Uses a flag on the mission doc to avoid duplicate notifications
 */
async function checkProximityAndNotify(
  missionId: string,
  missionData: FirebaseFirestore.DocumentData,
  courierLat: number,
  courierLng: number
): Promise<void> {
  // Skip if already notified
  if (missionData.proximityNotified) return;

  // We need delivery coordinates — try from geocoded data or stored coords
  const deliveryCoords = missionData.deliveryCoords;
  if (!deliveryCoords?.lat || !deliveryCoords?.lng) {
    // Try to geocode delivery address (one-time, cached on mission)
    const address = missionData.delivery?.address;
    const commune = missionData.delivery?.commune;
    if (!address && !commune) return;

    const coords = await geocodeAddress(address, commune);
    if (!coords) return;

    // Store geocoded coords on mission for future checks
    await db.collection('deliveries').doc(missionId).update({
      deliveryCoords: coords
    });

    // Check distance with freshly geocoded coords
    const distance = haversineDistance(courierLat, courierLng, coords.lat, coords.lng);
    if (distance > PROXIMITY_THRESHOLD_METERS) return;

    await sendProximityNotification(missionId, missionData, Math.round(distance));
    return;
  }

  const distance = haversineDistance(
    courierLat, courierLng,
    deliveryCoords.lat, deliveryCoords.lng
  );

  if (distance <= PROXIMITY_THRESHOLD_METERS) {
    await sendProximityNotification(missionId, missionData, Math.round(distance));
  }
}

/**
 * Send the proximity push notification and mark mission as notified
 */
async function sendProximityNotification(
  missionId: string,
  missionData: FirebaseFirestore.DocumentData,
  distanceMeters: number
): Promise<void> {
  const customerId = missionData.customerId;
  if (!customerId) return;

  const courierName = missionData.courierName || 'Votre coursier';
  const orderId = missionData.orderId || '';

  try {
    // Mark as notified FIRST to prevent duplicates
    await db.collection('deliveries').doc(missionId).update({
      proximityNotified: true,
      proximityNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send push + in-app notification
    await sendNotification({
      userId: customerId,
      type: 'delivery_started',
      title: '🛵 Votre coursier est tout proche !',
      body: `${courierName} est à environ ${distanceMeters < 100 ? 'moins de 100' : distanceMeters} m de votre adresse. Préparez-vous à réceptionner votre colis !`,
      data: {
        missionId,
        orderId,
        distance: distanceMeters.toString()
      },
      sendPush: true
    });

    console.log(`✅ Notification proximité envoyée au client ${customerId} — mission ${missionId} (${distanceMeters}m)`);
  } catch (error) {
    console.error(`❌ Erreur notification proximité mission ${missionId}:`, error);
  }
}

/**
 * Geocode address via OpenStreetMap Nominatim
 */
async function geocodeAddress(
  address?: string,
  commune?: string
): Promise<{ lat: number; lng: number } | null> {
  const query = commune ? `${address || ''}, ${commune}, Guinée` : `${address}, Guinée`;

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'gn',
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'User-Agent': 'GuineeGo-Server/1.0' } }
    );

    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }

    // Fallback: commune only
    if (commune && address) {
      return geocodeAddress(undefined, commune);
    }

    return null;
  } catch (err) {
    console.warn('Geocoding failed:', err);
    return null;
  }
}
