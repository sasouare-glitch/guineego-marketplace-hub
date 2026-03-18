/**
 * Hook for seller dashboard real-time data from Firestore
 */
import { useState, useEffect, useMemo } from 'react';
import {
  collection, query, where, orderBy, limit,
  Timestamp, getDocs
} from 'firebase/firestore';
import { safeOnSnapshot } from '@/lib/firebase/safeSnapshot';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  conversionRate: number;
  uniqueVisitors: number;
  newCustomers: number;
}

export interface DashboardOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  items: number;
  createdAt: Timestamp | null;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
}

export interface SalesDataPoint {
  date: string;
  ventes: number;
  commandes: number;
}

export function useSellerDashboard() {
  const { user, claims } = useAuth();
  const sellerScopeId = useMemo(
    () => claims?.ecomId || user?.uid || null,
    [claims?.ecomId, user?.uid]
  );

  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listen to seller's recent orders
  useEffect(() => {
    if (!sellerScopeId) { setOrders([]); setLoading(false); return; }

    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerScopeId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = safeOnSnapshot(q,
      (snap: any) => {
        const docs = snap.docs.map((d: any) => {
          const data = d.data();
          const itemsArr = data.items || data.orderItems || [];
          const itemCount = itemsArr.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
          return {
            id: d.id,
            customer: data.customerName || data.customer?.name || 'Client',
            amount: data.totalAmount || data.total || 0,
            status: data.status || 'pending',
            items: itemCount,
            createdAt: data.createdAt || null,
          } as DashboardOrder;
        });
        setOrders(docs);
        setLoading(false);
      },
      (err) => { console.error('Dashboard orders error:', err); setLoading(false); },
      'sellerDashboardOrders'
    );

    return () => unsub();
  }, [sellerScopeId]);

  // Listen to seller's products for low stock
  useEffect(() => {
    if (!sellerScopeId) { setLowStockProducts([]); return; }

    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerScopeId),
      orderBy('totalStock', 'asc'),
      limit(10)
    );

    const unsub = safeOnSnapshot(q,
      (snap: any) => {
        const low = snap.docs
          .map((d: any) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || 'Produit',
              stock: data.totalStock ?? 0,
              minStock: data.minStock ?? 5,
            };
          })
          .filter((p: any) => p.stock < p.minStock);
        setLowStockProducts(low);
      },
      (err) => console.error('Low stock error:', err),
      'sellerDashboardLowStock'
    );

    return () => unsub();
  }, [sellerScopeId]);

  // Listen to seller visits (last 30 days)
  useEffect(() => {
    if (!sellerScopeId) { setTotalVisitors(0); return; }

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const startKey = `${sellerScopeId}_${thirtyDaysAgo.toISOString().slice(0, 10)}`;
    const endKey = `${sellerScopeId}_${today.toISOString().slice(0, 10)}\uf8ff`;

    const q = query(
      collection(db, 'seller_visits'),
      where('sellerId', '==', sellerScopeId),
    );

    const unsub = onSnapshot(q,
      (snap) => {
        let total = 0;
        snap.docs.forEach(d => {
          const data = d.data();
          // Only count last 30 days
          if (data.date >= thirtyDaysAgo.toISOString().slice(0, 10)) {
            total += data.views || 0;
          }
        });
        setTotalVisitors(total);
      },
      (err) => console.warn('Visits tracking error:', err)
    );

    return () => { try { unsub(); } catch {} };
  }, [sellerScopeId]);

  // Compute stats from orders + real visitors
  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const thisMonth = orders.filter(o => {
      if (!o.createdAt) return false;
      const d = o.createdAt.toDate();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalRevenue = thisMonth.reduce((s, o) => s + o.amount, 0);
    const totalOrders = thisMonth.length;
    const visitors = totalVisitors || totalOrders * 10; // fallback to estimate if no tracking data yet
    const conversionRate = visitors > 0 ? (totalOrders / visitors) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      activeProducts: 0,
      conversionRate: Math.min(conversionRate, 100),
      uniqueVisitors: visitors,
      newCustomers: Math.ceil(totalOrders * 0.4),
    };
  }, [orders, totalVisitors]);

  // Sales chart data (group orders by day for last 7 days)
  const salesChartData = useMemo<SalesDataPoint[]>(() => {
    const days: Record<string, SalesDataPoint> = {};
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Init last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: dayNames[d.getDay()], ventes: 0, commandes: 0 };
    }

    orders.forEach(o => {
      if (!o.createdAt) return;
      const key = o.createdAt.toDate().toISOString().slice(0, 10);
      if (days[key]) {
        days[key].ventes += o.amount;
        days[key].commandes += 1;
      }
    });

    return Object.values(days);
  }, [orders]);

  return { stats, orders, lowStockProducts, salesChartData, loading };
}
