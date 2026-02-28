import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product } from '@/components/marketplace/ProductCard';

function mapDoc(doc: any): Product {
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
    seller: d.sellerName || d.seller || 'Vendeur',
    category: d.category || '',
    inStock: d.status === 'active' && (d.totalStock ?? 1) > 0,
    discount,
    isNew: d.isNew ?? false,
    isBestSeller: d.isBestSeller ?? false,
  };
}

export function useAllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('status', '==', 'active'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(mapDoc));
      setLoading(false);
    }, (err) => {
      console.error('All products query error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { products, loading };
}
