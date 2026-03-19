"use strict";
/**
 * PAYMENTS FUNCTION: Investor Payouts
 * Process periodic returns for investors
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
exports.processInvestmentMaturity = exports.scheduledInvestorReturns = exports.processInvestorReturns = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Process investor returns (monthly)
 * httpsCallable: processInvestorReturns
 */
exports.processInvestorReturns = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    (0, auth_1.verifyAdmin)(context);
    const { investmentId, investorId, period } = data;
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    try {
        // Build query
        let query = db.collection('investments')
            .where('status', '==', 'active');
        if (investmentId) {
            const investmentDoc = await db.collection('investments').doc(investmentId).get();
            if (!investmentDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Investissement non trouvé');
            }
            return await processSingleInvestment(investmentDoc, currentPeriod);
        }
        if (investorId) {
            query = query.where('investorId', '==', investorId);
        }
        const investmentsSnapshot = await query.get();
        if (investmentsSnapshot.empty) {
            return {
                success: true,
                message: 'Aucun investissement actif à traiter',
                processed: 0
            };
        }
        const results = [];
        for (const investmentDoc of investmentsSnapshot.docs) {
            try {
                const result = await processSingleInvestment(investmentDoc, currentPeriod);
                results.push({
                    investmentId: investmentDoc.id,
                    investorId: result.investorId,
                    amount: result.returnAmount,
                    success: true
                });
            }
            catch (error) {
                console.error(`Failed to process investment ${investmentDoc.id}:`, error);
                results.push({
                    investmentId: investmentDoc.id,
                    investorId: investmentDoc.data().investorId,
                    amount: 0,
                    success: false,
                    error: error.message
                });
            }
        }
        return {
            success: true,
            period: currentPeriod,
            processed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            totalReturns: results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0),
            details: results
        };
    }
    catch (error) {
        console.error('Error processing investor returns:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du traitement des rendements');
    }
});
/**
 * Process single investment return
 */
async function processSingleInvestment(investmentDoc, period) {
    const investment = investmentDoc.data();
    const investmentId = investmentDoc.id;
    // Check if already paid for this period
    const existingPayout = await db.collection('investor_payouts')
        .where('investmentId', '==', investmentId)
        .where('period', '==', period)
        .limit(1)
        .get();
    if (!existingPayout.empty) {
        throw new Error('Rendement déjà versé pour cette période');
    }
    // Calculate return
    const annualRate = investment.expectedReturn || 0.12; // 12% default
    const monthlyRate = annualRate / 12;
    const returnAmount = Math.round(investment.amount * monthlyRate);
    if (returnAmount <= 0) {
        throw new Error('Montant de rendement invalide');
    }
    return await db.runTransaction(async (transaction) => {
        const investorId = investment.investorId;
        // Get investor wallet
        const walletRef = db.collection('wallets').doc(investorId);
        const walletDoc = await transaction.get(walletRef);
        let currentBalance = 0;
        let totalReturns = 0;
        if (walletDoc.exists) {
            const walletData = walletDoc.data();
            currentBalance = walletData.balance || 0;
            totalReturns = walletData.totalInvestmentReturns || 0;
        }
        const newBalance = currentBalance + returnAmount;
        // Create transaction record
        const txRef = db.collection('transactions').doc();
        const txData = {
            id: txRef.id,
            userId: investorId,
            type: 'credit',
            category: 'investment_return',
            amount: returnAmount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Rendement investissement - ${period}`,
            metadata: {
                investmentId,
                opportunityId: investment.opportunityId,
                period,
                annualRate,
                principalAmount: investment.amount
            },
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // Update wallet
        if (walletDoc.exists) {
            transaction.update(walletRef, {
                balance: newBalance,
                totalInvestmentReturns: totalReturns + returnAmount,
                lastReturnAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            transaction.set(walletRef, {
                userId: investorId,
                userType: 'investor',
                balance: newBalance,
                currency: 'GNF',
                totalEarnings: returnAmount,
                totalInvestmentReturns: returnAmount,
                lastReturnAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // Save transaction
        transaction.set(txRef, txData);
        // Create payout record for audit
        const payoutRef = db.collection('investor_payouts').doc();
        transaction.set(payoutRef, {
            id: payoutRef.id,
            investmentId,
            investorId,
            opportunityId: investment.opportunityId,
            period,
            principalAmount: investment.amount,
            returnRate: annualRate,
            returnAmount,
            transactionId: txRef.id,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update investment with latest payout info
        transaction.update(investmentDoc.ref, {
            lastPayoutPeriod: period,
            lastPayoutAmount: returnAmount,
            totalReturnsReceived: admin.firestore.FieldValue.increment(returnAmount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            investorId,
            returnAmount,
            transactionId: txRef.id
        };
    });
}
/**
 * Scheduled function: Process monthly investor returns
 * Runs on the 1st of each month at 9:00 AM
 */
exports.scheduledInvestorReturns = functions
    .region('europe-west1')
    .pubsub.schedule('0 9 1 * *')
    .timeZone('Africa/Conakry')
    .onRun(async (context) => {
    console.log('Running scheduled investor returns processing');
    const currentPeriod = new Date().toISOString().slice(0, 7);
    try {
        const investmentsSnapshot = await db.collection('investments')
            .where('status', '==', 'active')
            .get();
        let processed = 0;
        let failed = 0;
        let totalAmount = 0;
        for (const investmentDoc of investmentsSnapshot.docs) {
            try {
                const result = await processSingleInvestment(investmentDoc, currentPeriod);
                processed++;
                totalAmount += result.returnAmount;
                // Notify investor
                await (0, notifications_1.sendNotification)({
                    userId: result.investorId,
                    type: 'investment_return',
                    title: 'Rendement reçu',
                    body: `Vous avez reçu ${result.returnAmount.toLocaleString()} GNF de rendement pour ${currentPeriod}`,
                    data: { investmentId: investmentDoc.id }
                });
            }
            catch (error) {
                console.error(`Failed to process investment ${investmentDoc.id}:`, error);
                failed++;
            }
        }
        console.log(`Investor returns processed: ${processed} success, ${failed} failed, total: ${totalAmount} GNF`);
        // Log summary
        await db.collection('scheduled_jobs').add({
            type: 'investor_returns',
            period: currentPeriod,
            processed,
            failed,
            totalAmount,
            executedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error('Scheduled investor returns failed:', error);
    }
});
/**
 * Calculate investment maturity and capital return
 * httpsCallable: processInvestmentMaturity
 */
exports.processInvestmentMaturity = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    (0, auth_1.verifyAdmin)(context);
    const { investmentId } = data;
    if (!investmentId) {
        throw new functions.https.HttpsError('invalid-argument', 'investmentId est requis');
    }
    try {
        return await db.runTransaction(async (transaction) => {
            const investmentRef = db.collection('investments').doc(investmentId);
            const investmentDoc = await transaction.get(investmentRef);
            if (!investmentDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Investissement non trouvé');
            }
            const investment = investmentDoc.data();
            if (investment.status !== 'active') {
                throw new functions.https.HttpsError('failed-precondition', 'L\'investissement n\'est pas actif');
            }
            // Check maturity date
            const maturityDate = investment.maturityDate?.toDate() || new Date();
            if (maturityDate > new Date()) {
                throw new functions.https.HttpsError('failed-precondition', `L'investissement n'est pas encore à maturité (${maturityDate.toISOString().slice(0, 10)})`);
            }
            const investorId = investment.investorId;
            const capitalAmount = investment.amount;
            // Get investor wallet
            const walletRef = db.collection('wallets').doc(investorId);
            const walletDoc = await transaction.get(walletRef);
            const currentBalance = walletDoc.exists ? walletDoc.data().balance || 0 : 0;
            const newBalance = currentBalance + capitalAmount;
            // Create transaction for capital return
            const txRef = db.collection('transactions').doc();
            transaction.set(txRef, {
                id: txRef.id,
                userId: investorId,
                type: 'credit',
                category: 'investment_capital_return',
                amount: capitalAmount,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                description: `Remboursement capital investissement`,
                metadata: {
                    investmentId,
                    opportunityId: investment.opportunityId,
                    totalReturnsReceived: investment.totalReturnsReceived || 0
                },
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update wallet
            if (walletDoc.exists) {
                transaction.update(walletRef, {
                    balance: newBalance,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            else {
                transaction.set(walletRef, {
                    userId: investorId,
                    userType: 'investor',
                    balance: newBalance,
                    currency: 'GNF',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // Mark investment as completed
            transaction.update(investmentRef, {
                status: 'completed',
                capitalReturned: true,
                capitalReturnedAt: admin.firestore.FieldValue.serverTimestamp(),
                capitalReturnTransactionId: txRef.id,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                success: true,
                investmentId,
                investorId,
                capitalReturned: capitalAmount,
                totalReturnsReceived: investment.totalReturnsReceived || 0,
                transactionId: txRef.id
            };
        });
    }
    catch (error) {
        console.error('Error processing investment maturity:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du remboursement du capital');
    }
});
//# sourceMappingURL=investorPayouts.js.map