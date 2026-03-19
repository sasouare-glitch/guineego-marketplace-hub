"use strict";
/**
 * DELIVERIES TRIGGERS: Firestore Triggers for Deliveries
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
exports.onDeliveryStatusChanged = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("../utils/firestore");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Trigger: Delivery Status Changed
 * - Pay courier on delivery
 * - Update courier stats
 * - Log analytics
 */
exports.onDeliveryStatusChanged = functions
    .region('europe-west1')
    .firestore.document('deliveries/{missionId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const missionId = context.params.missionId;
    // Only process status changes
    if (before.status === after.status) {
        return;
    }
    const newStatus = after.status;
    try {
        // Process delivery completion
        if (newStatus === 'delivered') {
            // Pay courier
            const courierDoc = await db.collection('couriers')
                .doc(after.assignedCourierId)
                .get();
            if (courierDoc.exists) {
                const courierUserId = courierDoc.data().userId;
                // Add delivery fee to courier wallet
                await (0, firestore_1.updateWalletTransaction)(courierUserId, after.fee, 'credit', `Livraison mission ${missionId}`, { missionId, orderId: after.orderId, type: 'delivery_fee' });
                // Update courier stats
                await courierDoc.ref.update({
                    totalDeliveries: admin.firestore.FieldValue.increment(1),
                    totalEarnings: admin.firestore.FieldValue.increment(after.fee)
                });
                // Notify courier
                await (0, notifications_1.sendNotification)({
                    userId: courierUserId,
                    type: 'payment_received',
                    title: 'Livraison complétée !',
                    body: `${after.fee.toLocaleString()} GNF ajoutés à votre solde`,
                    data: { missionId, amount: after.fee.toString() }
                });
            }
            // Calculate delivery time
            const deliveryTime = after.deliveredAt && after.acceptedAt
                ? (after.deliveredAt.toMillis() - after.acceptedAt.toMillis()) / 60000
                : null;
            // Log analytics
            await db.collection('analytics_events').add({
                event: 'delivery_completed',
                missionId,
                orderId: after.orderId,
                courierId: after.assignedCourierId,
                fee: after.fee,
                deliveryTimeMinutes: deliveryTime,
                priority: after.priority,
                deliveryCommune: after.delivery.commune,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // Mission accepted - notify customer
        if (newStatus === 'accepted') {
            await db.collection('analytics_events').add({
                event: 'delivery_accepted',
                missionId,
                orderId: after.orderId,
                courierId: after.assignedCourierId,
                timeToAcceptSeconds: after.acceptedAt && after.createdAt
                    ? (after.acceptedAt.toMillis() - after.createdAt.toMillis()) / 1000
                    : null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }
    catch (error) {
        console.error('Error in onDeliveryStatusChanged:', error);
    }
});
//# sourceMappingURL=deliveryTriggers.js.map