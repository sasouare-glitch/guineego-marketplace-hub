/**
 * Firestore Mutation Utilities
 * React Query mutations with optimistic updates
 */

import { 
  doc, 
  collection,
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  type DocumentReference
} from 'firebase/firestore';
import { db, callFunction } from './config';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { FirestoreDoc } from './queries';

// ============================================
// MUTATION HELPERS
// ============================================

/**
 * Add a new document to a collection
 */
export async function addDocument<T extends Record<string, any>>(
  collectionPath: string,
  data: T
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionPath), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Set a document (create or overwrite)
 */
export async function setDocument<T extends Record<string, any>>(
  collectionPath: string,
  docId: string,
  data: T,
  merge: boolean = true
): Promise<void> {
  const docRef = doc(db, collectionPath, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge });
}

/**
 * Update a document
 */
export async function updateDocument<T extends Record<string, any>>(
  collectionPath: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
}

// ============================================
// TRANSACTION HELPERS
// ============================================

/**
 * Atomic stock update transaction
 */
export async function updateStockAtomic(
  productId: string,
  variantSku: string,
  quantityDelta: number
): Promise<{ newStock: number }> {
  const productRef = doc(db, 'products', productId);
  
  return runTransaction(db, async (transaction) => {
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
    const newStock = currentStock + quantityDelta;
    
    if (newStock < 0) {
      throw new Error(`Stock insuffisant. Disponible: ${currentStock}`);
    }
    
    variants[variantIndex].stock = newStock;
    
    transaction.update(productRef, {
      variants,
      totalStock: variants.reduce((sum, v) => sum + (v.stock || 0), 0),
      updatedAt: serverTimestamp()
    });
    
    return { newStock };
  });
}

// ============================================
// REACT QUERY MUTATION HOOKS
// ============================================

/**
 * Generic mutation hook for adding documents
 */
export function useAddDocument<T extends Record<string, any>>(
  collectionPath: string,
  options?: UseMutationOptions<string, Error, T>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: T) => addDocument(collectionPath, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firestore', collectionPath] });
    },
    ...options
  });
}

/**
 * Generic mutation hook for updating documents
 */
export function useUpdateDocument<T extends Record<string, any>>(
  collectionPath: string,
  options?: UseMutationOptions<void, Error, { docId: string; data: Partial<T> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ docId, data }) => updateDocument(collectionPath, docId, data),
    onSuccess: (_, { docId }) => {
      queryClient.invalidateQueries({ queryKey: ['firestore', collectionPath] });
      queryClient.invalidateQueries({ queryKey: ['firestore', collectionPath, docId] });
    },
    ...options
  });
}

/**
 * Generic mutation hook for deleting documents
 */
export function useDeleteDocument(
  collectionPath: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (docId: string) => deleteDocument(collectionPath, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firestore', collectionPath] });
    },
    ...options
  });
}

/**
 * Optimistic update mutation hook
 */
export function useOptimisticUpdate<T extends FirestoreDoc>(
  collectionPath: string,
  docId: string
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<T>) => updateDocument(collectionPath, docId, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['firestore', collectionPath, docId] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<T>(['firestore', collectionPath, docId]);
      
      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<T>(
          ['firestore', collectionPath, docId],
          { ...previousData, ...newData }
        );
      }
      
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['firestore', collectionPath, docId],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['firestore', collectionPath, docId] });
    }
  });
}

// ============================================
// CLOUD FUNCTION MUTATIONS
// ============================================

/**
 * Hook for calling Cloud Functions
 */
export function useCloudFunction<TData = unknown, TResult = unknown>(
  functionName: string,
  options?: UseMutationOptions<TResult, Error, TData>
) {
  const fn = callFunction<TData, { data: TResult }>(functionName);
  
  return useMutation({
    mutationFn: async (data: TData) => {
      const result = await fn(data);
      return result.data as TResult;
    },
    ...options
  });
}
