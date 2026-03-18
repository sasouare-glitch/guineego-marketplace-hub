/**
 * Hook pour gérer la base clients d'un vendeur via Firestore
 * Collection: seller_customers/{sellerId}/customers/{customerId}
 * Agrégation automatique depuis les commandes
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// TYPES
// ============================================

export type CustomerSegment = 'VIP' | 'Fidèle' | 'Nouveau' | 'À risque';

export interface SellerCustomer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  segment: CustomerSegment;
  rating: number;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  total: number;
  vip: number;
  fidele: number;
  nouveau: number;
  aRisque: number;
  retentionRate: number;
  avgCustomerValue: number;
}

// ============================================
// SEGMENT LOGIC
// ============================================

function computeSegment(orders: number, lastOrderAt: Date | null): CustomerSegment {
  const now = new Date();
  const daysSinceLastOrder = lastOrderAt
    ? Math.floor((now.getTime() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceLastOrder > 60) return 'À risque';
  if (orders >= 10) return 'VIP';
  if (orders >= 3) return 'Fidèle';
  return 'Nouveau';
}

// ============================================
// HOOK
// ============================================

export function useSellerCustomers() {
  const { user, claims } = useAuth();
  const [customers, setCustomers] = useState<SellerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine sellerId
  const sellerId = claims?.ecomId || user?.uid || null;

  // Real-time listener on seller_customers collection
  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    const customersRef = collection(db, 'seller_customers', sellerId, 'customers');
    const q = query(customersRef, orderBy('updatedAt', 'desc'));

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data: SellerCustomer[] = snapshot.docs.map((d) => {
            const raw = d.data();
            const lastOrderAt = raw.lastOrderAt instanceof Timestamp ? raw.lastOrderAt.toDate() : null;
            const createdAt = raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date();
            const updatedAt = raw.updatedAt instanceof Timestamp ? raw.updatedAt.toDate() : new Date();

            return {
              id: d.id,
              customerId: raw.customerId || d.id,
              name: raw.name || '',
              email: raw.email || '',
              phone: raw.phone || '',
              city: raw.city || '',
              country: raw.country || 'Guinée',
              orders: raw.orders || 0,
              totalSpent: raw.totalSpent || 0,
              lastOrderAt,
              segment: computeSegment(raw.orders || 0, lastOrderAt),
              rating: raw.rating || 0,
              notes: raw.notes || '',
              tags: raw.tags || [],
              createdAt,
              updatedAt,
            };
          });
          setCustomers(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error listening to seller customers:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (e) {
      console.error('SellerCustomers: Failed to attach listener:', e);
      setLoading(false);
    }

    return () => { try { unsubscribe?.(); } catch (e) { /* ignore */ } };
  }, [sellerId]);

  // Computed stats
  const stats: CustomerStats = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter((c) => c.segment === 'VIP').length;
    const fidele = customers.filter((c) => c.segment === 'Fidèle').length;
    const nouveau = customers.filter((c) => c.segment === 'Nouveau').length;
    const aRisque = customers.filter((c) => c.segment === 'À risque').length;
    const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const returning = customers.filter((c) => c.orders > 1).length;

    return {
      total,
      vip,
      fidele,
      nouveau,
      aRisque,
      retentionRate: total > 0 ? Math.round((returning / total) * 100) : 0,
      avgCustomerValue: total > 0 ? Math.round(totalSpentAll / total) : 0,
    };
  }, [customers]);

  // Add or update a customer
  const upsertCustomer = useCallback(
    async (data: Partial<SellerCustomer> & { customerId: string }) => {
      if (!sellerId) throw new Error('No seller ID');
      const ref = doc(db, 'seller_customers', sellerId, 'customers', data.customerId);
      await setDoc(
        ref,
        {
          ...data,
          updatedAt: serverTimestamp(),
          ...(data.createdAt ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      );
    },
    [sellerId]
  );

  // Update customer notes/tags
  const updateCustomerMeta = useCallback(
    async (customerId: string, updates: { notes?: string; tags?: string[] }) => {
      if (!sellerId) throw new Error('No seller ID');
      const ref = doc(db, 'seller_customers', sellerId, 'customers', customerId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    [sellerId]
  );

  // Delete a customer
  const deleteCustomer = useCallback(
    async (customerId: string) => {
      if (!sellerId) throw new Error('No seller ID');
      await deleteDoc(doc(db, 'seller_customers', sellerId, 'customers', customerId));
    },
    [sellerId]
  );

  // Seed mock data for demo (called once if collection is empty)
  const seedDemoData = useCallback(async () => {
    if (!sellerId || customers.length > 0) return;

    const demoCustomers = [
      { customerId: 'c1', name: 'Mamadou Diallo', email: 'm.diallo@email.com', phone: '+224 622 11 22 33', city: 'Conakry', orders: 14, totalSpent: 2800000, lastOrderAt: new Date('2026-02-15'), rating: 4.9 },
      { customerId: 'c2', name: 'Fatoumata Bah', email: 'f.bah@email.com', phone: '+224 666 44 55 66', city: 'Kindia', orders: 8, totalSpent: 1200000, lastOrderAt: new Date('2026-02-12'), rating: 4.7 },
      { customerId: 'c3', name: 'Ibrahima Sow', email: 'i.sow@email.com', phone: '+224 628 77 88 99', city: 'Labé', orders: 3, totalSpent: 480000, lastOrderAt: new Date('2026-01-28'), rating: 4.5 },
      { customerId: 'c4', name: 'Aissatou Camara', email: 'a.camara@email.com', phone: '+224 664 12 34 56', city: 'Conakry', orders: 22, totalSpent: 5600000, lastOrderAt: new Date('2026-02-17'), rating: 5.0 },
      { customerId: 'c5', name: 'Oumar Konaté', email: 'o.konate@email.com', phone: '+224 621 98 76 54', city: 'Boké', orders: 6, totalSpent: 840000, lastOrderAt: new Date('2026-02-01'), rating: 4.3 },
      { customerId: 'c6', name: 'Mariama Traoré', email: 'm.traore@email.com', phone: '+224 655 23 45 67', city: 'Conakry', orders: 1, totalSpent: 95000, lastOrderAt: new Date('2026-02-10'), rating: 4.0 },
      { customerId: 'c7', name: 'Alpha Baldé', email: 'a.balde@email.com', phone: '+224 629 34 56 78', city: 'Mamou', orders: 11, totalSpent: 1950000, lastOrderAt: new Date('2026-02-14'), rating: 4.8 },
      { customerId: 'c8', name: 'Kadiatou Barry', email: 'k.barry@email.com', phone: '+224 660 87 65 43', city: 'Conakry', orders: 5, totalSpent: 720000, lastOrderAt: new Date('2026-01-22'), rating: 4.2 },
    ];

    const batch = writeBatch(db);
    for (const c of demoCustomers) {
      const ref = doc(db, 'seller_customers', sellerId, 'customers', c.customerId);
      batch.set(ref, {
        ...c,
        country: 'Guinée',
        notes: '',
        tags: [],
        segment: computeSegment(c.orders, c.lastOrderAt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }, [sellerId, customers.length]);

  return {
    customers,
    stats,
    loading,
    error,
    upsertCustomer,
    updateCustomerMeta,
    deleteCustomer,
    seedDemoData,
  };
}
