"use strict";
/**
 * Notification Utilities - FCM + In-App
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendBulkNotification = sendBulkNotification;
exports.notifyAdmins = notifyAdmins;
exports.notifySellerNewOrder = notifySellerNewOrder;
exports.notifyOrderStatus = notifyOrderStatus;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Send notification to user (in-app + optional push)
 */
async function sendNotification(payload) {
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
            const fcmTokens = userData?.fcmTokens || [];
            if (fcmTokens.length > 0) {
                const message = {
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
                    const invalidTokens = [];
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
        }
        catch (error) {
            console.error('FCM notification error:', error);
            // Don't throw - in-app notification was saved
        }
    }
}
/**
 * Send notification to multiple users
 */
async function sendBulkNotification(userIds, notification) {
    const promises = userIds.map(userId => sendNotification({ ...notification, userId }));
    await Promise.all(promises);
}
/**
 * Notify all admins
 */
async function notifyAdmins(notification) {
    const adminsSnapshot = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
    const adminIds = adminsSnapshot.docs.map(doc => doc.id);
    await sendBulkNotification(adminIds, notification);
}
/**
 * Notify seller about new order
 */
async function notifySellerNewOrder(sellerId, orderId, orderAmount) {
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
async function notifyOrderStatus(customerId, orderId, status) {
    const statusMessages = {
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
//# sourceMappingURL=notifications.js.map