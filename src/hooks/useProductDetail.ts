import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const storeCache = new Map<string, { name: string; rating: number; productCount: number }>();

async function resolveSellerInfo(sellerId: string) {
  if (!sellerId) return { name: 'Vendeur', rating: 0, productCount: 0 };
  if (storeCache.has(sellerId)) return storeCache.get(sellerId)!;

  let info = { name: 'Vendeur', rating: 0, productCount: 0 };
  try {
    const settingsSnap = await getDoc(doc(db, 'seller_settings', sellerId));
    if (settingsSnap.exists()) {
      const d = settingsSnap.data();
      info.name = d?.storeInfo?.name || info.name;
    }
    const sellerSnap = await getDoc(doc(db, 'sellers', sellerId));
    if (sellerSnap.exists()) {
      const d = sellerSnap.data();
      if (info.name === 'Vendeur') info.name = d?.storeName || d?.businessName || 'Vendeur';
      info.rating = d?.rating || 0;
      info.productCount = d?.productCount || 0;
    }
  } catch { /* ignore */ }

  storeCache.set(sellerId, info);
  return info;
}

export interface ProductDetail {
  id: string;
  sellerId: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  seller: { name: string; rating: number; productCount: number; responseTime: string };
  category: string;
  inStock: boolean;
  stockCount: number;
  isBestSeller: boolean;
  isNew: boolean;
  colors: { id: string; name: string; hex: string }[];
  storage: string[];
  description: string;
  specifications: { label: string; value: string }[];
  reviews: { id: number; author: string; rating: number; date: string; comment: string }[];
}

export function useProductDetail(productId: string | undefined) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }

    const unsub = onSnapshot(doc(db, 'products', productId), async (snap) => {
      if (!snap.exists()) { setProduct(null); setLoading(false); return; }

      const d = snap.data();
      const sellerId = d.sellerId || d.seller || '';
      const sellerInfo = await resolveSellerInfo(sellerId);

      const discount = d.originalPrice && d.originalPrice > d.price
        ? Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100)
        : d.discount || undefined;

      const images = d.images?.length ? d.images : d.thumbnail ? [d.thumbnail] : ['/placeholder.svg'];

      setProduct({
        id: snap.id,
        sellerId,
        name: d.name || '',
        price: d.price || d.basePrice || 0,
        originalPrice: d.originalPrice || undefined,
        discount,
        images,
        rating: d.avgRating || 0,
        reviewCount: d.totalReviews || 0,
        seller: {
          name: d.sellerName || sellerInfo.name,
          rating: sellerInfo.rating,
          productCount: sellerInfo.productCount,
          responseTime: '< 1 heure',
        },
        category: d.category || '',
        inStock: d.status === 'active' && (d.totalStock ?? 1) > 0,
        stockCount: d.totalStock ?? 0,
        isBestSeller: d.isBestSeller ?? false,
        isNew: d.isNew ?? false,
        colors: d.colors || [],
        storage: d.storage || d.variants?.map((v: any) => v.name) || [],
        description: d.description || '',
        specifications: d.specifications || [],
        reviews: d.reviews || [],
      });
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [productId]);

  return { product, loading };
}
