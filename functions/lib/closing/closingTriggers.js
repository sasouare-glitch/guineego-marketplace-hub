"use strict";
/**
 * CLOSING TRIGGERS: Firestore Triggers for Closing
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
exports.onClosingCompleted = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("../utils/firestore");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Trigger: Closing Task Completed
 * - Pay closer commission if converted
 * - Update leaderboard
 */
exports.onClosingCompleted = functions
    .region('europe-west1')
    .firestore.document('closing_tasks/{taskId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const taskId = context.params.taskId;
    // Only process completion
    if (before.status === after.status || after.status !== 'completed') {
        return;
    }
    try {
        if (after.outcome === 'converted') {
            // Calculate commission
            const commission = Math.floor(after.orderTotal * 0.02);
            // Add to closer's wallet
            await (0, firestore_1.updateWalletTransaction)(after.closerUserId, commission, 'credit', `Commission closing commande ${after.orderId}`, { orderId: after.orderId, taskId, type: 'closer_commission' });
            // Notify closer
            await (0, notifications_1.sendNotification)({
                userId: after.closerUserId,
                type: 'payment_received',
                title: 'Commission reçue !',
                body: `${commission.toLocaleString()} GNF ajoutés pour la conversion de ${after.orderId}`,
                data: { orderId: after.orderId, amount: commission.toString() }
            });
        }
        // Update daily closer stats
        const today = new Date().toISOString().split('T')[0];
        const leaderboardRef = db.collection('closer_leaderboard').doc(`${today}_${after.closerId}`);
        await leaderboardRef.set({
            closerId: after.closerId,
            date: today,
            calls: admin.firestore.FieldValue.increment(after.attempts || 1),
            conversions: after.outcome === 'converted'
                ? admin.firestore.FieldValue.increment(1)
                : admin.firestore.FieldValue.increment(0),
            revenue: after.outcome === 'converted'
                ? admin.firestore.FieldValue.increment(after.orderTotal)
                : admin.firestore.FieldValue.increment(0),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // Log analytics
        await db.collection('analytics_events').add({
            event: 'closing_completed',
            taskId,
            orderId: after.orderId,
            closerId: after.closerId,
            outcome: after.outcome,
            attempts: after.attempts,
            callDuration: after.callDuration,
            orderTotal: after.orderTotal,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error('Error in onClosingCompleted:', error);
    }
});
//# sourceMappingURL=closingTriggers.js.map