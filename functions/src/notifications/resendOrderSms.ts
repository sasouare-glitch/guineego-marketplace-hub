/**
 * Cloud Function: resendOrderSms
 * Admin-only callable to resend SMS notification for an order
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendStatusNotification } from './sendStatusNotification';

const db = admin.firestore();

export const resendOrderSms = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    const claims = context.auth.token;
    if (claims.role !== 'admin' && claims.email !== 'sasouare@gmail.com') {
      throw new functions.https.HttpsError('permission-denied', 'Accès réservé aux administrateurs');
    }

    const { orderId } = data as { orderId: string };
    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId requis');
    }

    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', `Commande ${orderId} introuvable`);
    }

    const order = orderSnap.data()!;
    const status = order.status || 'pending';

    try {
      await sendStatusNotification({
        orderId,
        customerId: order.customerId,
        status,
        customerName: order.shippingAddress?.fullName,
        commune: order.shippingAddress?.commune,
        total: order.pricing?.total,
      });

      return { success: true, message: `SMS renvoyé pour la commande ${orderId}` };
    } catch (err: any) {
      throw new functions.https.HttpsError('internal', err.message || 'Erreur lors du renvoi');
    }
  });
