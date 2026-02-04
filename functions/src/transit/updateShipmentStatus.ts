/**
 * TRANSIT FUNCTION: Update Shipment Status
 * Admin function to update transit status
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface UpdateShipmentData {
  shipmentId: string;
  step: number;
  note?: string;
  location?: string;
}

/**
 * Update shipment status (admin only)
 * httpsCallable: updateShipmentStatus
 */
export const updateShipmentStatus = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateShipmentData, context) => {
    verifyAdmin(context);

    const { shipmentId, step, note, location } = data;

    if (!shipmentId || step === undefined) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'shipmentId et step sont requis'
      );
    }

    try {
      const shipmentRef = db.collection('transit').doc(shipmentId);
      const shipmentDoc = await shipmentRef.get();

      if (!shipmentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Expédition non trouvée');
      }

      const shipment = shipmentDoc.data()!;
      const steps = [...shipment.steps];

      // Validate step
      if (step < 0 || step >= steps.length) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Étape invalide'
        );
      }

      // Update step
      steps[step] = {
        ...steps[step],
        status: 'completed',
        date: admin.firestore.Timestamp.now(),
        note: note || null,
        location: location || null
      };

      // Mark next step as in_progress if exists
      if (step + 1 < steps.length) {
        steps[step + 1] = {
          ...steps[step + 1],
          status: 'in_progress'
        };
      }

      // Determine overall status
      let status = shipment.status;
      if (step === steps.length - 1) {
        status = 'delivered';
      } else if (step >= 3) {
        status = 'in_transit';
      } else if (step >= 1) {
        status = 'processing';
      }

      await shipmentRef.update({
        steps,
        currentStep: step,
        status,
        lastLocation: location || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      const stepNames = [
        'Enregistré',
        'Arrivé à l\'entrepôt Chine',
        'Contrôle qualité effectué',
        'Expédié de Chine',
        'En transit',
        'Arrivé aux douanes Guinée',
        'Dédouanement terminé',
        'Livré'
      ];

      await sendNotification({
        userId: shipment.customerId,
        type: 'order_status_changed',
        title: 'Mise à jour expédition',
        body: `${shipmentId}: ${stepNames[step]}`,
        data: { shipmentId, step: step.toString() }
      });

      return {
        success: true,
        currentStep: step,
        status,
        message: `Étape ${step + 1}/${steps.length} complétée`
      };

    } catch (error: any) {
      console.error('Error updating shipment:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour'
      );
    }
  });
