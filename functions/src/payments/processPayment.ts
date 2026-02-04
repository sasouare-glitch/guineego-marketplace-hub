/**
 * PAYMENTS FUNCTION: Process Payment
 * Handle mobile money and wallet payments
 * CRITICAL FUNCTION
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';
import { updateWalletTransaction } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface ProcessPaymentData {
  orderId: string;
  paymentId: string;
  method: 'orange_money' | 'mtn_money' | 'wallet';
  phone?: string;
}

/**
 * Process payment for order
 * httpsCallable: processPayment
 */
export const processPayment = functions
  .region('europe-west1')
  .https.onCall(async (data: ProcessPaymentData, context) => {
    const uid = verifyAuth(context);
    const { orderId, paymentId, method, phone } = data;

    if (!orderId || !paymentId || !method) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId, paymentId et method sont requis'
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

      // Verify ownership
      if (payment.customerId !== uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Paiement non autorisé'
        );
      }

      // Check payment status
      if (payment.status !== 'pending') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Ce paiement a déjà été traité'
        );
      }

      let result: { success: boolean; transactionId?: string; instructions?: string };

      switch (method) {
        case 'wallet':
          result = await processWalletPayment(uid, payment.amount, orderId);
          break;
        case 'orange_money':
          result = await initOrangeMoneyPayment(phone!, payment.amount, orderId);
          break;
        case 'mtn_money':
          result = await initMTNMoneyPayment(phone!, payment.amount, orderId);
          break;
        default:
          throw new functions.https.HttpsError('invalid-argument', 'Méthode invalide');
      }

      if (result.success) {
        // Update payment record
        await paymentRef.update({
          status: method === 'wallet' ? 'completed' : 'processing',
          phone: phone || null,
          transactionId: result.transactionId || null,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // If wallet payment, update order immediately
        if (method === 'wallet') {
          await db.collection('orders').doc(orderId).update({
            paymentStatus: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await sendNotification({
            userId: uid,
            type: 'payment_received',
            title: 'Paiement confirmé',
            body: `Votre paiement de ${payment.amount.toLocaleString()} GNF a été effectué.`,
            data: { orderId }
          });
        }
      }

      return {
        success: result.success,
        status: method === 'wallet' ? 'completed' : 'processing',
        transactionId: result.transactionId,
        instructions: result.instructions,
        message: method === 'wallet' 
          ? 'Paiement effectué avec succès'
          : 'Suivez les instructions pour confirmer le paiement'
      };

    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du traitement du paiement'
      );
    }
  });

/**
 * Process wallet payment
 */
async function processWalletPayment(
  userId: string,
  amount: number,
  orderId: string
): Promise<{ success: boolean; transactionId: string }> {
  const result = await updateWalletTransaction(
    userId,
    amount,
    'debit',
    `Paiement commande ${orderId}`,
    { orderId, type: 'purchase' }
  );

  return {
    success: result.success,
    transactionId: result.transactionId
  };
}

/**
 * Initialize Orange Money payment
 */
async function initOrangeMoneyPayment(
  phone: string,
  amount: number,
  orderId: string
): Promise<{ success: boolean; instructions: string }> {
  // In production, integrate with Orange Money API
  // For now, return USSD instructions
  
  const formattedAmount = amount.toLocaleString();
  
  return {
    success: true,
    instructions: `Pour confirmer votre paiement de ${formattedAmount} GNF:
1. Composez *144#
2. Sélectionnez "Payer facture"
3. Entrez le code marchand: GUINEEGO
4. Entrez le montant: ${amount}
5. Entrez votre code secret
6. Confirmez le paiement

Vous recevrez une confirmation SMS.`
  };
}

/**
 * Initialize MTN Money payment
 */
async function initMTNMoneyPayment(
  phone: string,
  amount: number,
  orderId: string
): Promise<{ success: boolean; instructions: string }> {
  // In production, integrate with MTN MoMo API
  
  const formattedAmount = amount.toLocaleString();
  
  return {
    success: true,
    instructions: `Pour confirmer votre paiement de ${formattedAmount} GNF:
1. Composez *170#
2. Sélectionnez "Paiement marchand"
3. Entrez le code: GUINEEGO
4. Entrez le montant: ${amount}
5. Entrez votre PIN
6. Confirmez

Vous recevrez une confirmation SMS.`
  };
}
