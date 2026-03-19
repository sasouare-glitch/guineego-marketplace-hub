"use strict";
/**
 * PAYMENTS FUNCTION: Create Payout
 * Process seller payouts to mobile money
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
exports.createPayout = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Create payout request (seller or admin)
 * httpsCallable: createPayout
 */
exports.createPayout = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    let targetSellerId;
    // Determine seller ID
    if (data.sellerId) {
        (0, auth_1.verifyAdmin)(context);
        targetSellerId = data.sellerId;
    }
    else {
        const claims = (0, auth_1.verifySeller)(context);
        targetSellerId = claims.ecommerceId;
    }
    const { amount, method, phone } = data;
    if (!amount || amount < 50000) {
        throw new functions.https.HttpsError('invalid-argument', 'Montant minimum: 50,000 GNF');
    }
    if (!phone || !['orange_money', 'mtn_money'].includes(method)) {
        throw new functions.https.HttpsError('invalid-argument', 'Numéro de téléphone et méthode requis');
    }
    try {
        // Get seller's pending payout amount
        const sellerDoc = await db.collection('ecommerces').doc(targetSellerId).get();
        if (!sellerDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Vendeur non trouvé');
        }
        const seller = sellerDoc.data();
        const availableBalance = seller.pendingPayout || 0;
        if (amount > availableBalance) {
            throw new functions.https.HttpsError('failed-precondition', `Solde insuffisant. Disponible: ${availableBalance.toLocaleString()} GNF`);
        }
        // Create payout record
        const payoutRef = db.collection('seller_payouts').doc();
        await payoutRef.set({
            id: payoutRef.id,
            sellerId: targetSellerId,
            userId: seller.userId,
            amount,
            method,
            phone,
            fee: Math.floor(amount * 0.01), // 1% fee
            netAmount: amount - Math.floor(amount * 0.01),
            status: 'pending',
            requestedBy: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Deduct from pending payout
        await sellerDoc.ref.update({
            pendingPayout: admin.firestore.FieldValue.increment(-amount)
        });
        // In production: initiate actual mobile money transfer
        // For now, mark as processing
        await payoutRef.update({
            status: 'processing'
        });
        // Notify seller
        await (0, notifications_1.sendNotification)({
            userId: seller.userId,
            type: 'payout_sent',
            title: 'Retrait en cours',
            body: `Votre retrait de ${amount.toLocaleString()} GNF vers ${phone} est en cours de traitement.`,
            data: { payoutId: payoutRef.id }
        });
        return {
            success: true,
            payoutId: payoutRef.id,
            amount,
            netAmount: amount - Math.floor(amount * 0.01),
            message: 'Demande de retrait enregistrée'
        };
    }
    catch (error) {
        console.error('Error creating payout:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la demande de retrait');
    }
});
//# sourceMappingURL=createPayout.js.map