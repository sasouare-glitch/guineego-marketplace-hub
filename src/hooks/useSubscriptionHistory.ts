import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionPayment {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
}

export function useSubscriptionHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'seller_settings', user.uid, 'subscription_payments'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPayments(
          snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              planId: d.planId,
              planName: d.planName,
              amount: d.amount,
              paymentMethod: d.paymentMethod,
              status: d.status || 'completed',
              createdAt: d.createdAt?.toDate?.() || new Date(),
            };
          })
        );
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user?.uid]);

  return { payments, loading };
}
