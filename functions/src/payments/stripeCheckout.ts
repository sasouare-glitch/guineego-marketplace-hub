/**
 * STRIPE CHECKOUT: Create Stripe Checkout Session
 * Requires STRIPE_SECRET_KEY in Firebase functions config
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';

const db = admin.firestore();

interface StripeCheckoutData {
  orderId: string;
  paymentId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Stripe Checkout Session for card payments
 * httpsCallable: createStripeCheckout
 */
export const createStripeCheckout = functions
  .region('europe-west1')
  .https.onCall(async (data: StripeCheckoutData, context) => {
    const uid = verifyAuth(context);
    const { orderId, paymentId, successUrl, cancelUrl } = data;

    if (!orderId || !paymentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId et paymentId sont requis'
      );
    }

    try {
      // Get payment record
      const paymentRef = db.collection('payments').doc(paymentId);
      const paymentDoc = await paymentRef.get();

      if (!paymentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Paiement non trouvé');
      }

      const payment = paymentDoc.data()!;

      if (payment.customerId !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Paiement non autorisé');
      }

      if (payment.status !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', 'Ce paiement a déjà été traité');
      }

      // Get Stripe secret key from config
      const stripeKey = functions.config().stripe?.secret_key;
      if (!stripeKey) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Stripe n\'est pas configuré. Configurez la clé via: firebase functions:config:set stripe.secret_key="sk_..."'
        );
      }

      // Dynamic import of Stripe
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

      // Get order details for line items
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const order = orderDoc.exists ? orderDoc.data() : null;

      // Convert GNF to smallest unit (GNF has no decimal)
      const amountInSmallestUnit = Math.round(payment.amount);

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        client_reference_id: orderId,
        metadata: {
          paymentId,
          orderId,
          customerId: uid,
        },
        line_items: [
          {
            price_data: {
              currency: 'gnf',
              unit_amount: amountInSmallestUnit,
              product_data: {
                name: `Commande GuineeGo #${orderId.slice(0, 8).toUpperCase()}`,
                description: order?.items
                  ? `${order.items.length} article(s)`
                  : 'Commande GuineeGo',
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `https://guineego.web.app/orders/${orderId}?payment=success`,
        cancel_url: cancelUrl || `https://guineego.web.app/orders/${orderId}?payment=cancelled`,
      });

      // Update payment record with Stripe session ID
      await paymentRef.update({
        stripeSessionId: session.id,
        method: 'card',
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error: any) {
      console.error('Error creating Stripe checkout:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de la session Stripe'
      );
    }
  });
