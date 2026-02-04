/**
 * PAYMENTS WEBHOOKS: Mobile Money Callback Handlers
 * REST endpoints for payment provider callbacks
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface OMWebhookData {
  transactionId: string;
  merchantCode: string;
  amount: number;
  phone: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference: string; // orderId
  timestamp: string;
  signature: string;
}

interface MTNWebhookData {
  externalId: string;
  financialTransactionId: string;
  amount: number;
  currency: string;
  payer: { partyId: string };
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  reason?: string;
}

/**
 * Orange Money Webhook Handler
 * REST endpoint: /processOMWebhook
 */
export const processOMWebhook = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const data = req.body as OMWebhookData;

      // Verify signature (in production, validate with OM secret)
      // const isValid = verifyOMSignature(data, req.headers['x-om-signature']);
      // if (!isValid) {
      //   res.status(401).send('Invalid signature');
      //   return;
      // }

      console.log('OM Webhook received:', data);

      // Find payment by reference (orderId)
      const paymentsQuery = await db.collection('payments')
        .where('orderId', '==', data.reference)
        .where('status', '==', 'processing')
        .limit(1)
        .get();

      if (paymentsQuery.empty) {
        console.error('Payment not found for order:', data.reference);
        res.status(404).send('Payment not found');
        return;
      }

      const paymentDoc = paymentsQuery.docs[0];
      const payment = paymentDoc.data();

      if (data.status === 'SUCCESS') {
        // Update payment
        await paymentDoc.ref.update({
          status: 'completed',
          providerTransactionId: data.transactionId,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update order
        await db.collection('orders').doc(data.reference).update({
          paymentStatus: 'paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Notify customer
        await sendNotification({
          userId: payment.customerId,
          type: 'payment_received',
          title: 'Paiement confirmé',
          body: `Votre paiement Orange Money de ${data.amount.toLocaleString()} GNF a été reçu.`,
          data: { orderId: data.reference }
        });

        res.status(200).json({ success: true });
      } else if (data.status === 'FAILED') {
        await paymentDoc.ref.update({
          status: 'failed',
          failureReason: 'Paiement Orange Money échoué',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await sendNotification({
          userId: payment.customerId,
          type: 'payment_received',
          title: 'Paiement échoué',
          body: 'Votre paiement Orange Money a échoué. Veuillez réessayer.',
          data: { orderId: data.reference }
        });

        res.status(200).json({ success: true, status: 'failed' });
      } else {
        res.status(200).json({ success: true, status: 'pending' });
      }

    } catch (error) {
      console.error('Error processing OM webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });

/**
 * MTN Mobile Money Webhook Handler
 * REST endpoint: /processMTNWebhook
 */
export const processMTNWebhook = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const data = req.body as MTNWebhookData;

      console.log('MTN Webhook received:', data);

      // Find payment by externalId (orderId)
      const paymentsQuery = await db.collection('payments')
        .where('orderId', '==', data.externalId)
        .where('status', '==', 'processing')
        .limit(1)
        .get();

      if (paymentsQuery.empty) {
        console.error('Payment not found for order:', data.externalId);
        res.status(404).send('Payment not found');
        return;
      }

      const paymentDoc = paymentsQuery.docs[0];
      const payment = paymentDoc.data();

      if (data.status === 'SUCCESSFUL') {
        await paymentDoc.ref.update({
          status: 'completed',
          providerTransactionId: data.financialTransactionId,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('orders').doc(data.externalId).update({
          paymentStatus: 'paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await sendNotification({
          userId: payment.customerId,
          type: 'payment_received',
          title: 'Paiement confirmé',
          body: `Votre paiement MTN Money de ${data.amount.toLocaleString()} GNF a été reçu.`,
          data: { orderId: data.externalId }
        });

        res.status(200).json({ success: true });
      } else if (data.status === 'FAILED') {
        await paymentDoc.ref.update({
          status: 'failed',
          failureReason: data.reason || 'Paiement MTN Money échoué',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await sendNotification({
          userId: payment.customerId,
          type: 'payment_received',
          title: 'Paiement échoué',
          body: 'Votre paiement MTN Money a échoué. Veuillez réessayer.',
          data: { orderId: data.externalId }
        });

        res.status(200).json({ success: true, status: 'failed' });
      } else {
        res.status(200).json({ success: true, status: 'pending' });
      }

    } catch (error) {
      console.error('Error processing MTN webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });
