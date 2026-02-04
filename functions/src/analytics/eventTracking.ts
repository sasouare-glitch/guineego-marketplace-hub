/**
 * EVENT TRACKING: Log Business Events for Analytics
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp: admin.firestore.Timestamp;
  platform: 'web' | 'ios' | 'android';
  version?: string;
}

/**
 * Log custom analytics event
 */
export const logAnalyticsEvent = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    const { event, properties, sessionId, platform, version } = data;

    if (!event) {
      throw new functions.https.HttpsError('invalid-argument', 'Event name required');
    }

    const eventDoc: AnalyticsEvent = {
      event,
      userId: context.auth?.uid,
      sessionId,
      properties: properties || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      platform: platform || 'web',
      version
    };

    try {
      await db.collection('analytics_events').add(eventDoc);

      // Update real-time counters for critical events
      if (['purchase', 'add_to_cart', 'checkout_started'].includes(event)) {
        await updateRealtimeCounters(event, properties);
      }

      return { success: true };
    } catch (error) {
      console.error('Error logging event:', error);
      throw new functions.https.HttpsError('internal', 'Failed to log event');
    }
  });

/**
 * Update real-time counters for dashboards
 */
async function updateRealtimeCounters(event: string, properties: Record<string, any>) {
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  const counterRef = db.collection('realtime_counters').doc(today);

  const updates: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  switch (event) {
    case 'purchase':
      updates[`hourly.${hour}.purchases`] = admin.firestore.FieldValue.increment(1);
      updates[`hourly.${hour}.revenue`] = admin.firestore.FieldValue.increment(properties.value || 0);
      updates['total.purchases'] = admin.firestore.FieldValue.increment(1);
      updates['total.revenue'] = admin.firestore.FieldValue.increment(properties.value || 0);
      break;

    case 'add_to_cart':
      updates[`hourly.${hour}.addToCart`] = admin.firestore.FieldValue.increment(1);
      updates['total.addToCart'] = admin.firestore.FieldValue.increment(1);
      break;

    case 'checkout_started':
      updates[`hourly.${hour}.checkouts`] = admin.firestore.FieldValue.increment(1);
      updates['total.checkouts'] = admin.firestore.FieldValue.increment(1);
      break;
  }

  await counterRef.set(updates, { merge: true });
}

/**
 * Trigger: Track order lifecycle events
 */
export const onOrderEvent = functions
  .region('europe-west1')
  .firestore.document('orders/{orderId}')
  .onWrite(async (change, context) => {
    const orderId = context.params.orderId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    if (!after) {
      // Order deleted - shouldn't happen normally
      await db.collection('analytics_events').add({
        event: 'order_deleted',
        orderId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // New order
    if (!before) {
      await db.collection('analytics_events').add({
        event: 'order_created',
        orderId,
        userId: after.customerId,
        properties: {
          total: after.total,
          itemCount: after.items?.length || 0,
          sellerId: after.sellerId,
          paymentMethod: after.paymentMethod,
          deliveryCommune: after.delivery?.commune
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Status change
    if (before.status !== after.status) {
      await db.collection('analytics_events').add({
        event: `order_${after.status}`,
        orderId,
        userId: after.customerId,
        properties: {
          previousStatus: before.status,
          newStatus: after.status,
          total: after.total,
          sellerId: after.sellerId,
          timeInPreviousStatus: before.statusUpdatedAt 
            ? (Date.now() - before.statusUpdatedAt.toMillis()) / 1000 
            : null
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger: Track delivery events
 */
export const onDeliveryEvent = functions
  .region('europe-west1')
  .firestore.document('deliveries/{deliveryId}')
  .onWrite(async (change, context) => {
    const deliveryId = context.params.deliveryId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    if (!after) return;

    // New delivery mission
    if (!before) {
      await db.collection('analytics_events').add({
        event: 'delivery_created',
        deliveryId,
        properties: {
          orderId: after.orderId,
          priority: after.priority,
          fee: after.fee,
          pickupCommune: after.pickup?.commune,
          deliveryCommune: after.delivery?.commune
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Delivery completed
    if (before.status !== 'delivered' && after.status === 'delivered') {
      const deliveryTime = after.deliveredAt && after.acceptedAt
        ? (after.deliveredAt.toMillis() - after.acceptedAt.toMillis()) / 60000
        : null;

      await db.collection('analytics_events').add({
        event: 'delivery_completed',
        deliveryId,
        properties: {
          orderId: after.orderId,
          courierId: after.assignedCourierId,
          fee: after.fee,
          deliveryTimeMinutes: deliveryTime,
          priority: after.priority,
          deliveryCommune: after.delivery?.commune
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update courier real-time stats
      await updateCourierRealtimeStats(after.assignedCourierId);
    }

    // Courier assigned
    if (!before.assignedCourierId && after.assignedCourierId) {
      const responseTime = after.acceptedAt && after.createdAt
        ? (after.acceptedAt.toMillis() - after.createdAt.toMillis()) / 1000
        : null;

      await db.collection('analytics_events').add({
        event: 'delivery_accepted',
        deliveryId,
        properties: {
          orderId: after.orderId,
          courierId: after.assignedCourierId,
          responseTimeSeconds: responseTime
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Update courier real-time stats
 */
async function updateCourierRealtimeStats(courierId: string) {
  const today = new Date().toISOString().split('T')[0];
  await db.collection('courier_daily_stats').doc(`${courierId}_${today}`).set({
    deliveries: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

/**
 * Trigger: Track product events
 */
export const onProductEvent = functions
  .region('europe-west1')
  .firestore.document('products/{productId}')
  .onWrite(async (change, context) => {
    const productId = context.params.productId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    if (!after) {
      await db.collection('analytics_events').add({
        event: 'product_deleted',
        productId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    if (!before) {
      await db.collection('analytics_events').add({
        event: 'product_created',
        productId,
        properties: {
          sellerId: after.sellerId,
          category: after.category,
          price: after.price,
          stock: after.stock
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Stock change
    if (before.stock !== after.stock) {
      await db.collection('analytics_events').add({
        event: after.stock === 0 ? 'product_out_of_stock' : 'stock_updated',
        productId,
        properties: {
          sellerId: after.sellerId,
          previousStock: before.stock,
          newStock: after.stock,
          stockChange: after.stock - before.stock
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Price change
    if (before.price !== after.price) {
      await db.collection('analytics_events').add({
        event: 'price_updated',
        productId,
        properties: {
          sellerId: after.sellerId,
          previousPrice: before.price,
          newPrice: after.price,
          priceChange: ((after.price - before.price) / before.price) * 100
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger: Track user signup
 */
export const onUserCreated = functions
  .region('europe-west1')
  .firestore.document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    const userId = context.params.userId;

    await db.collection('analytics_events').add({
      event: 'user_signup',
      userId,
      properties: {
        role: user.role,
        signupMethod: user.signupMethod || 'email',
        referralSource: user.referralSource
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update daily signup counter
    const today = new Date().toISOString().split('T')[0];
    await db.collection('realtime_counters').doc(today).set({
      [`signups.${user.role || 'client'}`]: admin.firestore.FieldValue.increment(1),
      'signups.total': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
