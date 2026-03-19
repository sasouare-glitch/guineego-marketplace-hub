"use strict";
/**
 * Scheduled function: cancels pending subscription payments
 * older than 15 minutes without webhook confirmation.
 * Runs every 5 minutes.
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
exports.cancelExpiredPayments = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
const TIMEOUT_MINUTES = 15;
exports.cancelExpiredPayments = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async () => {
    const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);
    // Query all seller_settings documents
    const sellersSnap = await db.collection('seller_settings').get();
    let cancelled = 0;
    for (const sellerDoc of sellersSnap.docs) {
        const paymentsSnap = await sellerDoc.ref
            .collection('subscription_payments')
            .where('status', '==', 'pending')
            .where('createdAt', '<=', cutoff)
            .get();
        for (const paymentDoc of paymentsSnap.docs) {
            const paymentData = paymentDoc.data();
            await paymentDoc.ref.update({
                status: 'cancelled',
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                cancelReason: 'timeout_15min',
            });
            // Notify seller
            await (0, notifications_1.sendNotification)({
                userId: sellerDoc.id,
                type: 'payment_received',
                title: 'Paiement expiré',
                body: `Votre paiement de ${(paymentData.amount || 0).toLocaleString()} GNF pour le plan ${paymentData.plan || ''} a été annulé après 15 min sans confirmation.`,
                data: { paymentId: paymentDoc.id, reason: 'timeout_15min' },
            });
            cancelled++;
        }
    }
    if (cancelled > 0) {
        functions.logger.info(`Cancelled ${cancelled} expired pending payment(s).`);
    }
    return null;
});
//# sourceMappingURL=cancelExpiredPayments.js.map