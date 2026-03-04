/**
 * ORDERS TRIGGERS: Firestore Triggers for Orders
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification, notifyAdmins } from '../utils/notifications';
import { sendOrderConfirmation } from '../notifications/sendOrderConfirmation';
import { sendStatusNotification } from '../notifications/sendStatusNotification';

const db = admin.firestore();

/**
 * Trigger: Order Created
 * - Assign to closer if available
 * - Update seller stats
 * - Log analytics
 */
export const onOrderCreated = functions
  .region('europe-west1')
  .firestore.document('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const order = snapshot.data();
    const orderId = context.params.orderId;

    try {
      // 1. Find available closer for assignment
      const closersSnapshot = await db.collection('closers')
        .where('isAvailable', '==', true)
        .where('status', '==', 'active')
        .orderBy('assignedOrders', 'asc')
        .limit(1)
        .get();

      if (!closersSnapshot.empty) {
        const closer = closersSnapshot.docs[0];
        
        // Assign closer
        await snapshot.ref.update({
          assignedCloser: closer.data().userId,
          closerId: closer.id
        });

        // Update closer stats
        await closer.ref.update({
          assignedOrders: admin.firestore.FieldValue.increment(1)
        });

        // Notify closer
        await sendNotification({
          userId: closer.data().userId,
          type: 'closing_assigned',
          title: 'Nouvelle commande assignée',
          body: `Commande ${orderId} - ${order.pricing.total.toLocaleString()} GNF`,
          data: { orderId }
        });
      }

      // 2. Update seller stats
      for (const sellerId of order.sellerIds || []) {
        const sellerAmount = order.sellers[sellerId]?.subtotal || 0;
        
        await db.collection('ecommerces').doc(sellerId).update({
          pendingOrders: admin.firestore.FieldValue.increment(1),
          totalOrderValue: admin.firestore.FieldValue.increment(sellerAmount)
        });

        // Create seller order reference
        await db.collection('seller_orders').add({
          sellerId,
          orderId,
          customerId: order.customerId,
          amount: sellerAmount,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 3. Log to analytics
      await db.collection('analytics_events').add({
        event: 'order_created',
        orderId,
        customerId: order.customerId,
        total: order.pricing.total,
        itemCount: order.items.length,
        sellerCount: order.sellerIds?.length || 1,
        paymentMethod: order.paymentMethod,
        commune: order.shippingAddress.commune,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Send confirmation SMS + Email to customer
      await sendOrderConfirmation({
        id: orderId,
        customerId: order.customerId,
        pricing: order.pricing,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
      });

      console.log(`Order ${orderId} processed successfully`);

    } catch (error) {
      console.error('Error in onOrderCreated:', error);
    }
  });

/**
 * Trigger: Order Status Changed
 * - Process payments on confirmation
 * - Create delivery mission on ready
 * - Calculate commissions on delivery
 */
export const onOrderStatusChanged = functions
  .region('europe-west1')
  .firestore.document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    // Only process status changes
    if (before.status === after.status) {
      return;
    }

    const newStatus = after.status;

    try {
      switch (newStatus) {
        case 'confirmed':
          // Order confirmed by seller/closer
          await db.collection('analytics_events').add({
            event: 'order_confirmed',
            orderId,
            confirmedBy: after.statusHistory?.slice(-1)[0]?.performedBy,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;

        case 'ready':
          // Create delivery mission
          await createDeliveryMission(orderId, after);
          break;

        case 'delivered':
          // Process seller payouts
          await processSellerPayouts(orderId, after);
          
          // Update closer metrics
          if (after.closerId) {
            await db.collection('closers').doc(after.closerId).update({
              completedOrders: admin.firestore.FieldValue.increment(1)
            });
          }

          // Update courier stats
          if (after.assignedCourier) {
            await db.collection('couriers').doc(after.assignedCourier).update({
              totalDeliveries: admin.firestore.FieldValue.increment(1)
            });
          }
          break;

        case 'cancelled':
          // Update seller pending orders
          for (const sellerId of after.sellerIds || []) {
            await db.collection('ecommerces').doc(sellerId).update({
              pendingOrders: admin.firestore.FieldValue.increment(-1)
            });
          }
          break;
      }

      // Send SMS + Email notification for status changes
      const notifiableStatuses = ['confirmed', 'preparing', 'ready', 'shipped', 'in_delivery', 'delivered', 'cancelled'];
      if (notifiableStatuses.includes(newStatus)) {
        await sendStatusNotification({
          orderId,
          customerId: after.customerId,
          status: newStatus as any,
          customerName: after.shippingAddress?.fullName,
          commune: after.shippingAddress?.commune,
          total: after.pricing?.total,
        });
      }

      // Log status change
      await db.collection('analytics_events').add({
        event: 'order_status_changed',
        orderId,
        previousStatus: before.status,
        newStatus,
        performedBy: after.statusHistory?.slice(-1)[0]?.performedBy,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error in onOrderStatusChanged:', error);
    }
  });

/**
 * Create delivery mission when order is ready
 */
async function createDeliveryMission(orderId: string, order: any): Promise<void> {
  const missionRef = db.collection('deliveries').doc();
  
  await missionRef.set({
    id: missionRef.id,
    orderId,
    customerId: order.customerId,
    sellerIds: order.sellerIds,
    pickup: {
      // Get from first seller
      address: 'À récupérer chez le vendeur',
      commune: 'Kaloum' // Default
    },
    delivery: order.shippingAddress,
    status: 'pending',
    assignedCourier: null,
    fee: order.pricing.shippingFee,
    distance: null,
    estimatedTime: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Link mission to order
  await db.collection('orders').doc(orderId).update({
    deliveryMissionId: missionRef.id
  });

  // Notify available couriers in the zone
  const couriersSnapshot = await db.collection('couriers')
    .where('isOnline', '==', true)
    .where('zones', 'array-contains', order.shippingAddress.commune)
    .limit(10)
    .get();

  for (const courier of couriersSnapshot.docs) {
    await sendNotification({
      userId: courier.data().userId,
      type: 'new_mission',
      title: 'Nouvelle mission disponible',
      body: `Livraison vers ${order.shippingAddress.commune} - ${order.pricing.shippingFee.toLocaleString()} GNF`,
      data: { missionId: missionRef.id, orderId }
    });
  }
}

/**
 * Process seller payouts on delivery
 */
async function processSellerPayouts(orderId: string, order: any): Promise<void> {
  for (const sellerId of order.sellerIds || []) {
    const sellerData = order.sellers[sellerId];
    if (!sellerData) continue;

    // Get seller commission rate
    const sellerDoc = await db.collection('ecommerces').doc(sellerId).get();
    const commissionRate = sellerDoc.data()?.commission || 0.1;

    // Calculate payout
    const grossAmount = sellerData.subtotal;
    const commission = Math.floor(grossAmount * commissionRate);
    const netAmount = grossAmount - commission;

    // Create payout record
    await db.collection('payouts').add({
      sellerId,
      orderId,
      grossAmount,
      commission,
      commissionRate,
      netAmount,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update seller stats
    await db.collection('ecommerces').doc(sellerId).update({
      totalSales: admin.firestore.FieldValue.increment(1),
      totalRevenue: admin.firestore.FieldValue.increment(netAmount),
      pendingPayout: admin.firestore.FieldValue.increment(netAmount),
      pendingOrders: admin.firestore.FieldValue.increment(-1)
    });

    // Notify seller
    await sendNotification({
      userId: sellerId,
      type: 'payment_received',
      title: 'Vente complétée !',
      body: `Commande livrée. ${netAmount.toLocaleString()} GNF ajoutés à votre solde.`,
      data: { orderId, amount: netAmount.toString() }
    });
  }
}
