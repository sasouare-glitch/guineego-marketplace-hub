/**
 * ORDERS FUNCTION: Cancel Order
 * Order cancellation with stock restoration and refund
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth, UserClaims } from '../utils/auth';
import { restoreStock } from '../products/updateStock';
import { updateWalletTransaction } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface CancelOrderData {
  orderId: string;
  reason: string;
  refundToWallet?: boolean;
}

/**
 * Cancel order with stock restoration
 * httpsCallable: cancelOrder
 */
export const cancelOrder = functions
  .region('europe-west1')
  .https.onCall(async (data: CancelOrderData, context) => {
    const uid = verifyAuth(context);
    const claims = context.auth!.token as unknown as UserClaims;
    const { orderId, reason, refundToWallet = true } = data;

    if (!orderId || !reason) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId et reason sont requis'
      );
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
      }

      const order = orderDoc.data()!;

      // Check if cancellation is allowed
      const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cette commande ne peut plus être annulée'
        );
      }

      // Verify permission
      const isCustomer = order.customerId === uid;
      const isSeller = order.sellerIds?.includes(claims.ecommerceId);
      const isAdmin = claims.role === 'admin';

      if (!isCustomer && !isSeller && !isAdmin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous ne pouvez pas annuler cette commande'
        );
      }

      // 1. Restore stock
      const stockItems = order.items.map((item: any) => ({
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: item.quantity
      }));

      await restoreStock({ items: stockItems, operation: 'decrement', orderId });

      // 2. Process refund if payment was made
      let refundResult = null;
      if (order.paymentStatus === 'paid' && refundToWallet) {
        refundResult = await updateWalletTransaction(
          order.customerId,
          order.pricing.total,
          'credit',
          `Remboursement commande ${orderId}`,
          { orderId, type: 'refund' }
        );
      }

      // 3. Update order status
      const statusEntry = {
        status: 'cancelled',
        timestamp: admin.firestore.Timestamp.now(),
        performedBy: uid,
        role: claims.role,
        note: reason
      };

      await orderRef.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: uid,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        refundTransactionId: refundResult?.transactionId || null,
        statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Update payment status
      const paymentQuery = await db.collection('payments')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      if (!paymentQuery.empty) {
        await paymentQuery.docs[0].ref.update({
          status: 'refunded',
          refundedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 5. Notify customer
      await sendNotification({
        userId: order.customerId,
        type: 'order_status_changed',
        title: 'Commande annulée',
        body: refundResult 
          ? `Votre commande a été annulée. ${order.pricing.total.toLocaleString()} GNF ont été crédités sur votre wallet.`
          : 'Votre commande a été annulée.',
        data: { orderId }
      });

      // 6. Notify sellers
      for (const sellerId of order.sellerIds || []) {
        await sendNotification({
          userId: sellerId,
          type: 'order_status_changed',
          title: 'Commande annulée',
          body: `La commande ${orderId} a été annulée. Raison: ${reason}`,
          data: { orderId }
        });
      }

      return {
        success: true,
        orderId,
        refunded: !!refundResult,
        refundAmount: refundResult ? order.pricing.total : 0,
        message: 'Commande annulée avec succès'
      };

    } catch (error: any) {
      console.error('Error cancelling order:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'annulation de la commande'
      );
    }
  });
