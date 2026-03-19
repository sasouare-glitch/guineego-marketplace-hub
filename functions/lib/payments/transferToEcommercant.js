"use strict";
/**
 * PAYMENTS FUNCTION: Transfer to E-commerçant
 * Auto-transfer funds to seller after delivery confirmation
 * CRITICAL FINANCIAL FUNCTION
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
exports.onDeliveryConfirmed = exports.transferToEcommercant = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
// Commission rates
const COMMISSION_RATES = {
    guineego: 0.05, // 5% commission GuineeGo
    deliveryBase: 10000, // Frais de livraison de base (GNF)
    deliveryPerKm: 1000, // Par km additionnel
};
/**
 * Transfer funds to e-commerçant after delivery confirmation
 * httpsCallable: transferToEcommercant
 */
exports.transferToEcommercant = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    // Only admin or system can trigger manual transfers
    if (context.auth) {
        (0, auth_1.verifyAdmin)(context);
    }
    const { orderId } = data;
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId est requis');
    }
    try {
        return await db.runTransaction(async (transaction) => {
            // Get order
            const orderRef = db.collection('orders').doc(orderId);
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
            }
            const order = orderDoc.data();
            // Verify order is eligible for payout
            if (order.paymentStatus !== 'paid') {
                throw new functions.https.HttpsError('failed-precondition', 'Le paiement de la commande n\'est pas confirmé');
            }
            if (order.status !== 'delivered') {
                throw new functions.https.HttpsError('failed-precondition', 'La commande n\'est pas encore livrée');
            }
            if (order.payoutStatus === 'completed') {
                throw new functions.https.HttpsError('already-exists', 'Le reversement a déjà été effectué');
            }
            // Calculate payouts per seller
            const sellerPayouts = await calculateSellerPayouts(order, transaction);
            const payoutResults = [];
            // Process each seller payout
            for (const payout of sellerPayouts) {
                // Get or create seller wallet
                const walletRef = db.collection('wallets').doc(payout.sellerId);
                const walletDoc = await transaction.get(walletRef);
                let currentBalance = 0;
                if (walletDoc.exists) {
                    currentBalance = walletDoc.data().balance || 0;
                }
                const newBalance = currentBalance + payout.netAmount;
                // Create transaction record
                const txRef = db.collection('transactions').doc();
                const txData = {
                    id: txRef.id,
                    userId: payout.sellerId,
                    type: 'credit',
                    category: 'sale',
                    amount: payout.netAmount,
                    grossAmount: payout.amount,
                    commission: payout.commission,
                    commissionRate: COMMISSION_RATES.guineego,
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                    description: `Vente commande ${orderId}`,
                    metadata: {
                        orderId,
                        items: payout.items,
                        customerId: order.customerId
                    },
                    status: 'completed',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };
                // Update or create wallet
                if (walletDoc.exists) {
                    transaction.update(walletRef, {
                        balance: newBalance,
                        totalEarnings: admin.firestore.FieldValue.increment(payout.netAmount),
                        totalSales: admin.firestore.FieldValue.increment(payout.amount),
                        totalCommissions: admin.firestore.FieldValue.increment(payout.commission),
                        lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                else {
                    transaction.set(walletRef, {
                        userId: payout.sellerId,
                        balance: newBalance,
                        currency: 'GNF',
                        totalEarnings: payout.netAmount,
                        totalSales: payout.amount,
                        totalCommissions: payout.commission,
                        totalWithdrawals: 0,
                        pendingWithdrawals: 0,
                        lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                transaction.set(txRef, txData);
                payoutResults.push({
                    sellerId: payout.sellerId,
                    transactionId: txRef.id,
                    amount: payout.netAmount
                });
            }
            // Update order payout status
            transaction.update(orderRef, {
                payoutStatus: 'completed',
                payoutDetails: sellerPayouts.map(p => ({
                    sellerId: p.sellerId,
                    amount: p.amount,
                    commission: p.commission,
                    netAmount: p.netAmount
                })),
                payoutCompletedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Create payout record for audit
            const payoutRef = db.collection('payouts').doc();
            transaction.set(payoutRef, {
                id: payoutRef.id,
                orderId,
                type: 'seller_payout',
                sellers: sellerPayouts.map(p => ({
                    sellerId: p.sellerId,
                    sellerName: p.sellerName,
                    grossAmount: p.amount,
                    commission: p.commission,
                    netAmount: p.netAmount
                })),
                totalGross: sellerPayouts.reduce((sum, p) => sum + p.amount, 0),
                totalCommission: sellerPayouts.reduce((sum, p) => sum + p.commission, 0),
                totalNet: sellerPayouts.reduce((sum, p) => sum + p.netAmount, 0),
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                success: true,
                orderId,
                payouts: payoutResults,
                totalTransferred: payoutResults.reduce((sum, p) => sum + p.amount, 0)
            };
        });
    }
    catch (error) {
        console.error('Error transferring to ecommercant:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du reversement');
    }
});
/**
 * Calculate payouts for each seller in order
 */
async function calculateSellerPayouts(order, transaction) {
    const sellerItems = new Map();
    for (const item of order.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists)
            continue;
        const product = productDoc.data();
        const sellerId = product.sellerId;
        const itemTotal = item.price * item.quantity;
        if (!sellerItems.has(sellerId)) {
            // Get seller info
            const sellerRef = db.collection('ecommerces').doc(sellerId);
            const sellerDoc = await transaction.get(sellerRef);
            const sellerName = sellerDoc.exists ? sellerDoc.data().shopName : 'Vendeur';
            sellerItems.set(sellerId, {
                sellerId,
                sellerName,
                amount: 0,
                commission: 0,
                netAmount: 0,
                items: []
            });
        }
        const sellerPayout = sellerItems.get(sellerId);
        sellerPayout.amount += itemTotal;
        sellerPayout.items.push({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            total: itemTotal
        });
    }
    // Calculate commissions
    for (const payout of sellerItems.values()) {
        payout.commission = Math.round(payout.amount * COMMISSION_RATES.guineego);
        payout.netAmount = payout.amount - payout.commission;
    }
    return Array.from(sellerItems.values());
}
/**
 * Firestore Trigger: Auto-transfer after delivery confirmation
 */
exports.onDeliveryConfirmed = functions
    .region('europe-west1')
    .firestore.document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;
    // Check if status changed to 'delivered'
    if (before.status !== 'delivered' && after.status === 'delivered') {
        // Check if payment is confirmed
        if (after.paymentStatus === 'paid' && after.payoutStatus !== 'completed') {
            console.log(`Auto-transfer triggered for order ${orderId}`);
            try {
                // Use internal function call
                await db.runTransaction(async (transaction) => {
                    // Inline transfer logic for trigger context
                    const orderRef = db.collection('orders').doc(orderId);
                    // Mark as processing to prevent duplicate triggers
                    transaction.update(orderRef, {
                        payoutStatus: 'processing'
                    });
                });
                // Trigger the transfer
                const transferFn = require('./transferToEcommercant').transferToEcommercant;
                await transferFn.run({ orderId }, { auth: null });
                // Notify sellers
                for (const sellerId of after.sellerIds || []) {
                    await (0, notifications_1.sendNotification)({
                        userId: sellerId,
                        type: 'payout_received',
                        title: 'Vente confirmée',
                        body: `La commande ${orderId} a été livrée. Le reversement est en cours.`,
                        data: { orderId }
                    });
                }
            }
            catch (error) {
                console.error('Auto-transfer failed:', error);
                // Mark for manual review
                await db.collection('orders').doc(orderId).update({
                    payoutStatus: 'failed',
                    payoutError: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
});
//# sourceMappingURL=transferToEcommercant.js.map