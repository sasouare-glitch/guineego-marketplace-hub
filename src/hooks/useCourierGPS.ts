import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface UseCourierGPSOptions {
  missionId?: string;
  pickupCoords?: { lat: number; lng: number } | null;
  deliveryCoords?: { lat: number; lng: number } | null;
  /** Current mission status to determine which point to track distance to */
  currentStatus?: string;
}

/**
 * Haversine formula: distance in meters between two GPS points
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PROXIMITY_THRESHOLD = 150; // meters

export function useCourierGPS({
  missionId,
  pickupCoords,
  deliveryCoords,
  currentStatus,
}: UseCourierGPSOptions) {
  const { user } = useAuth();
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [isNearTarget, setIsNearTarget] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Determine which target point to track based on status
  const getTargetCoords = useCallback(() => {
    if (!currentStatus) return null;
    // Before pickup → target is pickup point
    if (["accepted", "pickup_started"].includes(currentStatus)) {
      return pickupCoords || null;
    }
    // After pickup → target is delivery point
    if (["picked_up", "in_transit", "arrived"].includes(currentStatus)) {
      return deliveryCoords || null;
    }
    return null;
  }, [currentStatus, pickupCoords, deliveryCoords]);

  // Update target label
  useEffect(() => {
    if (!currentStatus) return;
    if (["accepted", "pickup_started"].includes(currentStatus)) {
      setTargetLabel("point de récupération");
    } else if (["picked_up", "in_transit", "arrived"].includes(currentStatus)) {
      setTargetLabel("point de livraison");
    } else {
      setTargetLabel("");
    }
  }, [currentStatus]);

  // Start watching GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non disponible");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: GPSPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        };
        setPosition(newPos);
        setError(null);

        // Calculate distance to target
        const target = getTargetCoords();
        if (target) {
          const dist = haversineDistance(newPos.lat, newPos.lng, target.lat, target.lng);
          setDistanceToTarget(Math.round(dist));
          setIsNearTarget(dist <= PROXIMITY_THRESHOLD);
        } else {
          setDistanceToTarget(null);
          setIsNearTarget(false);
        }

        // Update Firestore location (throttle: every 10s)
        const now = Date.now();
        if (missionId && user && now - lastUpdateRef.current > 10000) {
          lastUpdateRef.current = now;
          updateDoc(doc(db, "deliveries", missionId), {
            "courierLocation.lat": newPos.lat,
            "courierLocation.lng": newPos.lng,
            "courierLocation.accuracy": newPos.accuracy,
            "courierLocation.speed": newPos.speed,
            "courierLocation.heading": newPos.heading,
            "courierLocation.updatedAt": serverTimestamp(),
          }).catch(console.error);
        }
      },
      (err) => {
        setError(
          err.code === 1
            ? "Accès GPS refusé. Activez la localisation."
            : err.code === 2
              ? "Position indisponible"
              : "Délai GPS dépassé"
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [missionId, user, getTargetCoords]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return {
    position,
    error,
    distanceToTarget,
    isNearTarget,
    targetLabel,
    formatDistance,
    proximityThreshold: PROXIMITY_THRESHOLD,
  };
}
