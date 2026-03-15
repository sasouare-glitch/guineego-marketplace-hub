import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product } from '@/components/marketplace/ProductCard';

interface SellerStoreData {
  products: Product[];
  storeName: string;
  loading: boolean;
}

export function useSellerStoreProducts(sellerId: string | null): SellerStoreData {
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }

    // Fetch store name
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'seller_settings', sellerId));
        if (snap.exists()) {
          const name = snap.data()?.storeInfo?.name;
          if (name) { setStoreName(name); return; }
        }
        const sellerSnap = await getDoc(doc(db, 'sellers', sellerId));
        if (sellerSnap.exists()) {
          setStoreName(sellerSnap.data()?.storeName || sellerSnap.data()?.businessName || 'Boutique');
        }
      } catch { setStoreName('Boutique'); }
    })();

    // Realtime products
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'active'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const items: Product[] = snap.docs.map(d => {
        const data = d.data();
        const discount = data.originalPrice && data.originalPrice > data.price
          ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
          : data.discount || undefined;
        return {
          id: d.id,
          name: data.name || '',
          price: data.price || data.basePrice || 0,
          originalPrice: data.originalPrice || undefined,
          image: data.thumbnail || data.images?.[0] || '/placeholder.svg',
          rating: data.avgRating || 0,
          reviewCount: data.totalReviews || 0,
          seller: data.sellerName || 'Vendeur',
          sellerId: sellerId,
          category: data.category || '',
          inStock: data.status === 'active' && (data.totalStock ?? 1) > 0,
          discount,
        };
      });
      setProducts(items);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [sellerId]);

  return { products, storeName, loading };
}
