/**
 * Hook for managing seller's products in Firestore
 * Each seller only sees and manages their own products
 */

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSellerSubscription } from '@/hooks/useSellerSubscription';

export interface SellerProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  price: number;
  images: string[];
  thumbnail?: string;
  variants?: ProductVariant[];
  totalStock: number;
  sellerId: string;
  tags: string[];
  specifications: Record<string, string>;
  avgRating: number;
  totalReviews: number;
  totalSales: number;
  status: 'active' | 'draft' | 'out_of_stock';
  featured: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface NewProductData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  images: string[];
  tags?: string[];
}

export function useSellerProducts() {
  const { user, claims } = useAuth();
  const { currentPlan } = useSellerSubscription();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Seller scope id: prefer ecomId custom claim if present, fallback to UID
  const sellerScopeId = useMemo(
    () => claims?.ecomId || user?.uid || null,
    [claims?.ecomId, user?.uid]
  );

  useEffect(() => {
    if (!sellerScopeId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerScopeId),
      orderBy('createdAt', 'desc')
    );

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          })) as SellerProduct[];
          setProducts(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error loading seller products:', err);
          setError(err);
          setLoading(false);
        }
      );
    } catch (e) {
      console.error('useSellerProducts: Failed to attach listener:', e);
      setLoading(false);
    }

    return () => { try { unsubscribe?.(); } catch (e) { /* ignore */ } };
  }, [sellerScopeId]);

  // Add a new product
  const addProduct = async (data: NewProductData) => {
    if (!sellerScopeId) throw new Error('Non authentifié');

    // Enforce product limit based on subscription plan
    if (products.length >= currentPlan.productLimit) {
      toast.error(
        `Limite atteinte (${currentPlan.productLimit} produits). Passez au plan supérieur pour ajouter plus de produits.`
      );
      throw new Error('Product limit reached');
    }

    const productData = {
      name: data.name,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory || null,
      basePrice: data.basePrice,
      price: data.basePrice,
      images: data.images.length > 0 ? data.images : ['/placeholder.svg'],
      thumbnail: data.images[0] || '/placeholder.svg',
      variants: [{
        sku: `DEFAULT`,
        name: 'Standard',
        price: data.basePrice,
        stock: 0
      }],
      totalStock: 0,
      sellerId: sellerScopeId,
      tags: data.tags || [],
      specifications: {},
      avgRating: 0,
      totalReviews: 0,
      totalSales: 0,
      status: 'active' as const,
      featured: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      // Primary path: direct Firestore write (works when rules allow it)
      await addDoc(collection(db, 'products'), productData);
      toast.success('Produit ajouté avec succès');
      return;
    } catch (err: any) {
      // Fallback path: Cloud Function (works even if rules block client writes)
      if (err?.code === 'permission-denied') {
        try {
          const fn = callFunction<
            Omit<NewProductData, 'images'> & { images: string[] },
            { success: boolean; productId?: string; message?: string }
          >('createProduct');

          await fn({
            name: data.name,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory,
            basePrice: data.basePrice,
            images: data.images.length > 0 ? data.images : ['/placeholder.svg'],
            tags: data.tags || [],
          });

          toast.success('Produit ajouté avec succès');
          return;
        } catch (fnErr) {
          console.error('Cloud Function createProduct failed:', fnErr);
          toast.error("Erreur lors de l'ajout du produit");
          throw fnErr;
        }
      }

      console.error('Error adding product:', err);
      toast.error("Erreur lors de l'ajout du produit");
      throw err;
    }
  };

  // Update product status (active, draft, out_of_stock)
  const updateProductStatus = async (productId: string, status: SellerProduct['status']) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success(`Produit ${status === 'active' ? 'activé' : status === 'draft' ? 'mis en brouillon' : 'marqué en rupture'}`);
    } catch (err) {
      console.error('Error updating product status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      throw err;
    }
  };

  // Update stock
  const updateStock = async (productId: string, newStock: number) => {
    try {
      const product = products.find(p => p.id === productId);
      const variants = product?.variants?.map((v, i) =>
        i === 0 ? { ...v, stock: newStock } : v
      ) || [{ sku: 'DEFAULT', name: 'Standard', price: product?.basePrice || 0, stock: newStock }];

      await updateDoc(doc(db, 'products', productId), {
        totalStock: newStock,
        variants,
        status: newStock === 0 ? 'out_of_stock' : 'active',
        updatedAt: serverTimestamp()
      });
      toast.success('Stock mis à jour');
    } catch (err) {
      console.error('Error updating stock:', err);
      toast.error('Erreur lors de la mise à jour du stock');
      throw err;
    }
  };

  // Update product details
  const updateProduct = async (productId: string, data: Partial<SellerProduct>) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success('Produit mis à jour');
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Erreur lors de la mise à jour');
      throw err;
    }
  };

  // Delete product + cascade cleanup of related Firestore data
  const deleteProduct = async (productId: string) => {
    try {
      // Read product to know its category before deletion
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      const productData = productSnap.exists() ? productSnap.data() : null;
      const category = productData?.category as string | undefined;

      const batch = writeBatch(db);

      // 1. Delete the product itself
      batch.delete(productRef);

      // 2. Delete the search index entry
      batch.delete(doc(db, 'product_index', productId));

      // 3. Decrement category counter
      if (category) {
        batch.set(
          doc(db, 'categories', category),
          { productCount: increment(-1) },
          { merge: true }
        );
      }

      // 4. Delete product reviews
      try {
        const reviewsSnap = await getDocs(
          query(collection(db, 'reviews'), where('productId', '==', productId))
        );
        reviewsSnap.forEach((d) => batch.delete(d.ref));
      } catch (e) {
        console.warn('Reviews cleanup skipped:', e);
      }

      // 5. Remove from wishlists
      try {
        const wishlistSnap = await getDocs(
          query(collection(db, 'wishlists'), where('productId', '==', productId))
        );
        wishlistSnap.forEach((d) => batch.delete(d.ref));
      } catch (e) {
        console.warn('Wishlist cleanup skipped:', e);
      }

      // 6. Remove related alerts (low stock, etc.)
      try {
        const alertsSnap = await getDocs(
          query(collection(db, 'alerts'), where('productId', '==', productId))
        );
        alertsSnap.forEach((d) => batch.delete(d.ref));
      } catch (e) {
        console.warn('Alerts cleanup skipped:', e);
      }

      await batch.commit();
      toast.success('Produit supprimé');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Erreur lors de la suppression');
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProductStatus,
    updateStock,
    updateProduct,
    deleteProduct
  };
}
