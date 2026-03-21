/**
 * ORDERS FUNCTION: Update Order Status
 * Status management with history tracking
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth, UserClaims } from '../utils/auth';
import { notifyOrderStatus } from '../utils/notifications';

const db = admin.firestore();

type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface UpdateStatusData {
  orderId: string;
  status: OrderStatus;
  note?: string;
}

// Status transitions allowed per role
const allowedTransitions: Record<string, Record<string, OrderStatus[]>> = {
  customer: {
    pending: ['cancelled']
  },
  ecommerce: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing'],
    preparing: ['ready']
  },
  closer: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing']
  },
  courier: {
    ready: ['shipped'],
    shipped: ['in_delivery'],
    in_delivery: ['delivered']
  },
  admin: {
    // Admin can do any transition
    pending: ['confirmed', 'preparing', 'ready', 'shipped', 'cancelled'],
    confirmed: ['preparing', 'ready', 'shipped', 'cancelled'],
    preparing: ['ready', 'shipped', 'cancelled'],
    ready: ['shipped', 'in_delivery', 'cancelled'],
    shipped: ['in_delivery', 'delivered', 'cancelled'],
    in_delivery: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: ['refunded']
  }
};

/**
 * Update order status
 * httpsCallable: updateOrderStatus
 */
export const updateOrderStatus = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateStatusData, context) => {
    const uid = verifyAuth(context);
    const claims = context.auth!.token as UserClaims;
    const { orderId, status, note } = data;

    if (!orderId || !status) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId et status sont requis'
      );
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
      }

      const order = orderDoc.data()!;
      const currentStatus = order.status as OrderStatus;
      const role = claims.role || 'customer';

      // Verify permission
      let hasPermission = false;

      if (role === 'admin') {
        hasPermission = true;
      } else if (role === 'customer' && order.customerId === uid) {
        hasPermission = allowedTransitions.customer[currentStatus]?.includes(status) || false;
      } else if (role === 'ecommerce' && order.sellerIds?.includes(claims.ecommerceId)) {
        hasPermission = allowedTransitions.ecommerce[currentStatus]?.includes(status) || false;
      } else if (role === 'closer' && order.assignedCloser === uid) {
        hasPermission = allowedTransitions.closer[currentStatus]?.includes(status) || false;
      } else if (role === 'courier' && order.assignedCourier === uid) {
        hasPermission = allowedTransitions.courier[currentStatus]?.includes(status) || false;
      }

      if (!hasPermission) {
        throw new functions.https.HttpsError(
          'permission-denied',
          `Transition ${currentStatus} → ${status} non autorisée pour votre rôle`
        );
      }

      // Update order
      const statusEntry = {
        status,
        timestamp: admin.firestore.Timestamp.now(),
        performedBy: uid,
        role,
        note: note || null
      };

      await orderRef.update({
        status,
        statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      await notifyOrderStatus(order.customerId, orderId, status);

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: status,
        message: `Statut mis à jour: ${status}`
      };

    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour du statut'
      );
    }
  });
