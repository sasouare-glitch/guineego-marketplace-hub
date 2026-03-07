/**
 * Hook to fetch real-time Firestore data for Admin Dashboard
 * Replaces all mock/hardcoded data with live collection queries
 */

import { useRealtimeCollection, type FirestoreDoc } from '@/lib/firebase/queries';
import { orderBy, where, limit } from 'firebase/firestore';

// ============================================
// TYPES
// ============================================

interface Seller extends FirestoreDoc {
  businessName?: string;
  shopName?: string;
  name?: string;
  displayName?: string;
  totalSales?: number;
  totalRevenue?: number;
  status?: string;
}

interface Product extends FirestoreDoc {
  status?: string;
  sellerId?: string;
}

interface Transit extends FirestoreDoc {
  shipmentId?: string;
  client?: string;
  status?: string;
  weight?: number;
  eta?: string;
  mode?: string;
  cost?: number;
}

interface Courier extends FirestoreDoc {
  status?: string;
  isOnline?: boolean;
}

interface Delivery extends FirestoreDoc {
  status?: string;
  deliveredAt?: any;
  createdAt?: any;
  estimatedDeliveryTime?: any;
  actualDeliveryTime?: number;
}

interface Order extends FirestoreDoc {
  status?: string;
  dispute?: boolean;
}

interface AcademyCourse extends FirestoreDoc {
  title?: string;
  studentsCount?: number;
  completionRate?: number;
  status?: string;
}

interface AdminAlert extends FirestoreDoc {
  type?: 'warning' | 'error' | 'success' | 'info';
  message?: string;
  time?: string;
  read?: boolean;
}

// ============================================
// MAIN HOOK
// ============================================

export function useAdminDashboardData() {
  // Fetch all collections in parallel
  const { data: sellers, loading: sellersLoading } = useRealtimeCollection<Seller>('sellers');
  const { data: products, loading: productsLoading } = useRealtimeCollection<Product>('products');
  const { data: transit, loading: transitLoading } = useRealtimeCollection<Transit>(
    'transit', [orderBy('createdAt', 'desc')]
  );
  const { data: couriers, loading: couriersLoading } = useRealtimeCollection<Courier>('couriers');
  const { data: deliveries, loading: deliveriesLoading } = useRealtimeCollection<Delivery>('deliveries');
  const { data: orders, loading: ordersLoading } = useRealtimeCollection<Order>('orders');
  const { data: academyCourses, loading: academyLoading } = useRealtimeCollection<AcademyCourse>('academy');
  const { data: adminAlerts, loading: alertsLoading } = useRealtimeCollection<AdminAlert>(
    'admin_alerts', [orderBy('createdAt', 'desc'), limit(10)]
  );

  // ---- Secondary KPIs ----
  const activeSellers = sellers.filter(s => s.status !== 'suspended').length;
  const liveProducts = products.filter(p => p.status !== 'draft' && p.status !== 'archived').length;
  const academyStudents = academyCourses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
  const transitCount = transit.length;
  const activeCouriers = couriers.filter(c => c.isOnline || c.status === 'active').length;

  // ---- Top Sellers ----
  const topSellers = [...sellers]
    .filter(s => (s.totalRevenue || 0) > 0)
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 5)
    .map(s => ({
      name: s.businessName || s.shopName || s.name || s.displayName || 'Sans nom',
      sales: s.totalSales || 0,
      revenue: s.totalRevenue || 0,
      trend: 0, // Would need historical data for real trend
    }));

  // ---- Delivery Stats ----
  const deliveriesInTransit = deliveries.filter(d => d.status === 'in_transit' || d.status === 'picked_up').length;
  const deliveriesCompleted = deliveries.filter(d => d.status === 'delivered').length;
  const deliveriesLate = deliveries.filter(d => d.status === 'late' || d.status === 'delayed').length;
  const deliveriesCancelled = deliveries.filter(d => d.status === 'cancelled').length;
  const onTimeRate = deliveriesCompleted > 0
    ? Math.round((deliveries.filter(d => d.status === 'delivered' && !d.actualDeliveryTime).length / deliveriesCompleted) * 100)
    : 0;

  // ---- Transit (recent 3) ----
  const recentTransit = transit.slice(0, 3).map(t => ({
    id: t.shipmentId || t.id,
    status: t.status || 'pending',
    eta: t.eta || '',
    weight: `${t.weight || 0} kg`,
    client: t.client || '',
  }));

  // ---- Academy Stats ----
  const activeCourses = academyCourses.filter(c => c.status !== 'draft').length;
  const certifiedStudents = academyCourses.reduce((sum, c) => sum + Math.round((c.studentsCount || 0) * (c.completionRate || 0) / 100), 0);
  const topCourses = academyCourses
    .filter(c => c.status !== 'draft')
    .slice(0, 3)
    .map(c => ({
      name: c.title || 'Cours',
      students: c.studentsCount || 0,
      completion: c.completionRate || 0,
    }));

  // ---- Alerts ----
  const recentAlerts = adminAlerts.map(a => ({
    type: a.type || 'info',
    message: a.message || '',
    time: a.time || '',
  }));

  // ---- Pending Actions ----
  const pendingSellers = sellers.filter(s => s.status === 'pending').length;
  const disputeOrders = orders.filter(o => o.dispute || o.status === 'disputed').length;
  const reportedProducts = products.filter(p => p.status === 'reported' || p.status === 'flagged').length;

  const loading = sellersLoading || productsLoading || transitLoading || 
    couriersLoading || deliveriesLoading || ordersLoading || academyLoading || alertsLoading;

  return {
    loading,
    // Secondary KPIs
    activeSellers,
    liveProducts,
    academyStudents,
    transitCount,
    activeCouriers,
    // Top sellers
    topSellers,
    // Delivery stats
    deliveryStats: {
      inTransit: deliveriesInTransit,
      completed: deliveriesCompleted,
      late: deliveriesLate,
      cancelled: deliveriesCancelled,
      onTimeRate: onTimeRate || 0,
    },
    // Transit
    recentTransit,
    // Academy
    academyStats: {
      students: academyStudents,
      activeCourses,
      certified: certifiedStudents,
      topCourses,
    },
    // Alerts
    recentAlerts,
    // Pending actions
    pendingActions: {
      sellers: pendingSellers,
      disputes: disputeOrders,
      reported: reportedProducts,
    },
  };
}
