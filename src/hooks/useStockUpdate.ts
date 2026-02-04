/**
 * useStockUpdate Hook
 * Atomic stock updates with transaction support
 */

import { useState, useCallback } from 'react';
import { doc, runTransaction, serverTimestamp, type Transaction } from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface StockUpdateParams {
  productId: string;
  variantSku: string;
  quantity: number;
  operation: 'set' | 'increment' | 'decrement';
  reason?: string;
}

interface StockUpdateResult {
  success: boolean;
  newStock: number;
  previousStock: number;
}

interface BulkStockUpdateParams {
  items: Array<{
    productId: string;
    variantSku: string;
    quantity: number;
  }>;
  operation: 'increment' | 'decrement';
  reason?: string;
}

// ============================================
// LOCAL TRANSACTION
// ============================================

/**
 * Update stock using Firestore transaction (local)
 * Used for simple stock adjustments
 */
async function updateStockLocal(params: StockUpdateParams): Promise<StockUpdateResult> {
  const { productId, variantSku, quantity, operation } = params;
  const productRef = doc(db, 'products', productId);

  return runTransaction(db, async (transaction: Transaction) => {
    const productDoc = await transaction.get(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Produit non trouvé');
    }

    const product = productDoc.data();
    const variants = [...(product.variants || [])];
    const variantIndex = variants.findIndex(v => v.sku === variantSku);

    if (variantIndex === -1) {
      throw new Error('Variante non trouvée');
    }

    const currentStock = variants[variantIndex].stock || 0;
    let newStock: number;

    switch (operation) {
      case 'set':
        newStock = quantity;
        break;
      case 'increment':
        newStock = currentStock + quantity;
        break;
      case 'decrement':
        newStock = currentStock - quantity;
        break;
      default:
        throw new Error('Opération invalide');
    }

    if (newStock < 0) {
      throw new Error(`Stock insuffisant. Disponible: ${currentStock}`);
    }

    variants[variantIndex].stock = newStock;
    variants[variantIndex].updatedAt = new Date();

    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    transaction.update(productRef, {
      variants,
      totalStock,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      newStock,
      previousStock: currentStock
    };
  });
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook for updating stock with optimistic updates
 */
export function useStockUpdate() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateStockLocal,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['firestore', 'products', variables.productId] 
      });

      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(
        ['firestore', 'products', variables.productId]
      );

      return { previousProduct };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(
          ['firestore', 'products', variables.productId],
          context.previousProduct
        );
      }
      toast.error(`Erreur: ${err.message}`);
    },
    onSuccess: (data, variables) => {
      toast.success(`Stock mis à jour: ${data.newStock} unités`);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['firestore', 'products', variables.productId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['firestore', 'products'] 
      });
    }
  });

  return {
    updateStock: mutation.mutate,
    updateStockAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error
  };
}

/**
 * Hook for single product stock management
 */
export function useProductStock(productId: string) {
  const { updateStock, updateStockAsync, isUpdating, error } = useStockUpdate();

  const incrementStock = useCallback((variantSku: string, quantity: number, reason?: string) => {
    return updateStockAsync({
      productId,
      variantSku,
      quantity,
      operation: 'increment',
      reason
    });
  }, [productId, updateStockAsync]);

  const decrementStock = useCallback((variantSku: string, quantity: number, reason?: string) => {
    return updateStockAsync({
      productId,
      variantSku,
      quantity,
      operation: 'decrement',
      reason
    });
  }, [productId, updateStockAsync]);

  const setStock = useCallback((variantSku: string, quantity: number, reason?: string) => {
    return updateStockAsync({
      productId,
      variantSku,
      quantity,
      operation: 'set',
      reason
    });
  }, [productId, updateStockAsync]);

  return {
    incrementStock,
    decrementStock,
    setStock,
    isUpdating,
    error
  };
}

/**
 * Hook for bulk stock updates via Cloud Function
 * Used for order processing to ensure atomicity
 */
export function useBulkStockUpdate() {
  const queryClient = useQueryClient();
  
  const updateStockFn = callFunction<BulkStockUpdateParams, { success: boolean }>('updateStock');

  const mutation = useMutation({
    mutationFn: async (params: BulkStockUpdateParams) => {
      const result = await updateStockFn(params);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: ['firestore', 'products'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur stock: ${error.message}`);
    }
  });

  return {
    updateBulkStock: mutation.mutate,
    updateBulkStockAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error
  };
}

/**
 * Hook for low stock alerts
 */
export function useLowStockProducts(sellerId: string | null | undefined, threshold: number = 5) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // This would use a realtime listener in production
  // For now, returns mock data
  
  return {
    products,
    loading,
    threshold,
    count: products.length
  };
}
