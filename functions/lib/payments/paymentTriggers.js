"use strict";
/**
 * PAYMENTS TRIGGERS: Firestore Triggers for Payments
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
exports.onPaymentCompleted = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Trigger: Payment Completed
 * - Update order status
 * - Update seller stats
 * - Log analytics
 */
exports.onPaymentCompleted = functions
    .region('europe-west1')
    .firestore.document('payments/{paymentId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const paymentId = context.params.paymentId;
    // Only process status changes to completed
    if (before.status === after.status || after.status !== 'completed') {
        return;
    }
    try {
        // Log payment analytics
        await db.collection('analytics_events').add({
            event: 'payment_completed',
            paymentId,
            orderId: after.orderId,
            customerId: after.customerId,
            amount: after.amount,
            method: after.method,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update daily revenue stats
        const today = new Date().toISOString().split('T')[0];
        const statsRef = db.collection('daily_stats').doc(today);
        await statsRef.set({
            date: today,
            totalRevenue: admin.firestore.FieldValue.increment(after.amount),
            totalOrders: admin.firestore.FieldValue.increment(1),
            paymentMethods: {
                [after.method]: admin.firestore.FieldValue.increment(1)
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Payment ${paymentId} completed successfully`);
    }
    catch (error) {
        console.error('Error in onPaymentCompleted:', error);
    }
});
//# sourceMappingURL=paymentTriggers.js.map