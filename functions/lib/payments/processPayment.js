"use strict";
/**
 * PAYMENTS FUNCTION: Process Payment
 * Handle mobile money and wallet payments
 * CRITICAL FUNCTION
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
exports.processPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const firestore_1 = require("../utils/firestore");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Process payment for order
 * httpsCallable: processPayment
 */
exports.processPayment = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { orderId, paymentId, method, phone } = data;
    if (!orderId || !paymentId || !method) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId, paymentId et method sont requis');
    }
    try {
        // Get payment record
        const paymentRef = db.collection('payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();
        if (!paymentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Paiement non trouvé');
        }
        const payment = paymentDoc.data();
        // Verify ownership
        if (payment.customerId !== uid) {
            throw new functions.https.HttpsError('permission-denied', 'Paiement non autorisé');
        }
        // Check payment status
        if (payment.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Ce paiement a déjà été traité');
        }
        let result;
        switch (method) {
            case 'wallet':
                result = await processWalletPayment(uid, payment.amount, orderId);
                break;
            case 'orange_money':
                result = await initOrangeMoneyPayment(phone, payment.amount, orderId);
                break;
            case 'mtn_money':
                result = await initMTNMoneyPayment(phone, payment.amount, orderId);
                break;
            default:
                throw new functions.https.HttpsError('invalid-argument', 'Méthode invalide');
        }
        if (result.success) {
            // Update payment record
            await paymentRef.update({
                status: method === 'wallet' ? 'completed' : 'processing',
                phone: phone || null,
                transactionId: result.transactionId || null,
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // If wallet payment, update order immediately
            if (method === 'wallet') {
                await db.collection('orders').doc(orderId).update({
                    paymentStatus: 'paid',
                    paidAt: admin.firestore.FieldValue.serverTimestamp()
                });
                await (0, notifications_1.sendNotification)({
                    userId: uid,
                    type: 'payment_received',
                    title: 'Paiement confirmé',
                    body: `Votre paiement de ${payment.amount.toLocaleString()} GNF a été effectué.`,
                    data: { orderId }
                });
            }
        }
        return {
            success: result.success,
            status: method === 'wallet' ? 'completed' : 'processing',
            transactionId: result.transactionId,
            instructions: result.instructions,
            message: method === 'wallet'
                ? 'Paiement effectué avec succès'
                : 'Suivez les instructions pour confirmer le paiement'
        };
    }
    catch (error) {
        console.error('Error processing payment:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du traitement du paiement');
    }
});
/**
 * Process wallet payment
 */
async function processWalletPayment(userId, amount, orderId) {
    const result = await (0, firestore_1.updateWalletTransaction)(userId, amount, 'debit', `Paiement commande ${orderId}`, { orderId, type: 'purchase' });
    return {
        success: result.success,
        transactionId: result.transactionId
    };
}
/**
 * Initialize Orange Money payment
 */
async function initOrangeMoneyPayment(phone, amount, orderId) {
    // In production, integrate with Orange Money API
    // For now, return USSD instructions
    const formattedAmount = amount.toLocaleString();
    return {
        success: true,
        instructions: `Pour confirmer votre paiement de ${formattedAmount} GNF:
1. Composez *144#
2. Sélectionnez "Payer facture"
3. Entrez le code marchand: GUINEEGO
4. Entrez le montant: ${amount}
5. Entrez votre code secret
6. Confirmez le paiement

Vous recevrez une confirmation SMS.`
    };
}
/**
 * Initialize MTN Money payment
 */
async function initMTNMoneyPayment(phone, amount, orderId) {
    // In production, integrate with MTN MoMo API
    const formattedAmount = amount.toLocaleString();
    return {
        success: true,
        instructions: `Pour confirmer votre paiement de ${formattedAmount} GNF:
1. Composez *170#
2. Sélectionnez "Paiement marchand"
3. Entrez le code: GUINEEGO
4. Entrez le montant: ${amount}
5. Entrez votre PIN
6. Confirmez

Vous recevrez une confirmation SMS.`
    };
}
//# sourceMappingURL=processPayment.js.map