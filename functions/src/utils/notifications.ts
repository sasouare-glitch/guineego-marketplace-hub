/**
 * Notification Utilities - FCM + In-App
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

export type NotificationType = 
  | 'order_created'
  | 'order_status_changed'
  | 'order_assigned'
  | 'order_delivered'
  | 'order_cancelled'
  | 'delivery_started'
  | 'delivery_completed'
  | 'payment_received'
  | 'payout_sent'
  | 'payout_received'
  | 'wallet_credited'
  | 'investment_return'
  | 'course_purchased'
  | 'certificate_issued'
  | 'new_mission'
  | 'closing_assigned';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  userId: string;
  sendPush?: boolean;
}

/**
 * Send notification to user (in-app + optional push)
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { userId, type, title, body, data = {}, sendPush = true } = payload;
  
  // 1. Create in-app notification
  const notificationRef = db.collection('notifications').doc();
  await notificationRef.set({
    id: notificationRef.id,
    userId,
    type,
    title,
    body,
    data,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // 2. Send FCM push notification if enabled
  if (sendPush) {
    try {
      // Get user's FCM tokens
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const fcmTokens: string[] = userData?.fcmTokens || [];
      
      if (fcmTokens.length > 0) {
        const message: admin.messaging.MulticastMessage = {
          tokens: fcmTokens,
          notification: {
            title,
            body
          },
          data: {
            type,
            notificationId: notificationRef.id,
            ...data
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'guineego_notifications',
              sound: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };
        
        const response = await admin.messaging().sendEachForMulticast(message);
        
        // Remove invalid tokens
        if (response.failureCount > 0) {
          const invalidTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              invalidTokens.push(fcmTokens[idx]);
            }
          });
          
          if (invalidTokens.length > 0) {
            await db.collection('users').doc(userId).update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens)
            });
          }
        }
      }
    } catch (error) {
      console.error('FCM notification error:', error);
      // Don't throw - in-app notification was saved
    }
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  notification: Omit<NotificationPayload, 'userId'>
): Promise<void> {
  const promises = userIds.map(userId =>
    sendNotification({ ...notification, userId })
  );
  await Promise.all(promises);
}

/**
 * Notify all admins
 */
export async function notifyAdmins(
  notification: Omit<NotificationPayload, 'userId'>
): Promise<void> {
  const adminsSnapshot = await db.collection('users')
    .where('role', '==', 'admin')
    .get();
  
  const adminIds = adminsSnapshot.docs.map(doc => doc.id);
  await sendBulkNotification(adminIds, notification);
}

/**
 * Notify seller about new order
 */
export async function notifySellerNewOrder(
  sellerId: string,
  orderId: string,
  orderAmount: number
): Promise<void> {
  await sendNotification({
    userId: sellerId,
    type: 'order_created',
    title: 'Nouvelle commande !',
    body: `Vous avez reçu une nouvelle commande de ${orderAmount.toLocaleString()} GNF`,
    data: { orderId }
  });
}

/**
 * Notify customer about order status
 */
export async function notifyOrderStatus(
  customerId: string,
  orderId: string,
  status: string
): Promise<void> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    confirmed: {
      title: 'Commande confirmée',
      body: 'Votre commande a été confirmée par le vendeur'
    },
    preparing: {
      title: 'Préparation en cours',
      body: 'Votre commande est en cours de préparation'
    },
    shipped: {
      title: 'Commande expédiée',
      body: 'Votre commande est en route !'
    },
    delivered: {
      title: 'Commande livrée',
      body: 'Votre commande a été livrée avec succès'
    },
    cancelled: {
      title: 'Commande annulée',
      body: 'Votre commande a été annulée'
    }
  };
  
  const message = statusMessages[status] || {
    title: 'Mise à jour commande',
    body: `Statut: ${status}`
  };
  
  await sendNotification({
    userId: customerId,
    type: 'order_status_changed',
    title: message.title,
    body: message.body,
    data: { orderId, status }
  });
}
