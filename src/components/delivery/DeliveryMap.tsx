/**
 * DeliveryMap - Interactive Leaflet map for delivery tracking
 * Shows courier position, pickup and delivery markers in real-time
 * Supports geocoding addresses via OpenStreetMap Nominatim
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker using divIcon
function createColoredIcon(color: string, emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

const courierIcon = createColoredIcon('#3b82f6', '🏍️');
const pickupIcon = createColoredIcon('#f97316', '📦');
const deliveryIcon = createColoredIcon('#22c55e', '📍');

interface MapPoint {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  courierPosition?: MapPoint | null;
  /** Direct coordinates — take priority over address geocoding */
  pickupPosition?: MapPoint | null;
  deliveryPosition?: MapPoint | null;
  /** Addresses to geocode when no direct coordinates are provided */
  pickupAddress?: string;
  pickupCommune?: string;
  deliveryAddress?: string;
  deliveryCommune?: string;
  courierName?: string;
  pickupLabel?: string;
  deliveryLabel?: string;
  className?: string;
}

// ============================================
// Geocoding via OpenStreetMap Nominatim
// ============================================

const geocodeCache = new Map<string, MapPoint | null>();

async function geocodeAddress(address: string, commune?: string): Promise<MapPoint | null> {
  const query = commune ? `${address}, ${commune}, Guinée` : `${address}, Guinée`;
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'gn',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'fr' },
    });
    const data = await res.json();
    if (data.length > 0) {
      const point = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(query, point);
      return point;
    }
    // Fallback: try commune only
    if (commune) {
      const fallback = await geocodeAddress(commune);
      geocodeCache.set(query, fallback);
      return fallback;
    }
    geocodeCache.set(query, null);
    return null;
  } catch (err) {
    console.warn('Geocoding failed:', err);
    geocodeCache.set(query, null);
    return null;
  }
}

// ============================================
// Map sub-components
// ============================================

/** Auto-fit map bounds when markers change */
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, points.map(p => `${p.lat},${p.lng}`).join('|')]);

  return null;
}

/** Auto-pan to courier when it moves */
function FollowCourier({ position }: { position: MapPoint | null }) {
  const map = useMap();
  const prevRef = useRef<string>('');

  useEffect(() => {
    if (!position) return;
    const key = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;
    if (key !== prevRef.current) {
      prevRef.current = key;
      map.panTo([position.lat, position.lng], { animate: true, duration: 1 });
    }
  }, [position, map]);

  return null;
}

// ============================================
// Main component
// ============================================

export function DeliveryMap({
  courierPosition,
  pickupPosition,
  deliveryPosition,
  pickupAddress,
  pickupCommune,
  deliveryAddress,
  deliveryCommune,
  courierName = 'Coursier',
  pickupLabel = 'Point de collecte',
  deliveryLabel = 'Destination',
  className = '',
}: DeliveryMapProps) {
  const [geocodedPickup, setGeocodedPickup] = useState<MapPoint | null>(null);
  const [geocodedDelivery, setGeocodedDelivery] = useState<MapPoint | null>(null);

  // Geocode pickup address if no direct coords
  useEffect(() => {
    if (pickupPosition || !pickupAddress) return;
    geocodeAddress(pickupAddress, pickupCommune).then(setGeocodedPickup);
  }, [pickupAddress, pickupCommune, pickupPosition]);

  // Geocode delivery address if no direct coords
  useEffect(() => {
    if (deliveryPosition || !deliveryAddress) return;
    geocodeAddress(deliveryAddress, deliveryCommune).then(setGeocodedDelivery);
  }, [deliveryAddress, deliveryCommune, deliveryPosition]);

  const resolvedPickup = pickupPosition || geocodedPickup;
  const resolvedDelivery = deliveryPosition || geocodedDelivery;

  // Gather all valid points for bounds
  const allPoints: MapPoint[] = [
    courierPosition,
    resolvedPickup,
    resolvedDelivery,
  ].filter(Boolean) as MapPoint[];

  // Default center: Conakry, Guinea
  const defaultCenter: [number, number] = [9.5092, -13.7122];
  const center: [number, number] = allPoints.length > 0
    ? [allPoints[0].lat, allPoints[0].lng]
    : defaultCenter;

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`} style={{ minHeight: 300 }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%', minHeight: 300 }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={allPoints} />
        {courierPosition && <FollowCourier position={courierPosition} />}

        {/* Courier marker */}
        {courierPosition && (
          <Marker position={[courierPosition.lat, courierPosition.lng]} icon={courierIcon}>
            <Popup>
              <strong>🏍️ {courierName}</strong><br />
              {courierPosition.lat.toFixed(5)}, {courierPosition.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {resolvedPickup && (
          <Marker position={[resolvedPickup.lat, resolvedPickup.lng]} icon={pickupIcon}>
            <Popup>
              <strong>📦 {pickupLabel}</strong>
              {pickupCommune && <br />}
              {pickupCommune && <span>{pickupCommune}</span>}
            </Popup>
          </Marker>
        )}

        {/* Delivery marker */}
        {resolvedDelivery && (
          <Marker position={[resolvedDelivery.lat, resolvedDelivery.lng]} icon={deliveryIcon}>
            <Popup>
              <strong>📍 {deliveryLabel}</strong>
              {deliveryCommune && <br />}
              {deliveryCommune && <span>{deliveryCommune}</span>}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
