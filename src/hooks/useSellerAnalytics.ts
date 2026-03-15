/**
 * Hook for seller analytics data from Firestore
 */
import { useState, useEffect, useMemo } from 'react';
import {
  collection, query, where, orderBy, onSnapshot, limit, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface OrderDoc {
  id: string;
  totalAmount: number;
  total: number;
  status: string;
  items?: any[];
  orderItems?: any[];
  createdAt: Timestamp | null;
}

interface ProductDoc {
  id: string;
  name: string;
  category: string;
  totalStock: number;
  totalSales: number;
  avgRating: number;
  basePrice: number;
  price: number;
}

export interface AnalyticsData {
  // KPIs
  totalRevenue: number;
  totalOrders: number;
  estimatedVisitors: number;
  conversionRate: number;
  // Chart data grouped by day/week/month
  chartData: { name: string; ca: number; commandes: number }[];
  // Category breakdown
  categoryData: { name: string; value: number; color: string }[];
  // Top products
  topProducts: { name: string; ventes: number; ca: number; stock: number; note: number }[];
  // Funnel
  funnel: { label: string; value: number; pct: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Téléphonie': 'hsl(var(--primary))',
  'Mode': 'hsl(var(--accent))',
  'Maison': 'hsl(var(--chart-3, 47 100% 61%))',
  'Sport': 'hsl(var(--chart-4, 198 93% 60%))',
  'Électronique': 'hsl(var(--primary))',
  'Alimentation': 'hsl(var(--chart-3, 47 100% 61%))',
};

export function useSellerAnalytics(periodDays: number) {
  const { user, claims } = useAuth();
  const sellerScopeId = useMemo(
    () => claims?.ecomId || user?.uid || null,
    [claims?.ecomId, user?.uid]
  );

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to orders
  useEffect(() => {
    if (!sellerScopeId) { setOrders([]); setLoading(false); return; }

    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerScopeId),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    const unsub = onSnapshot(q,
      (snap) => {
        const docs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            totalAmount: data.totalAmount || data.total || data.pricing?.total || 0,
            total: data.total || 0,
            status: data.status || 'pending',
            items: data.items || data.orderItems || [],
            createdAt: data.createdAt || null,
          } as OrderDoc;
        });
        setOrders(docs);
        setLoading(false);
      },
      (err) => { console.error('Analytics orders error:', err); setLoading(false); }
    );

    return () => { try { unsub(); } catch {} };
  }, [sellerScopeId]);

  // Listen to products
  useEffect(() => {
    if (!sellerScopeId) { setProducts([]); return; }

    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerScopeId),
      orderBy('totalSales', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductDoc)));
      },
      (err) => console.error('Analytics products error:', err)
    );

    return () => { try { unsub(); } catch {} };
  }, [sellerScopeId]);

  const analytics = useMemo<AnalyticsData>(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - periodDays);

    // Filter orders in period
    const periodOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      return o.createdAt.toDate() >= cutoff;
    });

    const completedOrders = periodOrders.filter(o => o.status !== 'cancelled');
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.totalAmount || o.total), 0);
    const totalOrders = completedOrders.length;
    const estimatedVisitors = Math.max(totalOrders * 12, totalOrders);
    const conversionRate = estimatedVisitors > 0 ? (totalOrders / estimatedVisitors) * 100 : 0;

    // Group orders by time bucket
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const chartData: { name: string; ca: number; commandes: number }[] = [];

    if (periodDays <= 7) {
      // Daily buckets
      const buckets: Record<string, { ca: number; commandes: number }> = {};
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = { ca: 0, commandes: 0 };
      }
      completedOrders.forEach(o => {
        if (!o.createdAt) return;
        const key = o.createdAt.toDate().toISOString().slice(0, 10);
        if (buckets[key]) {
          buckets[key].ca += o.totalAmount || o.total;
          buckets[key].commandes += 1;
        }
      });
      Object.entries(buckets).forEach(([key, val]) => {
        const d = new Date(key);
        chartData.push({ name: dayNames[d.getDay()], ...val });
      });
    } else if (periodDays <= 30) {
      // Weekly buckets
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (4 - w) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekOrders = completedOrders.filter(o => {
          if (!o.createdAt) return false;
          const d = o.createdAt.toDate();
          return d >= weekStart && d < weekEnd;
        });
        chartData.push({
          name: `S${w + 1}`,
          ca: weekOrders.reduce((s, o) => s + (o.totalAmount || o.total), 0),
          commandes: weekOrders.length,
        });
      }
    } else {
      // Monthly buckets
      for (let m = 2; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const monthOrders = completedOrders.filter(o => {
          if (!o.createdAt) return false;
          const od = o.createdAt.toDate();
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        chartData.push({
          name: monthNames[d.getMonth()],
          ca: monthOrders.reduce((s, o) => s + (o.totalAmount || o.total), 0),
          commandes: monthOrders.length,
        });
      }
    }

    // Category breakdown from products
    const catMap: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Autres';
      catMap[cat] = (catMap[cat] || 0) + (p.totalSales || 0);
    });
    const totalSales = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    const categoryData = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, val]) => ({
        name,
        value: Math.round((val / totalSales) * 100),
        color: CATEGORY_COLORS[name] || 'hsl(var(--muted-foreground))',
      }));

    // Top products
    const topProducts = products.slice(0, 5).map(p => ({
      name: p.name,
      ventes: p.totalSales || 0,
      ca: (p.totalSales || 0) * (p.price || p.basePrice || 0),
      stock: p.totalStock || 0,
      note: p.avgRating || 0,
    }));

    // Funnel (estimated)
    const pageViews = Math.round(estimatedVisitors * 0.7);
    const addToCart = Math.round(estimatedVisitors * 0.25);
    const checkout = Math.round(estimatedVisitors * 0.15);
    const funnel = [
      { label: 'Visiteurs', value: estimatedVisitors, pct: 100 },
      { label: 'Pages produits', value: pageViews, pct: estimatedVisitors > 0 ? Math.round((pageViews / estimatedVisitors) * 100) : 0 },
      { label: 'Ajout au panier', value: addToCart, pct: estimatedVisitors > 0 ? Math.round((addToCart / estimatedVisitors) * 100) : 0 },
      { label: 'Checkout', value: checkout, pct: estimatedVisitors > 0 ? Math.round((checkout / estimatedVisitors) * 100) : 0 },
      { label: 'Achat', value: totalOrders, pct: estimatedVisitors > 0 ? Math.round((totalOrders / estimatedVisitors) * 100) : 0 },
    ];

    return { totalRevenue, totalOrders, estimatedVisitors, conversionRate, chartData, categoryData, topProducts, funnel };
  }, [orders, products, periodDays]);

  return { analytics, loading };
}
