/**
 * useAdminFinances – Aggregates real Firestore data for the admin finances dashboard.
 *
 * Sources:
 *  - orders        → commissions (5% of total, excl. cancelled)
 *  - deliveries    → delivery margin revenue
 *  - seller_settings → subscription revenue (from subscription.planId)
 *  - products      → sponsoring revenue (isSponsored products × plan price)
 *  - transit       → transit/freight fees
 *  - academy       → course purchase revenue
 *  - payments      → raw transaction feed (for the table)
 */

import { useState, useEffect, useMemo } from 'react';
import {
  collection, query, where, onSnapshot, orderBy, limit, Timestamp,
  doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SELLER_PLANS, type SellerPlanId } from '@/constants/sellerPlans';
import { SPONSOR_PLANS, type SponsorDuration } from '@/constants/sponsorPlans';

// ── Types ──────────────────────────────────────────────

export interface SourceTotals {
  commissions: number;
  livraisons: number;
  abonnements: number;
  sponsoring: number;
  transit: number;
  academy: number;
}

export interface MonthlyRow extends SourceTotals {
  month: string; // e.g. "Jan"
}

export interface FinanceTransaction {
  id: string;
  type: string;
  label: string;
  amount: number;
  status: string;
  date: string; // ISO
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
}
function monthLabel(d: Date) {
  return MONTH_LABELS[d.getMonth()];
}

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return null;
}

// ── Commission rate helper ──
async function getCommissionRate(categoryId: string): Promise<number> {
  try {
    const snap = await getDoc(doc(db, 'config', 'commissions'));
    if (snap.exists()) {
      const data = snap.data();
      return data.categoryRates?.[categoryId] ?? data.defaultRate ?? 5;
    }
  } catch { /* ignore */ }
  return 5;
}

// ── Hook ───────────────────────────────────────────────

export function useAdminFinances() {
  const [loading, setLoading] = useState(true);
  // Raw collected values
  const [orderRevenue, setOrderRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [deliveryRevenue, setDeliveryRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [subscriptionRevenue, setSubscriptionRevenue] = useState<number>(0);
  const [sponsorRevenue, setSponsorRevenue] = useState<number>(0);
  const [transitRevenue, setTransitRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [academyRevenue, setAcademyRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [commissionRateCache, setCommissionRateCache] = useState<number>(5);

  // Fetch default commission rate once
  useEffect(() => {
    getCommissionRate('__default').then(setCommissionRateCache).catch(() => {});
  }, []);

  // ── 1. Orders → commissions ──
  useEffect(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo)),
    );

    const unsub = onSnapshot(q, (snap) => {
      const buckets: Record<string, number> = {};
      const txns: FinanceTransaction[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.status === 'cancelled') return;
        const date = tsToDate(data.createdAt);
        if (!date) return;

        const total = data.total || data.totalAmount || 0;
        const commission = total * (commissionRateCache / 100);
        const mk = monthKey(date);
        buckets[mk] = (buckets[mk] || 0) + commission;

        txns.push({
          id: d.id,
          type: 'commission',
          label: `Commission commande #${d.id.slice(0, 8)}`,
          amount: commission,
          status: data.paymentStatus || 'completed',
          date: date.toISOString(),
        });
      });

      setOrderRevenue(Object.entries(buckets).map(([m, a]) => ({ month: m, amount: a })));
      setTransactions((prev) => {
        const others = prev.filter((t) => t.type !== 'commission');
        return [...others, ...txns];
      });
    }, (err) => console.error('orders finance listener:', err));

    return () => { try { unsub(); } catch {} };
  }, [commissionRateCache]);

  // ── 2. Deliveries → delivery margins ──
  useEffect(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const q = query(
      collection(db, 'deliveries'),
      where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo)),
    );

    const unsub = onSnapshot(q, (snap) => {
      const buckets: Record<string, number> = {};
      const txns: FinanceTransaction[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const date = tsToDate(data.createdAt);
        if (!date) return;

        const fee = data.deliveryFee || data.fee || data.price || 0;
        const margin = fee * 0.3; // 30% platform margin on delivery
        const mk = monthKey(date);
        buckets[mk] = (buckets[mk] || 0) + margin;

        if (margin > 0) {
          txns.push({
            id: d.id,
            type: 'livraison',
            label: `Marge livraison ${d.id.slice(0, 8)}`,
            amount: margin,
            status: data.status === 'delivered' ? 'completed' : 'pending',
            date: date.toISOString(),
          });
        }
      });

      setDeliveryRevenue(Object.entries(buckets).map(([m, a]) => ({ month: m, amount: a })));
      setTransactions((prev) => {
        const others = prev.filter((t) => t.type !== 'livraison');
        return [...others, ...txns];
      });
    }, (err) => console.error('deliveries finance listener:', err));

    return () => { try { unsub(); } catch {} };
  }, []);

  // ── 3. Seller settings → subscriptions ──
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'seller_settings'),
      (snap) => {
        let total = 0;
        const txns: FinanceTransaction[] = [];

        snap.docs.forEach((d) => {
          const data = d.data();
          const planId = data.subscription?.planId as SellerPlanId | undefined;
          if (!planId || planId === 'free') return;

          const plan = SELLER_PLANS.find((p) => p.id === planId);
          if (!plan) return;
          total += plan.price;

          txns.push({
            id: `sub-${d.id}`,
            type: 'abonnement',
            label: `Abo ${plan.name} – ${d.id.slice(0, 8)}`,
            amount: plan.price,
            status: 'completed',
            date: tsToDate(data.subscription?.subscribedAt)?.toISOString() || new Date().toISOString(),
          });
        });

        setSubscriptionRevenue(total);
        setTransactions((prev) => {
          const others = prev.filter((t) => t.type !== 'abonnement');
          return [...others, ...txns];
        });
      },
      (err) => console.error('seller_settings finance listener:', err),
    );

    return () => { try { unsub(); } catch {} };
  }, []);

  // ── 4. Products → sponsoring ──
  useEffect(() => {
    const q = query(collection(db, 'products'), where('isSponsored', '==', true));

    const unsub = onSnapshot(q, (snap) => {
      let total = 0;
      const txns: FinanceTransaction[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const planId = data.sponsorPlan as SponsorDuration | undefined;
        const plan = SPONSOR_PLANS.find((p) => p.id === planId);
        const price = plan?.price || 50_000;
        total += price;

        txns.push({
          id: `spo-${d.id}`,
          type: 'sponsoring',
          label: `Sponsoring "${(data.name || '').slice(0, 30)}"`,
          amount: price,
          status: 'completed',
          date: tsToDate(data.sponsoredAt)?.toISOString() || new Date().toISOString(),
        });
      });

      setSponsorRevenue(total);
      setTransactions((prev) => {
        const others = prev.filter((t) => t.type !== 'sponsoring');
        return [...others, ...txns];
      });
    }, (err) => console.error('products sponsor listener:', err));

    return () => { try { unsub(); } catch {} };
  }, []);

  // ── 5. Transit → freight fees ──
  useEffect(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const q = query(
      collection(db, 'transit'),
      where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo)),
    );

    const unsub = onSnapshot(q, (snap) => {
      const buckets: Record<string, number> = {};
      const txns: FinanceTransaction[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const date = tsToDate(data.createdAt);
        if (!date) return;

        const fee = data.totalCost || data.quote?.totalCost || data.amount || 0;
        const mk = monthKey(date);
        buckets[mk] = (buckets[mk] || 0) + fee;

        if (fee > 0) {
          txns.push({
            id: d.id,
            type: 'transit',
            label: `Fret ${d.id.slice(0, 8)}`,
            amount: fee,
            status: data.status === 'delivered' ? 'completed' : 'pending',
            date: date.toISOString(),
          });
        }
      });

      setTransitRevenue(Object.entries(buckets).map(([m, a]) => ({ month: m, amount: a })));
      setTransactions((prev) => {
        const others = prev.filter((t) => t.type !== 'transit');
        return [...others, ...txns];
      });
    }, (err) => console.error('transit finance listener:', err));

    return () => { try { unsub(); } catch {} };
  }, []);

  // ── 6. Academy → course purchases ──
  useEffect(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const q = query(
      collection(db, 'academy'),
      where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo)),
    );

    const unsub = onSnapshot(q, (snap) => {
      const buckets: Record<string, number> = {};
      const txns: FinanceTransaction[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const date = tsToDate(data.createdAt || data.purchasedAt);
        if (!date) return;

        const price = data.price || data.amount || 0;
        const mk = monthKey(date);
        buckets[mk] = (buckets[mk] || 0) + price;

        if (price > 0) {
          txns.push({
            id: d.id,
            type: 'academy',
            label: `Formation "${(data.title || data.courseName || '').slice(0, 30)}"`,
            amount: price,
            status: 'completed',
            date: date.toISOString(),
          });
        }
      });

      setAcademyRevenue(Object.entries(buckets).map(([m, a]) => ({ month: m, amount: a })));
      setTransactions((prev) => {
        const others = prev.filter((t) => t.type !== 'academy');
        return [...others, ...txns];
      });
    }, (err) => console.error('academy finance listener:', err));

    return () => { try { unsub(); } catch {} };
  }, []);

  // ── Mark loading done after a short settle ──
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Derived: monthly breakdown for charts ──
  const monthlyData = useMemo<MonthlyRow[]>(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: monthLabel(d) });
    }

    const toMap = (arr: { month: string; amount: number }[]) => {
      const m: Record<string, number> = {};
      arr.forEach((r) => { m[r.month] = (m[r.month] || 0) + r.amount; });
      return m;
    };

    const commMap = toMap(orderRevenue);
    const delMap = toMap(deliveryRevenue);
    const traMap = toMap(transitRevenue);
    const acaMap = toMap(academyRevenue);

    // Subscriptions & sponsoring are "current snapshot" values, spread evenly to current month
    const currentMk = monthKey(now);

    return months.map(({ key, label }) => ({
      month: label,
      commissions: Math.round(commMap[key] || 0),
      livraisons: Math.round(delMap[key] || 0),
      abonnements: key === currentMk ? subscriptionRevenue : 0,
      sponsoring: key === currentMk ? sponsorRevenue : 0,
      transit: Math.round(traMap[key] || 0),
      academy: Math.round(acaMap[key] || 0),
    }));
  }, [orderRevenue, deliveryRevenue, subscriptionRevenue, sponsorRevenue, transitRevenue, academyRevenue]);

  // Current & previous month totals
  const currentMonthTotals = useMemo<SourceTotals>(() => {
    const row = monthlyData[monthlyData.length - 1];
    return row || { commissions: 0, livraisons: 0, abonnements: 0, sponsoring: 0, transit: 0, academy: 0 };
  }, [monthlyData]);

  const prevMonthTotals = useMemo<SourceTotals>(() => {
    const row = monthlyData[monthlyData.length - 2];
    return row || { commissions: 0, livraisons: 0, abonnements: 0, sponsoring: 0, transit: 0, academy: 0 };
  }, [monthlyData]);

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  return {
    loading,
    monthlyData,
    currentMonthTotals,
    prevMonthTotals,
    transactions: sortedTransactions,
  };
}
