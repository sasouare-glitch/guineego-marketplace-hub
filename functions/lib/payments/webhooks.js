"use strict";
/**
 * PAYMENTS WEBHOOKS: Mobile Money Callback Handlers
 * REST endpoints for payment provider callbacks
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
exports.processMTNWebhook = exports.processOMWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Orange Money Webhook Handler
 * REST endpoint: /processOMWebhook
 */
exports.processOMWebhook = functions
    .region('europe-west1')
    .https.onRequest(async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const data = req.body;
        // Verify signature (in production, validate with OM secret)
        // const isValid = verifyOMSignature(data, req.headers['x-om-signature']);
        // if (!isValid) {
        //   res.status(401).send('Invalid signature');
        //   return;
        // }
        console.log('OM Webhook received:', data);
        // Find payment by reference (orderId)
        const paymentsQuery = await db.collection('payments')
            .where('orderId', '==', data.reference)
            .where('status', '==', 'processing')
            .limit(1)
            .get();
        if (paymentsQuery.empty) {
            console.error('Payment not found for order:', data.reference);
            res.status(404).send('Payment not found');
            return;
        }
        const paymentDoc = paymentsQuery.docs[0];
        const payment = paymentDoc.data();
        if (data.status === 'SUCCESS') {
            // Update payment
            await paymentDoc.ref.update({
                status: 'completed',
                providerTransactionId: data.transactionId,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update order
            await db.collection('orders').doc(data.reference).update({
                paymentStatus: 'paid',
                paidAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Notify customer
            await (0, notifications_1.sendNotification)({
                userId: payment.customerId,
                type: 'payment_received',
                title: 'Paiement confirmé',
                body: `Votre paiement Orange Money de ${data.amount.toLocaleString()} GNF a été reçu.`,
                data: { orderId: data.reference }
            });
            res.status(200).json({ success: true });
        }
        else if (data.status === 'FAILED') {
            await paymentDoc.ref.update({
                status: 'failed',
                failureReason: 'Paiement Orange Money échoué',
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await (0, notifications_1.sendNotification)({
                userId: payment.customerId,
                type: 'payment_received',
                title: 'Paiement échoué',
                body: 'Votre paiement Orange Money a échoué. Veuillez réessayer.',
                data: { orderId: data.reference }
            });
            res.status(200).json({ success: true, status: 'failed' });
        }
        else {
            res.status(200).json({ success: true, status: 'pending' });
        }
    }
    catch (error) {
        console.error('Error processing OM webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});
/**
 * MTN Mobile Money Webhook Handler
 * REST endpoint: /processMTNWebhook
 */
exports.processMTNWebhook = functions
    .region('europe-west1')
    .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const data = req.body;
        console.log('MTN Webhook received:', data);
        // Find payment by externalId (orderId)
        const paymentsQuery = await db.collection('payments')
            .where('orderId', '==', data.externalId)
            .where('status', '==', 'processing')
            .limit(1)
            .get();
        if (paymentsQuery.empty) {
            console.error('Payment not found for order:', data.externalId);
            res.status(404).send('Payment not found');
            return;
        }
        const paymentDoc = paymentsQuery.docs[0];
        const payment = paymentDoc.data();
        if (data.status === 'SUCCESSFUL') {
            await paymentDoc.ref.update({
                status: 'completed',
                providerTransactionId: data.financialTransactionId,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await db.collection('orders').doc(data.externalId).update({
                paymentStatus: 'paid',
                paidAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await (0, notifications_1.sendNotification)({
                userId: payment.customerId,
                type: 'payment_received',
                title: 'Paiement confirmé',
                body: `Votre paiement MTN Money de ${data.amount.toLocaleString()} GNF a été reçu.`,
                data: { orderId: data.externalId }
            });
            res.status(200).json({ success: true });
        }
        else if (data.status === 'FAILED') {
            await paymentDoc.ref.update({
                status: 'failed',
                failureReason: data.reason || 'Paiement MTN Money échoué',
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await (0, notifications_1.sendNotification)({
                userId: payment.customerId,
                type: 'payment_received',
                title: 'Paiement échoué',
                body: 'Votre paiement MTN Money a échoué. Veuillez réessayer.',
                data: { orderId: data.externalId }
            });
            res.status(200).json({ success: true, status: 'failed' });
        }
        else {
            res.status(200).json({ success: true, status: 'pending' });
        }
    }
    catch (error) {
        console.error('Error processing MTN webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=webhooks.js.map