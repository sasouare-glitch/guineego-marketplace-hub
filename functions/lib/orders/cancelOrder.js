"use strict";
/**
 * ORDERS FUNCTION: Cancel Order
 * Order cancellation with stock restoration and refund
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
exports.cancelOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const updateStock_1 = require("../products/updateStock");
const firestore_1 = require("../utils/firestore");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Cancel order with stock restoration
 * httpsCallable: cancelOrder
 */
exports.cancelOrder = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const claims = context.auth.token;
    const { orderId, reason, refundToWallet = true } = data;
    if (!orderId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId et reason sont requis');
    }
    try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
        }
        const order = orderDoc.data();
        // Check if cancellation is allowed
        const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
        if (!cancellableStatuses.includes(order.status)) {
            throw new functions.https.HttpsError('failed-precondition', 'Cette commande ne peut plus être annulée');
        }
        // Verify permission
        const isCustomer = order.customerId === uid;
        const isSeller = order.sellerIds?.includes(claims.ecommerceId);
        const isAdmin = claims.role === 'admin';
        if (!isCustomer && !isSeller && !isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez pas annuler cette commande');
        }
        // 1. Restore stock
        const stockItems = order.items.map((item) => ({
            productId: item.productId,
            variantSku: item.variantSku,
            quantity: item.quantity
        }));
        await (0, updateStock_1.restoreStock)({ items: stockItems, operation: 'decrement', orderId });
        // 2. Process refund if payment was made
        let refundResult = null;
        if (order.paymentStatus === 'paid' && refundToWallet) {
            refundResult = await (0, firestore_1.updateWalletTransaction)(order.customerId, order.pricing.total, 'credit', `Remboursement commande ${orderId}`, { orderId, type: 'refund' });
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
        await (0, notifications_1.sendNotification)({
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
            await (0, notifications_1.sendNotification)({
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
    }
    catch (error) {
        console.error('Error cancelling order:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de l\'annulation de la commande');
    }
});
//# sourceMappingURL=cancelOrder.js.map