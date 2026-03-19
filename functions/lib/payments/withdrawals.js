"use strict";
/**
 * PAYMENTS FUNCTION: Withdrawals
 * Process wallet withdrawals to mobile money
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
exports.getWithdrawalHistory = exports.rejectWithdrawal = exports.approveWithdrawal = exports.requestWithdrawal = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
// Withdrawal limits
const WITHDRAWAL_LIMITS = {
    minAmount: 10000, // 10,000 GNF minimum
    maxAmount: 5000000, // 5,000,000 GNF maximum per transaction
    dailyLimit: 10000000, // 10,000,000 GNF per day
    fee: 0.01, // 1% withdrawal fee
    minFee: 500, // Minimum 500 GNF fee
};
/**
 * Request withdrawal from wallet
 * httpsCallable: requestWithdrawal
 */
exports.requestWithdrawal = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { amount, method, phone, note } = data;
    // Validate inputs
    if (!amount || !method || !phone) {
        throw new functions.https.HttpsError('invalid-argument', 'amount, method et phone sont requis');
    }
    if (amount < WITHDRAWAL_LIMITS.minAmount) {
        throw new functions.https.HttpsError('invalid-argument', `Montant minimum: ${WITHDRAWAL_LIMITS.minAmount.toLocaleString()} GNF`);
    }
    if (amount > WITHDRAWAL_LIMITS.maxAmount) {
        throw new functions.https.HttpsError('invalid-argument', `Montant maximum: ${WITHDRAWAL_LIMITS.maxAmount.toLocaleString()} GNF`);
    }
    // Validate phone format
    const phoneRegex = /^(620|621|622|623|624|625|626|627|628|629|660|661|662|663|664|665|666|667|668|669)\d{6}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        throw new functions.https.HttpsError('invalid-argument', 'Numéro de téléphone invalide');
    }
    try {
        return await db.runTransaction(async (transaction) => {
            // Get wallet
            const walletRef = db.collection('wallets').doc(uid);
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Wallet non trouvé');
            }
            const wallet = walletDoc.data();
            const currentBalance = wallet.balance || 0;
            // Calculate fee
            let fee = Math.round(amount * WITHDRAWAL_LIMITS.fee);
            if (fee < WITHDRAWAL_LIMITS.minFee) {
                fee = WITHDRAWAL_LIMITS.minFee;
            }
            const totalDebit = amount + fee;
            // Check balance
            if (currentBalance < totalDebit) {
                throw new functions.https.HttpsError('failed-precondition', `Solde insuffisant. Disponible: ${currentBalance.toLocaleString()} GNF, requis: ${totalDebit.toLocaleString()} GNF`);
            }
            // Check daily limit
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dailyWithdrawals = await db.collection('withdrawals')
                .where('userId', '==', uid)
                .where('createdAt', '>=', today)
                .where('status', 'in', ['pending', 'approved', 'completed'])
                .get();
            const dailyTotal = dailyWithdrawals.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            if (dailyTotal + amount > WITHDRAWAL_LIMITS.dailyLimit) {
                throw new functions.https.HttpsError('failed-precondition', `Limite quotidienne atteinte. Disponible: ${(WITHDRAWAL_LIMITS.dailyLimit - dailyTotal).toLocaleString()} GNF`);
            }
            // Check pending withdrawals
            const pendingWithdrawals = await db.collection('withdrawals')
                .where('userId', '==', uid)
                .where('status', '==', 'pending')
                .limit(1)
                .get();
            if (!pendingWithdrawals.empty) {
                throw new functions.https.HttpsError('failed-precondition', 'Vous avez déjà une demande de retrait en attente');
            }
            const newBalance = currentBalance - totalDebit;
            // Create withdrawal request
            const withdrawalRef = db.collection('withdrawals').doc();
            const withdrawalData = {
                id: withdrawalRef.id,
                userId: uid,
                amount,
                fee,
                netAmount: amount, // Amount user will receive
                method,
                phone: cleanPhone,
                note: note || null,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            // Create pending transaction (will be completed when withdrawal is approved)
            const txRef = db.collection('transactions').doc();
            const txData = {
                id: txRef.id,
                userId: uid,
                type: 'debit',
                category: 'withdrawal',
                amount: totalDebit,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                description: `Retrait ${method === 'orange_money' ? 'Orange Money' : 'MTN Money'}`,
                metadata: {
                    withdrawalId: withdrawalRef.id,
                    method,
                    phone: cleanPhone,
                    fee,
                    netAmount: amount
                },
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            // Update wallet (debit immediately to reserve funds)
            transaction.update(walletRef, {
                balance: newBalance,
                pendingWithdrawals: admin.firestore.FieldValue.increment(amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            transaction.set(withdrawalRef, withdrawalData);
            transaction.set(txRef, txData);
            return {
                success: true,
                withdrawalId: withdrawalRef.id,
                amount,
                fee,
                netAmount: amount,
                newBalance,
                message: 'Demande de retrait soumise. Vous recevrez une confirmation sous 24h.'
            };
        });
    }
    catch (error) {
        console.error('Error requesting withdrawal:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la demande de retrait');
    }
});
/**
 * Approve withdrawal (admin only)
 * httpsCallable: approveWithdrawal
 */
exports.approveWithdrawal = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    (0, auth_1.verifyAdmin)(context);
    const { withdrawalId, transactionReference } = data;
    if (!withdrawalId) {
        throw new functions.https.HttpsError('invalid-argument', 'withdrawalId est requis');
    }
    try {
        return await db.runTransaction(async (transaction) => {
            const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
            const withdrawalDoc = await transaction.get(withdrawalRef);
            if (!withdrawalDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Retrait non trouvé');
            }
            const withdrawal = withdrawalDoc.data();
            if (withdrawal.status !== 'pending') {
                throw new functions.https.HttpsError('failed-precondition', `Retrait déjà traité (status: ${withdrawal.status})`);
            }
            // Find and update the pending transaction
            const txQuery = await db.collection('transactions')
                .where('metadata.withdrawalId', '==', withdrawalId)
                .where('status', '==', 'pending')
                .limit(1)
                .get();
            if (!txQuery.empty) {
                transaction.update(txQuery.docs[0].ref, {
                    status: 'completed',
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // Update withdrawal
            transaction.update(withdrawalRef, {
                status: 'completed',
                transactionReference: transactionReference || null,
                approvedBy: context.auth.uid,
                approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update wallet pending amount
            const walletRef = db.collection('wallets').doc(withdrawal.userId);
            transaction.update(walletRef, {
                pendingWithdrawals: admin.firestore.FieldValue.increment(-withdrawal.amount),
                totalWithdrawals: admin.firestore.FieldValue.increment(withdrawal.amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                success: true,
                withdrawalId,
                amount: withdrawal.amount,
                userId: withdrawal.userId
            };
        });
    }
    catch (error) {
        console.error('Error approving withdrawal:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de l\'approbation du retrait');
    }
});
/**
 * Reject withdrawal (admin only)
 * httpsCallable: rejectWithdrawal
 */
exports.rejectWithdrawal = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    (0, auth_1.verifyAdmin)(context);
    const { withdrawalId, reason } = data;
    if (!withdrawalId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'withdrawalId et reason sont requis');
    }
    try {
        return await db.runTransaction(async (transaction) => {
            const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
            const withdrawalDoc = await transaction.get(withdrawalRef);
            if (!withdrawalDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Retrait non trouvé');
            }
            const withdrawal = withdrawalDoc.data();
            if (withdrawal.status !== 'pending') {
                throw new functions.https.HttpsError('failed-precondition', 'Retrait déjà traité');
            }
            // Refund the amount to wallet
            const walletRef = db.collection('wallets').doc(withdrawal.userId);
            const walletDoc = await transaction.get(walletRef);
            if (walletDoc.exists) {
                const totalRefund = withdrawal.amount + withdrawal.fee;
                transaction.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(totalRefund),
                    pendingWithdrawals: admin.firestore.FieldValue.increment(-withdrawal.amount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // Create refund transaction
                const txRef = db.collection('transactions').doc();
                transaction.set(txRef, {
                    id: txRef.id,
                    userId: withdrawal.userId,
                    type: 'credit',
                    category: 'withdrawal_refund',
                    amount: totalRefund,
                    description: 'Remboursement retrait refusé',
                    metadata: {
                        withdrawalId,
                        reason
                    },
                    status: 'completed',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // Cancel the pending transaction
            const txQuery = await db.collection('transactions')
                .where('metadata.withdrawalId', '==', withdrawalId)
                .where('status', '==', 'pending')
                .limit(1)
                .get();
            if (!txQuery.empty) {
                transaction.update(txQuery.docs[0].ref, {
                    status: 'cancelled',
                    cancelReason: reason,
                    cancelledAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // Update withdrawal
            transaction.update(withdrawalRef, {
                status: 'rejected',
                rejectionReason: reason,
                rejectedBy: context.auth.uid,
                rejectedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                success: true,
                withdrawalId,
                refundedAmount: withdrawal.amount + withdrawal.fee
            };
        });
    }
    catch (error) {
        console.error('Error rejecting withdrawal:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du rejet du retrait');
    }
});
/**
 * Get user's withdrawal history
 * httpsCallable: getWithdrawalHistory
 */
exports.getWithdrawalHistory = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { limit = 20, startAfter } = data;
    try {
        let query = db.collection('withdrawals')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit);
        if (startAfter) {
            const startDoc = await db.collection('withdrawals').doc(startAfter).get();
            if (startDoc.exists) {
                query = query.startAfter(startDoc);
            }
        }
        const snapshot = await query.get();
        const withdrawals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            approvedAt: doc.data().approvedAt?.toDate?.()?.toISOString() || null,
            completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || null
        }));
        return {
            success: true,
            withdrawals,
            lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
            hasMore: snapshot.docs.length === limit
        };
    }
    catch (error) {
        console.error('Error getting withdrawal history:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la récupération de l\'historique');
    }
});
//# sourceMappingURL=withdrawals.js.map