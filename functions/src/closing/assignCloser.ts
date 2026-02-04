/**
 * CLOSING FUNCTION: Assign Closer
 * Assign order to closer for follow-up
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAdmin, verifySeller } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface AssignCloserData {
  orderId: string;
  closerId?: string; // Optional - auto-assign if not provided
}

/**
 * Assign closer to order
 * httpsCallable: assignCloser
 */
export const assignCloser = functions
  .region('europe-west1')
  .https.onCall(async (data: AssignCloserData, context) => {
    // Verify admin or seller
    const claims = context.auth?.token;
    if (claims?.role !== 'admin' && claims?.role !== 'ecommerce') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seuls les admins et vendeurs peuvent assigner des closers'
      );
    }

    const { orderId, closerId } = data;

    if (!orderId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId est requis'
      );
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
      }

      const order = orderDoc.data()!;

      // Verify seller owns order (if seller)
      if (claims?.role === 'ecommerce' && !order.sellerIds?.includes(claims.ecommerceId)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous ne pouvez pas modifier cette commande'
        );
      }

      let selectedCloser: any;

      if (closerId) {
        // Use specified closer
        const closerDoc = await db.collection('closers').doc(closerId).get();
        if (!closerDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Closer non trouvé');
        }
        selectedCloser = { id: closerId, ...closerDoc.data() };
      } else {
        // Auto-assign based on workload
        const closersSnapshot = await db.collection('closers')
          .where('isAvailable', '==', true)
          .where('status', '==', 'active')
          .orderBy('assignedOrders', 'asc')
          .limit(1)
          .get();

        if (closersSnapshot.empty) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Aucun closer disponible'
          );
        }

        selectedCloser = { 
          id: closersSnapshot.docs[0].id, 
          ...closersSnapshot.docs[0].data() 
        };
      }

      // Unassign previous closer if exists
      if (order.closerId) {
        await db.collection('closers').doc(order.closerId).update({
          assignedOrders: admin.firestore.FieldValue.increment(-1)
        });
      }

      // Assign new closer
      await orderRef.update({
        assignedCloser: selectedCloser.userId,
        closerId: selectedCloser.id,
        closerAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update closer stats
      await db.collection('closers').doc(selectedCloser.id).update({
        assignedOrders: admin.firestore.FieldValue.increment(1),
        lastAssignedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create closing task
      await db.collection('closing_tasks').add({
        orderId,
        closerId: selectedCloser.id,
        closerUserId: selectedCloser.userId,
        customerId: order.customerId,
        customerPhone: order.shippingAddress.phone,
        orderTotal: order.pricing.total,
        status: 'pending',
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify closer
      await sendNotification({
        userId: selectedCloser.userId,
        type: 'closing_assigned',
        title: 'Nouvelle commande à closer',
        body: `Commande ${orderId} - ${order.pricing.total.toLocaleString()} GNF`,
        data: { orderId }
      });

      return {
        success: true,
        closerId: selectedCloser.id,
        closerName: selectedCloser.displayName || 'Closer',
        message: 'Closer assigné avec succès'
      };

    } catch (error: any) {
      console.error('Error assigning closer:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'assignation du closer'
      );
    }
  });
