"use strict";
/**
 * SUBSCRIPTION WEBHOOKS: Mobile Money Callback Handlers for Seller Plans
 * Handles callbacks from Orange Money API and MTN MoMo API
 * Confirms pending subscription payments and activates the new plan
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
exports.confirmSubscriptionPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Orange Money Webhook for Subscription Payments
 * Called by Orange Money API when payment status changes
 *
 * Orange Money sends a POST with:
 * - status: "SUCCESS" | "FAILED" | "CANCELLED"
 * - order_id: our paymentDocId
 * - pay_token: token we received at initiation
 * - txnid: Orange transaction ID
 */
exports.confirmSubscriptionPayment = functions
    .region('europe-west1')
    .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const body = req.body;
        console.log('Subscription webhook received:', JSON.stringify(body));
        // Orange Money callback format
        const status = body.status;
        const orderId = body.order_id; // This is our paymentDocId
        const payToken = body.pay_token;
        const txnId = body.txnid;
        // Also support our manual/generic format for testing & MTN
        const fallbackReference = body.reference;
        const fallbackSellerId = body.sellerId;
        const fallbackTransactionId = body.transactionId;
        let paymentDoc = null;
        let sellerId = null;
        // Strategy 1: Find by order_id (paymentDocId) — scan all sellers
        const searchId = orderId || fallbackReference;
        if (searchId) {
            const allPendingSnap = await db.collectionGroup('subscription_payments')
                .where('status', '==', 'pending')
                .get();
            for (const doc of allPendingSnap.docs) {
                if (doc.id === searchId) {
                    paymentDoc = doc;
                    sellerId = doc.ref.parent.parent?.id || null;
                    break;
                }
                // Also match by payToken if available
                if (payToken && doc.data().payToken === payToken) {
                    paymentDoc = doc;
                    sellerId = doc.ref.parent.parent?.id || null;
                    break;
                }
            }
        }
        // Strategy 2: Find by payToken only
        if (!paymentDoc && payToken) {
            const tokenQuery = await db.collectionGroup('subscription_payments')
                .where('payToken', '==', payToken)
                .where('status', '==', 'pending')
                .limit(1)
                .get();
            if (!tokenQuery.empty) {
                paymentDoc = tokenQuery.docs[0];
                sellerId = paymentDoc.ref.parent.parent?.id || null;
            }
        }
        // Strategy 3: Fallback by sellerId
        if (!paymentDoc && fallbackSellerId) {
            sellerId = fallbackSellerId;
            const pendingQuery = await db
                .collection('seller_settings')
                .doc(fallbackSellerId)
                .collection('subscription_payments')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            if (!pendingQuery.empty) {
                paymentDoc = pendingQuery.docs[0];
            }
        }
        if (!paymentDoc || !sellerId) {
            console.error('Pending subscription payment not found:', body);
            res.status(404).json({ success: false, error: 'Pending payment not found' });
            return;
        }
        const paymentData = paymentDoc.data();
        // Normalize status across providers
        const normalizedStatus = normalizeStatus(status);
        if (normalizedStatus === 'SUCCESS') {
            // 1. Mark payment as completed
            await paymentDoc.ref.update({
                status: 'completed',
                providerTransactionId: txnId || fallbackTransactionId || '',
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 2. Activate the new plan
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await db.collection('seller_settings').doc(sellerId).update({
                subscription: {
                    planId: paymentData.planId,
                    planName: paymentData.planName,
                    subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
                    expiresAt,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 3. Notify seller
            await (0, notifications_1.sendNotification)({
                userId: sellerId,
                type: 'payment_received',
                title: 'Abonnement activé !',
                body: `Votre plan ${paymentData.planName} est maintenant actif pour 30 jours.`,
                data: { planId: paymentData.planId },
            });
            console.log(`Subscription activated: ${sellerId} → ${paymentData.planId}`);
            res.status(200).json({ success: true, planId: paymentData.planId });
        }
        else if (normalizedStatus === 'FAILED') {
            await paymentDoc.ref.update({
                status: 'failed',
                failureReason: body.reason || 'Paiement mobile money échoué',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await (0, notifications_1.sendNotification)({
                userId: sellerId,
                type: 'payment_received',
                title: 'Paiement échoué',
                body: `Le paiement pour le plan ${paymentData.planName} a échoué. Veuillez réessayer.`,
                data: { planId: paymentData.planId },
            });
            console.log(`Subscription payment failed: ${sellerId}`);
            res.status(200).json({ success: true, status: 'failed' });
        }
        else {
            // Still pending or cancelled
            if (normalizedStatus === 'CANCELLED') {
                await paymentDoc.ref.update({
                    status: 'cancelled',
                    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                res.status(200).json({ success: true, status: 'cancelled' });
            }
            else {
                res.status(200).json({ success: true, status: 'pending' });
            }
        }
    }
    catch (error) {
        console.error('Error processing subscription webhook:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
/**
 * Normalize payment status across providers
 */
function normalizeStatus(status) {
    const upper = (status || '').toUpperCase();
    if (upper === 'SUCCESS' || upper === 'SUCCESSFUL')
        return 'SUCCESS';
    if (upper === 'FAILED' || upper === 'FAILURE')
        return 'FAILED';
    if (upper === 'CANCELLED' || upper === 'CANCELED')
        return 'CANCELLED';
    return 'PENDING';
}
//# sourceMappingURL=subscriptionWebhooks.js.map