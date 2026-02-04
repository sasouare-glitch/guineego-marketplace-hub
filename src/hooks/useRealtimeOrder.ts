/**
 * useRealtimeOrder Hook
 * Real-time order tracking with status updates
 */

import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRealtimeDoc } from '@/lib/firebase/queries';
import type { FirestoreDoc } from '@/lib/firebase/queries';

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
  thumbnail?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  commune: string;
  quartier: string;
  address: string;
  instructions?: string;
}

export interface OrderPricing {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: Timestamp;
  performedBy?: string;
  role?: string;
  note?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Order extends FirestoreDoc {
  customerId: string;
  items: OrderItem[];
  sellers: Record<string, {
    items: OrderItem[];
    subtotal: number;
    sellerId: string;
  }>;
  sellerIds: string[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'orange_money' | 'mtn_money' | 'card' | 'wallet' | 'cash';
  couponCode?: string;
  pricing: OrderPricing;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  statusHistory: StatusHistoryEntry[];
  assignedCloser?: string;
  closerId?: string;
  assignedCourier?: string;
  deliveryMissionId?: string;
  paidAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for real-time order tracking
 * Provides live updates on order status, courier location, etc.
 */
export function useRealtimeOrder(orderId: string | null | undefined) {
  const { data: order, loading, error } = useRealtimeDoc<Order>('orders', orderId);
  
  // Calculate derived state
  const currentStatus = order?.status || null;
  const paymentStatus = order?.paymentStatus || null;
  const canCancel = order ? ['pending', 'confirmed', 'preparing'].includes(order.status) : false;
  const isDelivered = order?.status === 'delivered';
  const isPending = order?.status === 'pending';
  
  // Get latest status update
  const latestStatusUpdate = order?.statusHistory?.slice(-1)[0] || null;
  
  // Calculate estimated delivery
  const estimatedDelivery = order?.createdAt ? 
    new Date(order.createdAt.toDate().getTime() + 24 * 60 * 60 * 1000) : // +24h
    null;

  return {
    order,
    loading,
    error,
    currentStatus,
    paymentStatus,
    canCancel,
    isDelivered,
    isPending,
    latestStatusUpdate,
    estimatedDelivery,
    statusHistory: order?.statusHistory || []
  };
}

/**
 * Hook for seller's order view with realtime updates
 */
export function useSellerRealtimeOrder(orderId: string | null | undefined, sellerId: string | null | undefined) {
  const { order, loading, error, ...rest } = useRealtimeOrder(orderId);
  
  // Extract seller-specific data
  const sellerData = order && sellerId ? order.sellers?.[sellerId] : null;
  const sellerItems = sellerData?.items || [];
  const sellerSubtotal = sellerData?.subtotal || 0;
  const hasAccess = order?.sellerIds?.includes(sellerId || '') || false;

  return {
    order,
    loading,
    error,
    sellerItems,
    sellerSubtotal,
    hasAccess,
    ...rest
  };
}

/**
 * Hook for customer's orders list with realtime updates
 */
export function useCustomerOrders(customerId: string | null | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Import query functions
    import('firebase/firestore').then(({ collection, query, where, orderBy, onSnapshot }) => {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order));
          setOrders(ordersList);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching customer orders:', err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    });
  }, [customerId]);

  return { orders, loading, error };
}

/**
 * Hook for seller's orders with realtime updates
 */
export function useSellerOrders(sellerId: string | null | undefined, statusFilter?: OrderStatus) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    import('firebase/firestore').then(({ collection, query, where, orderBy, onSnapshot }) => {
      let q = query(
        collection(db, 'orders'),
        where('sellerIds', 'array-contains', sellerId),
        orderBy('createdAt', 'desc')
      );

      // Note: Status filter would require a composite index
      // For now, filter client-side
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let ordersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order));
          
          if (statusFilter) {
            ordersList = ordersList.filter(o => o.status === statusFilter);
          }
          
          setOrders(ordersList);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching seller orders:', err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    });
  }, [sellerId, statusFilter]);

  // Calculate stats
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.sellers?.[sellerId || '']?.subtotal || 0), 0);

  return { 
    orders, 
    loading, 
    error,
    stats: {
      pendingCount,
      processingCount,
      completedCount,
      totalRevenue
    }
  };
}
