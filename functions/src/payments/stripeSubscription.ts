/**
 * STRIPE SUBSCRIPTION CHECKOUT: Create Stripe session for seller subscriptions
 * Separate from order payments
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';

const db = admin.firestore();

interface StripeSubscriptionCheckoutData {
  planId: string;
  paymentId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create Stripe Checkout for seller subscription payments
 */
export const createStripeSubscriptionCheckout = functions
  .region('europe-west1')
  .https.onCall(async (data: StripeSubscriptionCheckoutData, context) => {
    const uid = verifyAuth(context);
    const { planId, paymentId, successUrl, cancelUrl } = data;

    if (!planId || !paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'planId et paymentId requis');
    }

    try {
      const stripeKey = functions.config().stripe?.secret_key;
      if (!stripeKey) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Stripe non configuré'
        );
      }

      // Get the subscription payment record
      const paymentRef = db
        .collection('seller_settings').doc(uid)
        .collection('subscription_payments').doc(paymentId);
      const paymentDoc = await paymentRef.get();

      if (!paymentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Paiement non trouvé');
      }

      const payment = paymentDoc.data()!;

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        client_reference_id: uid,
        metadata: {
          paymentId,
          planId,
          sellerId: uid,
          type: 'subscription',
        },
        line_items: [
          {
            price_data: {
              currency: 'gnf',
              unit_amount: Math.round(payment.amount),
              product_data: {
                name: `Abonnement GuineeGo - ${planId}`,
                description: `Plan ${planId} pour 30 jours`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `https://guineego.web.app/seller/subscription?payment=success`,
        cancel_url: cancelUrl || `https://guineego.web.app/seller/subscription?payment=cancelled`,
      });

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
      console.error('Error creating Stripe subscription checkout:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erreur Stripe');
    }
  });
