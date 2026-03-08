/**
 * ANALYTICS HOOKS: Track events and fetch KPIs
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth';

// ============================================
// EVENT TRACKING
// ============================================

interface TrackEventParams {
  event: string;
  properties?: Record<string, any>;
}

export function useTrackEvent() {
  const { user } = useAuth();

  const trackEvent = useCallback(async ({ event, properties = {} }: TrackEventParams) => {
    try {
      const logAnalyticsEvent = httpsCallable(functions, 'logAnalyticsEvent');
      await logAnalyticsEvent({
        event,
        properties: {
          ...properties,
          timestamp: Date.now()
        },
        sessionId: sessionStorage.getItem('sessionId') || generateSessionId(),
        platform: 'web'
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  // Convenience methods for common events
  const trackPageView = useCallback((pageName: string, properties?: Record<string, any>) => {
    trackEvent({ event: 'page_view', properties: { page: pageName, ...properties } });
  }, [trackEvent]);

  const trackAddToCart = useCallback((productId: string, productName: string, price: number, quantity: number) => {
    trackEvent({
      event: 'add_to_cart',
      properties: { productId, productName, price, quantity, value: price * quantity }
    });
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((productId: string, productName: string) => {
    trackEvent({
      event: 'remove_from_cart',
      properties: { productId, productName }
    });
  }, [trackEvent]);

  const trackCheckoutStarted = useCallback((cartValue: number, itemCount: number) => {
    trackEvent({
      event: 'checkout_started',
      properties: { value: cartValue, itemCount }
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((orderId: string, total: number, items: any[]) => {
    trackEvent({
      event: 'purchase',
      properties: { 
        orderId, 
        value: total, 
        itemCount: items.length,
        items: items.map(i => ({ id: i.productId, name: i.name, price: i.price, quantity: i.quantity }))
      }
    });
  }, [trackEvent]);

  const trackProductView = useCallback((productId: string, productName: string, sellerId: string) => {
    trackEvent({
      event: 'product_view',
      properties: { productId, productName, sellerId }
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent({
      event: 'search',
      properties: { query, resultsCount }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStarted,
    trackPurchase,
    trackProductView,
    trackSearch
  };
}

function generateSessionId(): string {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('sessionId', id);
  return id;
}

// ============================================
// REAL-TIME COUNTERS
// ============================================

interface RealtimeCounters {
  purchases: number;
  revenue: number;
  addToCart: number;
  checkouts: number;
  signups: { total: number; [role: string]: number };
  hourly: Record<number, { purchases: number; revenue: number }>;
}

export function useRealtimeCounters() {
  const [counters, setCounters] = useState<RealtimeCounters | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'realtime_counters', today);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setCounters(snapshot.data() as RealtimeCounters);
      } else {
        setCounters({
          purchases: 0,
          revenue: 0,
          addToCart: 0,
          checkouts: 0,
          signups: { total: 0 },
          hourly: {}
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to realtime counters:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { counters, loading };
}

// ============================================
// DAILY REPORTS
// ============================================

interface DailyReport {
  date: string;
  gmv: number;
  netRevenue: number;
  platformCommission: number;
  totalOrders: number;
  averageOrderValue: number;
  deliveriesCompleted: number;
  averageDeliveryTime: number;
  newUsers: number;
  activeUsers: number;
  topCategories: Array<{ category: string; revenue: number; orders: number }>;
  topCommunes: Array<{ commune: string; orders: number; revenue: number }>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
  closerPerformance: { totalCalls: number; conversions: number; conversionRate: number };
}

export function useDailyReports(days: number = 30) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'daily_reports'),
      where('date', '>=', startStr),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as DailyReport);
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [days]);

  return { reports, loading };
}

// ============================================
// ROLLING METRICS
// ============================================

interface RollingMetrics {
  rolling7: {
    gmv: number;
    orders: number;
    avgOrderValue: number;
    deliveries: number;
    newUsers: number;
  };
  rolling30: {
    gmv: number;
    orders: number;
    avgOrderValue: number;
    deliveries: number;
    newUsers: number;
  };
}

export function useRollingMetrics() {
  const [metrics, setMetrics] = useState<RollingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'rolling_metrics', 'current');

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setMetrics(snapshot.data() as RollingMetrics);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { metrics, loading };
}

// ============================================
// ECOM PERFORMANCE
// ============================================

interface EcomPerformance {
  ecomId: string;
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{ productId: string; name: string; sales: number; revenue: number }>;
  returnRate: number;
  customerSatisfaction: number;
  abandonedCarts: number;
  newCustomers: number;
  returningCustomers: number;
}

export function useEcomPerformance(ecomId: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['ecomPerformance', ecomId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const calculateEcomPerformance = httpsCallable<any, EcomPerformance>(
        functions, 
        'calculateEcomPerformance'
      );
      
      const result = await calculateEcomPerformance({
        ecomId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      return result.data;
    },
    enabled: !!ecomId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// ============================================
// COURIER PERFORMANCE
// ============================================

interface CourierPerformance {
  courierId: string;
  period: string;
  totalDeliveries: number;
  cancelledDeliveries: number;
  completionRate: number;
  totalEarnings: number;
  averageDeliveryTime: number;
  zoneDistribution: Record<string, number>;
  hourlyDistribution: Record<number, number>;
  averageRating: number;
  totalRatings: number;
}

export function useCourierPerformance(courierId: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['courierPerformance', courierId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const calculateCourierPerformance = httpsCallable<any, CourierPerformance>(
        functions, 
        'calculateCourierPerformance'
      );
      
      const result = await calculateCourierPerformance({
        courierId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      return result.data;
    },
    enabled: !!courierId,
    staleTime: 5 * 60 * 1000
  });
}

// ============================================
// CLOSER PERFORMANCE
// ============================================

interface CloserPerformance {
  closerId: string;
  period: string;
  totalTasks: number;
  completedTasks: number;
  conversions: number;
  conversionRate: number;
  averageCallDuration: number;
  revenueGenerated: number;
  commissionEarned: number;
  dailyBreakdown: Record<string, { calls: number; conversions: number }>;
  topObjections: Array<{ objection: string; count: number }>;
}

export function useCloserPerformance(closerId: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['closerPerformance', closerId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const calculateCloserPerformance = httpsCallable<any, CloserPerformance>(
        functions, 
        'calculateCloserPerformance'
      );
      
      const result = await calculateCloserPerformance({
        closerId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      return result.data;
    },
    enabled: !!closerId,
    staleTime: 5 * 60 * 1000
  });
}

// ============================================
// ADMIN DASHBOARD
// ============================================

export function useAdminDashboard() {
  const { counters, loading: countersLoading } = useRealtimeCounters();
  const { metrics, loading: metricsLoading } = useRollingMetrics();
  const { reports, loading: reportsLoading } = useDailyReports(7);

  const todayReport = reports[0];
  const yesterdayReport = reports[1];

  // Calculate trends
  const calculateTrend = (today: number, yesterday: number) => {
    if (!yesterday) return 0;
    return ((today - yesterday) / yesterday) * 100;
  };

  const trends = todayReport && yesterdayReport ? {
    gmv: calculateTrend(todayReport.gmv, yesterdayReport.gmv),
    orders: calculateTrend(todayReport.totalOrders, yesterdayReport.totalOrders),
    deliveries: calculateTrend(todayReport.deliveriesCompleted, yesterdayReport.deliveriesCompleted),
    newUsers: calculateTrend(todayReport.newUsers, yesterdayReport.newUsers)
  } : null;

  return {
    realtime: counters,
    rolling: metrics,
    today: todayReport,
    trends,
    weeklyReports: reports,
    loading: countersLoading || metricsLoading || reportsLoading
  };
}
