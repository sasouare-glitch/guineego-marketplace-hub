/**
 * Firestore Query Utilities
 * React Query integration with Firestore for real-time data
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  getDoc,
  onSnapshot,
  type Query,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type QuerySnapshot,
  type DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export interface FirestoreDoc {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Fetch a single document
 */
export async function fetchDocument<T extends FirestoreDoc>(
  collectionPath: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return { id: docSnap.id, ...docSnap.data() } as T;
}

/**
 * Fetch documents with query constraints
 */
export async function fetchDocuments<T extends FirestoreDoc>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionPath), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as T));
}

/**
 * Fetch paginated documents
 */
export async function fetchPaginatedDocuments<T extends FirestoreDoc>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<PaginatedResult<T>> {
  let q = query(collection(db, collectionPath), ...constraints, limit(pageSize + 1));
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.slice(0, pageSize);
  
  return {
    data: docs.map(doc => ({ id: doc.id, ...doc.data() } as T)),
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore: snapshot.docs.length > pageSize
  };
}

// ============================================
// REACT QUERY HOOKS
// ============================================

/**
 * Hook for fetching a single document with React Query
 */
export function useFirestoreDoc<T extends FirestoreDoc>(
  collectionPath: string,
  docId: string | null | undefined,
  options?: Omit<UseQueryOptions<T | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['firestore', collectionPath, docId],
    queryFn: () => fetchDocument<T>(collectionPath, docId!),
    enabled: !!docId,
    ...options
  });
}

/**
 * Hook for fetching documents with React Query
 */
export function useFirestoreQuery<T extends FirestoreDoc>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  options?: Omit<UseQueryOptions<T[]>, 'queryKey' | 'queryFn'>
) {
  // Create a stable key from constraints
  const constraintKey = JSON.stringify(constraints.map(c => c.toString()));
  
  return useQuery({
    queryKey: ['firestore', collectionPath, constraintKey],
    queryFn: () => fetchDocuments<T>(collectionPath, constraints),
    ...options
  });
}

/**
 * Hook for infinite scroll pagination
 */
export function useFirestoreInfinite<T extends FirestoreDoc>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 20
) {
  const constraintKey = JSON.stringify(constraints.map(c => c.toString()));
  
  return useInfiniteQuery({
    queryKey: ['firestore-infinite', collectionPath, constraintKey],
    queryFn: ({ pageParam }) => 
      fetchPaginatedDocuments<T>(collectionPath, constraints, pageSize, pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined
  });
}

// ============================================
// REALTIME HOOKS
// ============================================

/**
 * Hook for real-time document subscription
 */
export function useRealtimeDoc<T extends FirestoreDoc>(
  collectionPath: string,
  docId: string | null | undefined
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, collectionPath, docId);
    
    // First try direct document lookup
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
          setLoading(false);
          setError(null);
        } else {
          // Fallback: query by 'id' field for legacy/mismatched IDs
          const q = query(collection(db, collectionPath), where('id', '==', docId), limit(1));
          onSnapshot(q, (querySnap) => {
            if (!querySnap.empty) {
              const docSnap = querySnap.docs[0];
              setData({ id: docSnap.id, ...docSnap.data() } as T);
            } else {
              setData(null);
            }
            setLoading(false);
            setError(null);
          }, (err) => {
            console.error('Realtime doc fallback query error:', err);
            setError(err);
            setLoading(false);
          });
        }
      },
      (err) => {
        console.error('Realtime doc error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionPath, docId]);

  return { data, loading, error };
}

/**
 * Hook for real-time collection subscription
 */
export function useRealtimeCollection<T extends FirestoreDoc>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionPath), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Realtime collection error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionPath, JSON.stringify(constraints.map(c => c.toString()))]);

  return { data, loading, error };
}

/**
 * Hook for subscribing to document changes with callback
 */
export function useDocumentListener<T extends FirestoreDoc>(
  collectionPath: string,
  docId: string | null | undefined,
  onUpdate: (data: T | null) => void
) {
  useEffect(() => {
    if (!docId) return;

    const docRef = doc(db, collectionPath, docId);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        onUpdate(null);
      }
    });

    return () => unsubscribe();
  }, [collectionPath, docId, onUpdate]);
}
