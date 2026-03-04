/**
 * useMarketplaceProducts Hook
 * Fetch products from Firestore for the marketplace page sections
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc, type QueryConstraint } from 'firebase/firestore';
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

function mapFirestoreProduct(doc: any): MarketplaceProduct & { _sellerId?: string } {
  const d = doc.data();
  const discount = d.originalPrice && d.originalPrice > d.price
    ? Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100)
    : d.discount || undefined;

  return {
    id: doc.id,
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
    _sellerId: d.sellerId || d.seller || '',
  };
}

function useFirestoreSection(constraints: QueryConstraint[]) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), ...constraints);
    const unsub = onSnapshot(q, async (snap) => {
      const raw = snap.docs.map(mapFirestoreProduct);
      const enriched = await Promise.all(
        raw.map(async (p) => {
          const storeName = p.seller !== 'Vendeur' ? p.seller : await resolveStoreName(p._sellerId || '');
          return { ...p, seller: storeName, sellerId: p._sellerId || '' };
        })
      );
      setProducts(enriched.map(({ _sellerId, ...rest }) => rest));
      setLoading(false);
    }, (err) => {
      console.error('Marketplace query error:', err);
      setLoading(false);
    });
    return () => unsub();
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
 */
export function useBestSellers(count = 4) {
  return useFirestoreSection([
    where('status', '==', 'active'),
    where('isBestSeller', '==', true),
    orderBy('totalSales', 'desc'),
    limit(count),
  ]);
}

/**
 * All marketplace sections in one call
 */
export function useMarketplaceProducts() {
  const flashSales = useFlashSaleProducts();
  const newArrivals = useNewArrivals();
  const bestSellers = useBestSellers();

  return {
    flashSaleProducts: flashSales.products,
    newArrivals: newArrivals.products,
    bestSellers: bestSellers.products,
    loading: flashSales.loading || newArrivals.loading || bestSellers.loading,
  };
}
