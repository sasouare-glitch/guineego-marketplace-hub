/**
 * TRANSIT FUNCTION: Create Shipment
 * Create China-Guinea shipment
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface CreateShipmentData {
  description: string;
  weightKg: number;
  volumeM3?: number;
  method: 'air' | 'sea';
  insurance: boolean;
  expressHandling: boolean;
  totalCost: number;
  origin: {
    warehouse: string;
    address: string;
    trackingNumber?: string;
  };
  destination: {
    fullName: string;
    phone: string;
    address: string;
    commune: string;
  };
}

/**
 * Create transit shipment
 * httpsCallable: createShipment
 */
export const createShipment = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateShipmentData, context) => {
    const uid = verifyAuth(context);

    const {
      description,
      weightKg,
      volumeM3,
      method,
      insurance,
      expressHandling,
      totalCost,
      origin,
      destination
    } = data;

    // Validate
    if (!description || !weightKg || !method || !origin || !destination) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Données incomplètes'
      );
    }

    try {
      // Generate shipment ID
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const shipmentId = `TRS-${timestamp}${random}`;

      const shipmentRef = db.collection('transit').doc(shipmentId);

      // Estimated delivery dates
      const now = new Date();
      const estimatedDays = method === 'air' 
        ? (expressHandling ? { min: 5, max: 7 } : { min: 7, max: 10 })
        : { min: 35, max: 45 };

      const estimatedArrivalMin = new Date(now.getTime() + estimatedDays.min * 24 * 60 * 60 * 1000);
      const estimatedArrivalMax = new Date(now.getTime() + estimatedDays.max * 24 * 60 * 60 * 1000);

      await shipmentRef.set({
        id: shipmentId,
        customerId: uid,
        description,
        weightKg,
        volumeM3: volumeM3 || null,
        method,
        insurance,
        expressHandling,
        totalCost,
        origin,
        destination,
        status: 'registered',
        currentStep: 0,
        steps: [
          { name: 'Enregistré', status: 'completed', date: admin.firestore.Timestamp.now() },
          { name: 'Entrepôt Chine', status: 'pending', date: null },
          { name: 'Contrôle qualité', status: 'pending', date: null },
          { name: 'Expédié', status: 'pending', date: null },
          { name: 'En transit', status: 'pending', date: null },
          { name: 'Douanes Guinée', status: 'pending', date: null },
          { name: 'Dédouanement', status: 'pending', date: null },
          { name: 'Livraison', status: 'pending', date: null }
        ],
        estimatedArrival: {
          min: admin.firestore.Timestamp.fromDate(estimatedArrivalMin),
          max: admin.firestore.Timestamp.fromDate(estimatedArrivalMax)
        },
        paymentStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create payment record
      const paymentRef = db.collection('payments').doc();
      await paymentRef.set({
        id: paymentRef.id,
        type: 'transit',
        transitId: shipmentId,
        customerId: uid,
        amount: totalCost,
        currency: 'GNF',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      await sendNotification({
        userId: uid,
        type: 'order_created',
        title: 'Expédition enregistrée',
        body: `Votre expédition ${shipmentId} a été créée. Procédez au paiement.`,
        data: { shipmentId }
      });

      return {
        success: true,
        shipmentId,
        paymentId: paymentRef.id,
        totalCost,
        estimatedArrival: {
          min: estimatedArrivalMin.toISOString(),
          max: estimatedArrivalMax.toISOString()
        },
        message: 'Expédition créée avec succès'
      };

    } catch (error: any) {
      console.error('Error creating shipment:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de l\'expédition'
      );
    }
  });
