/**
 * PAYMENTS FUNCTION: Create Payout
 * Process seller payouts to mobile money
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifySeller, verifyAdmin } from '../utils/auth';
// updateWalletTransaction available in firestore utils if needed
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface CreatePayoutData {
  sellerId?: string; // Admin can specify seller
  amount: number;
  method: 'orange_money' | 'mtn_money';
  phone: string;
}

/**
 * Create payout request (seller or admin)
 * httpsCallable: createPayout
 */
export const createPayout = functions
  .region('europe-west1')
  .https.onCall(async (data: CreatePayoutData, context) => {
    let targetSellerId: string;
    
    // Determine seller ID
    if (data.sellerId) {
      verifyAdmin(context);
      targetSellerId = data.sellerId;
    } else {
      const claims = verifySeller(context);
      targetSellerId = claims.ecommerceId!;
    }

    const { amount, method, phone } = data;

    if (!amount || amount < 50000) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Montant minimum: 50,000 GNF'
      );
    }

    if (!phone || !['orange_money', 'mtn_money'].includes(method)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Numéro de téléphone et méthode requis'
      );
    }

    try {
      // Get seller's pending payout amount
      const sellerDoc = await db.collection('ecommerces').doc(targetSellerId).get();
      
      if (!sellerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Vendeur non trouvé');
      }

      const seller = sellerDoc.data()!;
      const availableBalance = seller.pendingPayout || 0;

      if (amount > availableBalance) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Solde insuffisant. Disponible: ${availableBalance.toLocaleString()} GNF`
        );
      }

      // Create payout record
      const payoutRef = db.collection('seller_payouts').doc();
      await payoutRef.set({
        id: payoutRef.id,
        sellerId: targetSellerId,
        userId: seller.userId,
        amount,
        method,
        phone,
        fee: Math.floor(amount * 0.01), // 1% fee
        netAmount: amount - Math.floor(amount * 0.01),
        status: 'pending',
        requestedBy: context.auth!.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Deduct from pending payout
      await sellerDoc.ref.update({
        pendingPayout: admin.firestore.FieldValue.increment(-amount)
      });

      // In production: initiate actual mobile money transfer
      // For now, mark as processing
      await payoutRef.update({
        status: 'processing'
      });

      // Notify seller
      await sendNotification({
        userId: seller.userId,
        type: 'payout_sent',
        title: 'Retrait en cours',
        body: `Votre retrait de ${amount.toLocaleString()} GNF vers ${phone} est en cours de traitement.`,
        data: { payoutId: payoutRef.id }
      });

      return {
        success: true,
        payoutId: payoutRef.id,
        amount,
        netAmount: amount - Math.floor(amount * 0.01),
        message: 'Demande de retrait enregistrée'
      };

    } catch (error: any) {
      console.error('Error creating payout:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la demande de retrait'
      );
    }
  });
