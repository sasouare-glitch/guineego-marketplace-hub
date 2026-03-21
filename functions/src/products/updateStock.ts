/**
 * PRODUCTS FUNCTION: Update Stock
 * Atomic stock update using Firestore transactions
 * CRITICAL: Prevents overselling
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifySeller } from '../utils/auth';
import { updateStockTransaction } from '../utils/firestore';

const db = admin.firestore();

interface UpdateStockData {
  productId: string;
  variantSku: string;
  quantity: number;
  operation: 'set' | 'increment' | 'decrement';
  reason?: string;
}

interface BulkStockUpdate {
  items: Array<{
    productId: string;
    variantSku: string;
    quantity: number;
  }>;
  operation: 'decrement'; // For order processing
  orderId?: string;
}

/**
 * Update single product stock (seller)
 * httpsCallable: updateStock
 */
export const updateStock = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateStockData, context) => {
    const claims = verifySeller(context);
    const { productId, variantSku, quantity, operation, reason } = data;

    if (!productId || !variantSku || quantity === undefined) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'productId, variantSku et quantity sont requis'
      );
    }

    try {
      // Verify seller owns this product
      const productDoc = await db.collection('products').doc(productId).get();
      if (!productDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Produit non trouvé');
      }

      if (productDoc.data()?.sellerId !== claims.ecommerceId && claims.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous ne pouvez pas modifier ce produit'
        );
      }

      // Calculate delta
      let delta: number;
      switch (operation) {
        case 'set':
          const currentVariant = productDoc.data()?.variants?.find(
            (v: any) => v.sku === variantSku
          );
          const currentStock = currentVariant?.stock || 0;
          delta = quantity - currentStock;
          break;
        case 'increment':
          delta = quantity;
          break;
        case 'decrement':
          delta = -quantity;
          break;
        default:
          throw new functions.https.HttpsError('invalid-argument', 'Opération invalide');
      }

      // Execute transaction
      const result = await updateStockTransaction(productId, variantSku, delta);

      // Log stock change
      await db.collection('stock_logs').add({
        productId,
        variantSku,
        previousStock: result.newStock - delta,
        newStock: result.newStock,
        delta,
        operation,
        reason: reason || null,
        performedBy: context.auth!.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        newStock: result.newStock,
        message: `Stock mis à jour: ${result.newStock}`
      };

    } catch (error: any) {
      console.error('Error updating stock:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour du stock'
      );
    }
  });

/**
 * Bulk stock update for order processing (internal use)
 * Uses batch transactions to ensure atomicity
 */
export async function bulkDecrementStock(data: BulkStockUpdate): Promise<void> {
  const { items, orderId } = data;

  // Use Firestore transaction for atomicity
  await db.runTransaction(async (transaction) => {
    // First, read all products
    const productReads = await Promise.all(
      items.map(item => 
        transaction.get(db.collection('products').doc(item.productId))
      )
    );

    // Verify stock availability
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productDoc = productReads[i];
      
      if (!productDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          `Produit ${item.productId} non trouvé`
        );
      }

      const variants = productDoc.data()?.variants || [];
      const variant = variants.find((v: any) => v.sku === item.variantSku);
      
      if (!variant) {
        throw new functions.https.HttpsError(
          'not-found',
          `Variante ${item.variantSku} non trouvée`
        );
      }

      if (variant.stock < item.quantity) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Stock insuffisant pour ${productDoc.data()?.name}. Disponible: ${variant.stock}`
        );
      }
    }

    // All checks passed, update stocks
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productDoc = productReads[i];
      const variants = [...productDoc.data()!.variants];
      const variantIndex = variants.findIndex((v: any) => v.sku === item.variantSku);
      
      variants[variantIndex].stock -= item.quantity;
      variants[variantIndex].updatedAt = admin.firestore.Timestamp.now();

      const newTotalStock = variants.reduce((sum: number, v: any) => sum + v.stock, 0);

      transaction.update(db.collection('products').doc(item.productId), {
        variants,
        totalStock: newTotalStock,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log stock change
      const logRef = db.collection('stock_logs').doc();
      transaction.set(logRef, {
        productId: item.productId,
        variantSku: item.variantSku,
        previousStock: variants[variantIndex].stock + item.quantity,
        newStock: variants[variantIndex].stock,
        delta: -item.quantity,
        operation: 'order',
        orderId: orderId || null,
        createdAt: admin.firestore.Timestamp.now()
      });
    }
  });
}

/**
 * Restore stock after order cancellation
 */
export async function restoreStock(data: BulkStockUpdate): Promise<void> {
  for (const item of data.items) {
    await updateStockTransaction(item.productId, item.variantSku, item.quantity);
    
    // Log restoration
    await db.collection('stock_logs').add({
      productId: item.productId,
      variantSku: item.variantSku,
      delta: item.quantity,
      operation: 'restore',
      orderId: data.orderId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}
