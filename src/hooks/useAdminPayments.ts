/**
 * Hook: Real-time admin payment tracking across all sellers
 * Aggregates subscription_payments from all seller_settings docs
 * and order payments from the payments collection
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, collectionGroup, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { safeOnSnapshot } from '@/lib/firebase/safeSnapshot';

export interface PaymentRecord {
  id: string;
  sellerId?: string;
  sellerName?: string;
  customerId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed' | 'processing' | 'refunded';
  method: 'orange_money' | 'mtn_money' | 'card' | 'wallet' | 'cash' | string;
  phone?: string;
  planName?: string;
  type: 'subscription' | 'order';
  createdAt: Date;
  completedAt?: Date;
  cancelReason?: string;
  reference?: string;
  stripePaymentIntentId?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
}

export function useAdminPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to subscription_payments (collectionGroup)
    const subQuery = query(
      collectionGroup(db, 'subscription_payments'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    // Listen to order payments
    const orderPayQuery = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    let subPayments: PaymentRecord[] = [];
    let orderPayments: PaymentRecord[] = [];
    let subLoaded = false;
    let orderLoaded = false;

    const merge = () => {
      if (subLoaded && orderLoaded) {
        const all = [...subPayments, ...orderPayments].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        setPayments(all);
        setLoading(false);
      }
    };

    const unsubSub = onSnapshot(subQuery, (snap) => {
      subPayments = snap.docs.map(doc => {
        const d = doc.data();
        const parentPath = doc.ref.parent.parent?.id || '';
        const ts = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date();
        return {
          id: doc.id,
          sellerId: parentPath,
          amount: d.amount || 0,
          status: d.status || 'pending',
          method: d.paymentMethod || 'orange_money',
          phone: d.phone,
          planName: d.planName,
          type: 'subscription' as const,
          createdAt: ts,
          completedAt: d.completedAt instanceof Timestamp ? d.completedAt.toDate() : undefined,
          cancelReason: d.cancelReason,
          reference: `SUB-${doc.id.slice(0, 8).toUpperCase()}`,
        };
      });
      subLoaded = true;
      merge();
    }, (err) => {
      console.error('Error listening subscription_payments:', err);
      subLoaded = true;
      merge();
    });

    const unsubOrder = onSnapshot(orderPayQuery, (snap) => {
      orderPayments = snap.docs.map(doc => {
        const d = doc.data();
        const ts = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date();
        return {
          id: doc.id,
          customerId: d.customerId,
          amount: d.amount || 0,
          status: d.status || 'pending',
          method: d.method || d.paymentMethod || 'cash',
          phone: d.phone,
          type: 'order' as const,
          createdAt: ts,
          completedAt: d.completedAt instanceof Timestamp ? d.completedAt.toDate() : undefined,
          reference: `PAY-${doc.id.slice(0, 8).toUpperCase()}`,
          stripePaymentIntentId: d.stripePaymentIntentId,
          refundId: d.refundId,
          refundAmount: d.refundAmount,
          refundReason: d.refundReason,
        };
      });
      orderLoaded = true;
      merge();
    }, (err) => {
      console.error('Error listening payments:', err);
      orderLoaded = true;
      merge();
    });

    return () => {
      try { unsubSub(); } catch (_) {}
      try { unsubOrder(); } catch (_) {}
    };
  }, []);

  return { payments, loading };
}
