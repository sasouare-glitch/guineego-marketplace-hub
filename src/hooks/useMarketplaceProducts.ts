/**
 * useMarketplaceProducts Hook
 * Fetch products from Firestore for the marketplace page sections
 * Uses getDocs (one-time fetch) instead of onSnapshot to avoid
 * creating watch targets that can corrupt the Firestore SDK state
 * when composite indexes are missing.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, doc, getDoc, getDocs, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface MarketplaceProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  seller: string;
  sellerId?: string;
  category: string;
  inStock: boolean;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isSponsored?: boolean;
}

// Cache store names
const storeNameCache = new Map<string, string>();

async function resolveStoreName(sellerId: string): Promise<string> {
  if (!sellerId) return 'Vendeur';
  if (storeNameCache.has(sellerId)) return storeNameCache.get(sellerId)!;
  try {
    const snap = await getDoc(doc(db, 'seller_settings', sellerId));
    if (snap.exists()) {
      const name = snap.data()?.storeInfo?.name;
      if (name) { storeNameCache.set(sellerId, name); return name; }
    }
    const sellerSnap = await getDoc(doc(db, 'sellers', sellerId));
    if (sellerSnap.exists()) {
      const name = sellerSnap.data()?.storeName || sellerSnap.data()?.businessName;
      if (name) { storeNameCache.set(sellerId, name); return name; }
    }
  } catch { /* ignore */ }
  storeNameCache.set(sellerId, 'Vendeur');
  return 'Vendeur';
}

function mapFirestoreProduct(docSnap: any): MarketplaceProduct & { _sellerId?: string } {
  const d = docSnap.data();
  const discount = d.originalPrice && d.originalPrice > d.price
    ? Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100)
    : d.discount || undefined;

  const now = new Date();
  const sponsoredUntil = d.sponsoredUntil?.toDate?.() || (d.sponsoredUntil ? new Date(d.sponsoredUntil) : null);
  const isSponsored = d.isSponsored === true && sponsoredUntil && sponsoredUntil > now;

  return {
    id: docSnap.id,
    name: d.name || '',
    price: d.price || d.basePrice || 0,
    originalPrice: d.originalPrice || undefined,
    image: d.thumbnail || d.images?.[0] || '/placeholder.svg',
    rating: d.avgRating || 0,
    reviewCount: d.totalReviews || 0,
    seller: d.sellerName || 'Vendeur',
    category: d.category || '',
    inStock: d.status === 'active' && (d.totalStock ?? 1) > 0,
    discount,
    isNew: d.isNew ?? false,
    isBestSeller: d.isBestSeller ?? false,
    isSponsored: isSponsored || false,
    _sellerId: d.sellerId || d.seller || '',
  };
}

/**
 * Fetch products once (no realtime listener) with fallback on query failure.
 * If the primary query fails (e.g. missing composite index), falls back to
 * a simpler query that only requires single-field indexes.
 */
function useFirestoreSection(
  constraints: QueryConstraint[],
  fallbackConstraints?: QueryConstraint[]
) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), ...constraints);
        const snap = await getDocs(q);
        if (cancelled) return;

        const raw = snap.docs.map(mapFirestoreProduct);
        const enriched = await Promise.all(
          raw.map(async (p: any) => {
            const storeName = p.seller !== 'Vendeur' ? p.seller : await resolveStoreName(p._sellerId || '');
            return { ...p, seller: storeName, sellerId: p._sellerId || '' };
          })
        );
        if (cancelled) return;
        setProducts(enriched.map(({ _sellerId, ...rest }: any) => rest));
      } catch (err: any) {
        console.warn('Marketplace query failed, trying fallback:', err.message);
        // Try fallback query if provided
        if (fallbackConstraints) {
          try {
            const q = query(collection(db, 'products'), ...fallbackConstraints);
            const snap = await getDocs(q);
            if (cancelled) return;

            const raw = snap.docs.map(mapFirestoreProduct);
            const enriched = await Promise.all(
              raw.map(async (p: any) => {
                const storeName = p.seller !== 'Vendeur' ? p.seller : await resolveStoreName(p._sellerId || '');
                return { ...p, seller: storeName, sellerId: p._sellerId || '' };
              })
            );
            if (cancelled) return;
            setProducts(enriched.map(({ _sellerId, ...rest }: any) => rest));
          } catch (fallbackErr) {
            console.error('Marketplace fallback query also failed:', fallbackErr);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(constraints.map(c => c.toString()))]);

  return { products, loading };
}

/**
 * Flash sales: products with discount, ordered by discount desc
 */
export function useFlashSaleProducts(count = 4) {
  return useFirestoreSection([
    where('status', '==', 'active'),
    where('discount', '>', 0),
    orderBy('discount', 'desc'),
    limit(count),
  ]);
}

/**
 * New arrivals: most recently created products
 */
export function useNewArrivals(count = 4) {
  return useFirestoreSection([
    where('status', '==', 'active'),
    where('isNew', '==', true),
    orderBy('createdAt', 'desc'),
    limit(count),
  ]);
}

/**
 * Best sellers: products flagged as best-seller, sorted by total sales
 * Fallback: just active products sorted by totalSales (single composite)
 */
export function useBestSellers(count = 4) {
  return useFirestoreSection(
    [
      where('status', '==', 'active'),
      where('isBestSeller', '==', true),
      orderBy('totalSales', 'desc'),
      limit(count),
    ],
    // Fallback: simpler query without isBestSeller filter
    [
      where('status', '==', 'active'),
      orderBy('totalSales', 'desc'),
      limit(count),
    ]
  );
}

/**
 * Sponsored products: active sponsorships, sorted by sponsoredAt desc
 * Fallback: just active products sorted by createdAt
 */
export function useSponsoredProducts(count = 8) {
  return useFirestoreSection(
    [
      where('status', '==', 'active'),
      where('isSponsored', '==', true),
      orderBy('sponsoredAt', 'desc'),
      limit(count),
    ],
    // Fallback: active products sorted by createdAt
    [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(count),
    ]
  );
}

/**
 * All marketplace sections in one call
 */
export function useMarketplaceProducts() {
  const flashSales = useFlashSaleProducts();
  const newArrivals = useNewArrivals();
  const bestSellers = useBestSellers();
  const sponsored = useSponsoredProducts();

  return {
    flashSaleProducts: flashSales.products,
    newArrivals: newArrivals.products,
    bestSellers: bestSellers.products,
    sponsoredProducts: sponsored.products,
    loading: flashSales.loading || newArrivals.loading || bestSellers.loading || sponsored.loading,
  };
}
