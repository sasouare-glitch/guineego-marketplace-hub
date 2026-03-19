"use strict";
/**
 * Firestore Utilities - Transactions, Pagination, Queries
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
exports.paginatedQuery = paginatedQuery;
exports.updateStockTransaction = updateStockTransaction;
exports.updateWalletTransaction = updateWalletTransaction;
exports.batchWrite = batchWrite;
exports.generateOrderId = generateOrderId;
exports.generateMissionId = generateMissionId;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const db = admin.firestore();
/**
 * Execute paginated query
 */
async function paginatedQuery(collectionPath, params, additionalFilters) {
    const { limit = 20, startAfter, orderBy = 'createdAt', orderDirection = 'desc' } = params;
    let query = db.collection(collectionPath)
        .orderBy(orderBy, orderDirection)
        .limit(limit + 1); // +1 to check if there are more results
    // Apply additional filters
    if (additionalFilters) {
        query = additionalFilters(query);
    }
    // Apply cursor pagination
    if (startAfter) {
        const startDoc = await db.collection(collectionPath).doc(startAfter).get();
        if (startDoc.exists) {
            query = query.startAfter(startDoc);
        }
    }
    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, limit);
    return {
        data: docs.map(doc => ({ id: doc.id, ...doc.data() })),
        lastDoc: docs.length > 0 ? docs[docs.length - 1].id : null,
        hasMore: snapshot.docs.length > limit
    };
}
// ============================================
// TRANSACTION UTILITIES
// ============================================
/**
 * Atomic stock update with transaction
 */
async function updateStockTransaction(productId, variantSku, quantityDelta) {
    const productRef = db.collection('products').doc(productId);
    return db.runTransaction(async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Produit non trouvé');
        }
        const product = productDoc.data();
        const variants = product.variants || [];
        const variantIndex = variants.findIndex((v) => v.sku === variantSku);
        if (variantIndex === -1) {
            throw new functions.https.HttpsError('not-found', 'Variante non trouvée');
        }
        const currentStock = variants[variantIndex].stock || 0;
        const newStock = currentStock + quantityDelta;
        if (newStock < 0) {
            throw new functions.https.HttpsError('failed-precondition', `Stock insuffisant. Disponible: ${currentStock}`);
        }
        variants[variantIndex].stock = newStock;
        variants[variantIndex].updatedAt = admin.firestore.Timestamp.now();
        transaction.update(productRef, {
            variants,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, newStock };
    });
}
/**
 * Atomic wallet balance update with transaction
 */
async function updateWalletTransaction(userId, amount, type, description, metadata) {
    const walletRef = db.collection('wallets').doc(userId);
    const transactionsRef = db.collection('transactions');
    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        let wallet;
        if (!walletDoc.exists) {
            // Create wallet if doesn't exist
            wallet = {
                userId,
                balance: 0,
                currency: 'GNF',
                createdAt: admin.firestore.Timestamp.now()
            };
        }
        else {
            wallet = walletDoc.data();
        }
        const currentBalance = wallet.balance || 0;
        const delta = type === 'credit' ? amount : -amount;
        const newBalance = currentBalance + delta;
        if (newBalance < 0) {
            throw new functions.https.HttpsError('failed-precondition', `Solde insuffisant. Disponible: ${currentBalance} GNF`);
        }
        // Create transaction record
        const txRef = transactionsRef.doc();
        const txData = {
            id: txRef.id,
            userId,
            type,
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description,
            metadata: metadata || {},
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // Update wallet
        if (walletDoc.exists) {
            transaction.update(walletRef, {
                balance: newBalance,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            transaction.set(walletRef, {
                ...wallet,
                balance: newBalance,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        transaction.set(txRef, txData);
        return { success: true, newBalance, transactionId: txRef.id };
    });
}
/**
 * Batch write utility for bulk operations
 */
async function batchWrite(operations) {
    const batch = db.batch();
    for (const op of operations) {
        switch (op.type) {
            case 'set':
                batch.set(op.ref, op.data);
                break;
            case 'update':
                batch.update(op.ref, op.data);
                break;
            case 'delete':
                batch.delete(op.ref);
                break;
        }
    }
    await batch.commit();
}
/**
 * Generate unique order ID
 */
function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GGO-${timestamp}${random}`;
}
/**
 * Generate unique delivery mission ID
 */
function generateMissionId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MIS-${timestamp}${random}`;
}
//# sourceMappingURL=firestore.js.map