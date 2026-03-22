/**
 * Firestore Utilities - Transactions, Pagination, Queries
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

// ============================================
// PAGINATION UTILITIES
// ============================================

export interface PaginationParams {
  limit?: number;
  startAfter?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: string | null;
  hasMore: boolean;
}

/**
 * Execute paginated query
 */
export async function paginatedQuery<T>(
  collectionPath: string,
  params: PaginationParams,
  additionalFilters?: (query: admin.firestore.Query) => admin.firestore.Query
): Promise<PaginatedResult<T>> {
  const { limit = 20, startAfter, orderBy = 'createdAt', orderDirection = 'desc' } = params;
  
  let query: admin.firestore.Query = db.collection(collectionPath)
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
    data: docs.map(doc => ({ id: doc.id, ...doc.data() } as T)),
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
export async function updateStockTransaction(
  productId: string,
  variantSku: string,
  quantityDelta: number
): Promise<{ success: boolean; newStock: number }> {
  const productRef = db.collection('products').doc(productId);
  
  return db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Produit non trouvé');
    }
    
    const product = productDoc.data()!;
    const variants = product.variants || [];
    const variantIndex = variants.findIndex((v: any) => v.sku.toUpperCase() === variantSku.toUpperCase());
    
    if (variantIndex === -1) {
      throw new functions.https.HttpsError('not-found', 'Variante non trouvée');
    }
    
    const currentStock = variants[variantIndex].stock || 0;
    const newStock = currentStock + quantityDelta;
    
    if (newStock < 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Stock insuffisant. Disponible: ${currentStock}`
      );
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
export async function updateWalletTransaction(
  userId: string,
  amount: number,
  type: 'credit' | 'debit',
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  const walletRef = db.collection('wallets').doc(userId);
  const transactionsRef = db.collection('transactions');
  
  return db.runTransaction(async (transaction) => {
    const walletDoc = await transaction.get(walletRef);
    
    let wallet: any;
    if (!walletDoc.exists) {
      // Create wallet if doesn't exist
      wallet = {
        userId,
        balance: 0,
        currency: 'GNF',
        createdAt: admin.firestore.Timestamp.now()
      };
    } else {
      wallet = walletDoc.data()!;
    }
    
    const currentBalance = wallet.balance || 0;
    const delta = type === 'credit' ? amount : -amount;
    const newBalance = currentBalance + delta;
    
    if (newBalance < 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Solde insuffisant. Disponible: ${currentBalance} GNF`
      );
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
    } else {
      transaction.set(walletRef, {
        ...wallet,
        balance: newBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    transaction.set(txRef, txData);
    
    return { success: true, newBalance, transactionId: txRef.id };
  }).then(async (result) => {
    // Send push notification for wallet credits (outside transaction)
    if (type === 'credit') {
      try {
        const { sendNotification } = await import('./notifications');
        await sendNotification({
          userId,
          type: 'wallet_credited',
          title: '💰 Wallet crédité',
          body: `+${amount.toLocaleString()} GNF — ${description}. Nouveau solde: ${result.newBalance.toLocaleString()} GNF`,
          data: {
            amount: amount.toString(),
            newBalance: result.newBalance.toString(),
            transactionId: result.transactionId,
            ...(metadata?.orderId ? { orderId: metadata.orderId } : {}),
            ...(metadata?.missionId ? { missionId: metadata.missionId } : {}),
          }
        });
      } catch (notifError) {
        console.error('Wallet credit notification error:', notifError);
      }
    }
    return result;
  });
}

/**
 * Batch write utility for bulk operations
 */
export async function batchWrite(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: admin.firestore.DocumentReference;
    data?: any;
  }>
): Promise<void> {
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
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GGO-${timestamp}${random}`;
}

/**
 * Generate unique delivery mission ID
 */
export function generateMissionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MIS-${timestamp}${random}`;
}
