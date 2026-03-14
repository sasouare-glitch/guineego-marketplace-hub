import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product } from '@/components/marketplace/ProductCard';

// Cache store names to avoid repeated reads
const storeNameCache = new Map<string, string>();

async function resolveStoreName(sellerId: string): Promise<string> {
  if (!sellerId) return 'Vendeur';
  if (storeNameCache.has(sellerId)) return storeNameCache.get(sellerId)!;

  try {
    const settingsSnap = await getDoc(doc(db, 'seller_settings', sellerId));
    if (settingsSnap.exists()) {
      const name = settingsSnap.data()?.storeInfo?.name;
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

function mapDocBasic(doc: any): Product & { _sellerId?: string } {
  const d = doc.data();
  const discount = d.originalPrice && d.originalPrice > d.price
    ? Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100)
    : d.discount || undefined;

  // Check if sponsorship is still active
  const now = new Date();
  const sponsoredUntil = d.sponsoredUntil?.toDate?.() || (d.sponsoredUntil ? new Date(d.sponsoredUntil) : null);
  const isSponsored = d.isSponsored === true && sponsoredUntil && sponsoredUntil > now;

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
    isSponsored: isSponsored || false,
    _sellerId: d.sellerId || d.seller || '',
  };
}

export function useAllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('status', '==', 'active'));
    const unsub = onSnapshot(q, async (snap) => {
      // Clear cache on each snapshot so seller name changes propagate
      storeNameCache.clear();
      const raw = snap.docs.map(mapDocBasic);
      // Resolve store names for products that don't already have sellerName
      const enriched = await Promise.all(
        raw.map(async (p) => {
          const storeName = p.seller !== 'Vendeur' ? p.seller : await resolveStoreName(p._sellerId || '');
          return { ...p, seller: storeName, sellerId: p._sellerId || '' };
        })
      );
      // Remove internal field
      setProducts(enriched.map(({ _sellerId, ...rest }) => rest));
      setLoading(false);
    }, (err) => {
      console.error('All products query error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { products, loading };
}
