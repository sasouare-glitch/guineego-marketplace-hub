/**
 * useDeliveryTracking Hook
 * Real-time delivery tracking with GPS location
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { doc, onSnapshot, type Timestamp, type GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRealtimeDoc } from '@/lib/firebase/queries';
import type { FirestoreDoc } from '@/lib/firebase/queries';

// ============================================
// TYPES
// ============================================

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  commune: string;
  quartier?: string;
  address: string;
  instructions?: string;
}

export interface CourierLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Timestamp;
}

export interface DeliveryStatusEntry {
  status: string;
  timestamp: Timestamp;
  performedBy?: string;
  note?: string;
  photo?: string;
  location?: CourierLocation;
}

export type DeliveryStatus = 
  | 'pending'
  | 'accepted'
  | 'pickup_started'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

export interface DeliveryMission extends FirestoreDoc {
  orderId: string;
  customerId: string;
  sellerIds: string[];
  pickup: DeliveryAddress;
  delivery: DeliveryAddress;
  priority: 'normal' | 'express';
  fee: number;
  estimatedTime?: number;
  status: DeliveryStatus;
  assignedCourier?: string;
  assignedCourierId?: string;
  courierLocation?: CourierLocation;
  courierPhone?: string;
  courierName?: string;
  statusHistory: DeliveryStatusEntry[];
  acceptedAt?: Timestamp;
  pickedUpAt?: Timestamp;
  deliveredAt?: Timestamp;
  proofOfDelivery?: string;
  distance?: number;
  lastLocationUpdate?: Timestamp;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook for real-time delivery tracking
 * Provides live updates on delivery status and courier location
 */
export function useDeliveryTracking(deliveryId: string | null | undefined) {
  const { data: delivery, loading, error } = useRealtimeDoc<DeliveryMission>('deliveries', deliveryId);

  // Calculate derived state
  const currentStatus = delivery?.status || null;
  const isActive = delivery ? !['delivered', 'cancelled'].includes(delivery.status) : false;
  const isCompleted = delivery?.status === 'delivered';
  const isPending = delivery?.status === 'pending';
  const hasAssignedCourier = !!delivery?.assignedCourier;

  // Courier location
  const courierLocation = delivery?.courierLocation || null;
  const lastLocationUpdate = delivery?.lastLocationUpdate?.toDate() || null;

  // Calculate progress percentage
  const statusProgress: Record<DeliveryStatus, number> = {
    pending: 0,
    accepted: 15,
    pickup_started: 30,
    picked_up: 45,
    in_transit: 60,
    arrived: 85,
    delivered: 100,
    cancelled: 0
  };
  const progress = delivery ? statusProgress[delivery.status] : 0;

  // Calculate ETA
  const estimatedArrival = useMemo(() => {
    if (!delivery?.acceptedAt || !delivery?.estimatedTime) return null;
    const acceptedTime = delivery.acceptedAt.toDate().getTime();
    const eta = new Date(acceptedTime + delivery.estimatedTime * 60 * 1000);
    return eta;
  }, [delivery?.acceptedAt, delivery?.estimatedTime]);

  // Time remaining
  const timeRemaining = useMemo(() => {
    if (!estimatedArrival) return null;
    const now = new Date().getTime();
    const remaining = estimatedArrival.getTime() - now;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / 60000); // in minutes
  }, [estimatedArrival]);

  // Status message
  const statusMessage = useMemo(() => {
    if (!delivery) return '';
    
    const messages: Record<DeliveryStatus, string> = {
      pending: 'En attente d\'un coursier',
      accepted: 'Coursier assigné, en route vers le point de collecte',
      pickup_started: 'Coursier en route vers le vendeur',
      picked_up: 'Colis récupéré',
      in_transit: 'En route vers votre adresse',
      arrived: 'Le coursier est arrivé à votre adresse',
      delivered: 'Livré avec succès !',
      cancelled: 'Livraison annulée'
    };
    
    return messages[delivery.status];
  }, [delivery?.status]);

  return {
    delivery,
    loading,
    error,
    currentStatus,
    isActive,
    isCompleted,
    isPending,
    hasAssignedCourier,
    courierLocation,
    lastLocationUpdate,
    progress,
    estimatedArrival,
    timeRemaining,
    statusMessage,
    statusHistory: delivery?.statusHistory || []
  };
}

/**
 * Hook for courier's active delivery
 */
export function useCourierActiveDelivery(courierId: string | null | undefined) {
  const [activeDelivery, setActiveDelivery] = useState<DeliveryMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!courierId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsub: (() => void) | undefined;
    
    import('firebase/firestore').then(({ collection, query, where, orderBy, limit, onSnapshot }) => {
      const q = query(
        collection(db, 'deliveries'),
        where('assignedCourier', '==', courierId),
        where('status', 'in', ['accepted', 'pickup_started', 'picked_up', 'in_transit', 'arrived']),
        orderBy('acceptedAt', 'desc'),
        limit(1)
      );

      try {
        unsub = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              setActiveDelivery({ id: doc.id, ...doc.data() } as DeliveryMission);
            } else {
              setActiveDelivery(null);
            }
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('Error fetching active delivery:', err);
            setError(err);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error('useCourierActiveDelivery: Failed to attach listener:', e);
        setLoading(false);
      }
    });

    return () => { try { unsub?.(); } catch (e) { /* ignore */ } };
  }, [courierId]);

  return { activeDelivery, loading, error };
}

/**
 * Hook for available missions (for couriers)
 */
export function useAvailableMissions(courierZones: string[] = []) {
  const [missions, setMissions] = useState<DeliveryMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (courierZones.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    import('firebase/firestore').then(({ collection, query, where, orderBy, onSnapshot }) => {
      // Note: This query would need a composite index
      const q = query(
        collection(db, 'deliveries'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let missionsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as DeliveryMission));
          
          // Filter by zones client-side
          missionsList = missionsList.filter(m => 
            courierZones.includes(m.delivery.commune)
          );
          
          setMissions(missionsList);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching available missions:', err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    });
  }, [courierZones.join(',')]);

  return { missions, loading, error };
}

/**
 * Hook for tracking delivery on map
 */
export function useDeliveryMapTracking(deliveryId: string | null | undefined) {
  const { 
    delivery, 
    courierLocation, 
    loading, 
    error 
  } = useDeliveryTracking(deliveryId);

  // Map markers
  const markers = useMemo(() => {
    if (!delivery) return [];

    const m: Array<{
      id: string;
      type: 'pickup' | 'delivery' | 'courier';
      label: string;
      address: string;
      position: { lat: number; lng: number } | null;
    }> = [
      // Pickup location
      {
        id: 'pickup',
        type: 'pickup',
        label: 'Point de collecte',
        address: delivery.pickup.address,
        position: null
      },
      // Delivery location
      {
        id: 'delivery',
        type: 'delivery',
        label: 'Destination',
        address: delivery.delivery.address,
        position: null
      }
    ];

    // Courier position
    if (courierLocation) {
      m.push({
        id: 'courier',
        type: 'courier',
        label: 'Coursier',
        address: '',
        position: {
          lat: courierLocation.lat,
          lng: courierLocation.lng
        }
      });
    }

    return m;
  }, [delivery, courierLocation]);

  return {
    delivery,
    courierLocation,
    markers,
    loading,
    error
  };
}
