/**
 * STRIPE REFUND: Admin-initiated refund for Stripe card payments
 * Callable function — requires admin role
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '../utils/auth';
import { notifyAdmins } from '../utils/notifications';

const db = admin.firestore();

interface RefundRequest {
  paymentId: string;
  reason?: string;
  amount?: number; // partial refund in GNF, if omitted → full refund
}

export const stripeRefund = functions
  .region('europe-west1')
  .https.onCall(async (data: RefundRequest, context) => {
    // Verify admin
    await verifyAdmin(context);

    const { paymentId, reason, amount } = data;

    if (!paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'paymentId requis');
    }

    // Get payment record
    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Paiement introuvable');
    }

    const payment = paymentDoc.data()!;

    if (payment.status !== 'completed') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Seuls les paiements complétés peuvent être remboursés'
      );
    }

    if (payment.method !== 'card') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Seuls les paiements par carte (Stripe) peuvent être remboursés via cette fonction'
      );
    }

    const stripePaymentIntentId = payment.stripePaymentIntentId;
    if (!stripePaymentIntentId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Aucun Payment Intent Stripe associé à ce paiement'
      );
    }

    // Initialize Stripe
    const stripeKey = functions.config().stripe?.secret_key;
    if (!stripeKey) {
      throw new functions.https.HttpsError('internal', 'Clé Stripe non configurée');
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    try {
      // Create refund (full or partial)
      const refundParams: any = {
        payment_intent: stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          paymentId,
          refundedBy: context.auth?.uid || 'admin',
          refundReason: reason || 'Admin refund',
        },
      };

      if (amount && amount > 0 && amount < payment.amount) {
        // Partial refund — Stripe expects amount in smallest currency unit
        refundParams.amount = amount;
      }

      const refund = await stripe.refunds.create(refundParams);

      // Update Firestore payment
      const batch = db.batch();

      batch.update(db.collection('payments').doc(paymentId), {
        status: 'refunded',
        refundId: refund.id,
        refundAmount: refund.amount,
        refundReason: reason || 'Admin refund',
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundedBy: context.auth?.uid || 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If there's an associated order, update it too
      if (payment.orderId) {
        batch.update(db.collection('orders').doc(payment.orderId), {
          paymentStatus: amount && amount < payment.amount ? 'partially_refunded' : 'refunded',
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Log audit event
      batch.set(db.collection('audit_logs').doc(), {
        action: 'stripe_refund',
        performedBy: context.auth?.uid || 'admin',
        paymentId,
        refundId: refund.id,
        refundAmount: refund.amount,
        reason: reason || 'Admin refund',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Notify admins
      await notifyAdmins(
        'Remboursement Stripe effectué',
        `Paiement ${paymentId.slice(0, 8).toUpperCase()} remboursé — ${refund.amount?.toLocaleString()} GNF. Raison: ${reason || 'N/A'}`
      );

      console.log(`✅ Stripe refund completed: ${refund.id} for payment ${paymentId}`);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error: any) {
      console.error('Stripe refund error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur Stripe: ${error.message || 'Échec du remboursement'}`
      );
    }
  });
