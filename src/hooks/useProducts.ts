/**
 * useProductsByCategory Hook
 * Fetch products by category with pagination and realtime updates
 */

import { useMemo } from 'react';
import { where, orderBy, limit, type QueryConstraint } from 'firebase/firestore';
import { useFirestoreQuery, useFirestoreInfinite, useRealtimeCollection, type FirestoreDoc } from '@/lib/firebase/queries';

// ============================================
// TYPES
// ============================================

export interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface Product extends FirestoreDoc {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  price: number;
  images: string[];
  thumbnail: string;
  variants: ProductVariant[];
  totalStock: number;
  sellerId: string;
  avgRating: number;
  totalReviews: number;
  totalSales: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  tags: string[];
}

interface UseProductsOptions {
  category?: string;
  subcategory?: string;
  sellerId?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'createdAt' | 'sales' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  realtime?: boolean;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for fetching products by category
 * Supports filtering, sorting, pagination, and realtime updates
 */
export function useProductsByCategory(options: UseProductsOptions = {}) {
  const {
    category,
    subcategory,
    sellerId,
    featured,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit: queryLimit = 20,
    realtime = false
  } = options;

  // Build query constraints
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [
      where('status', '==', 'active')
    ];

    if (category) {
      c.push(where('category', '==', category));
    }

    if (subcategory) {
      c.push(where('subcategory', '==', subcategory));
    }

    if (sellerId) {
      c.push(where('sellerId', '==', sellerId));
    }

    if (featured !== undefined) {
      c.push(where('featured', '==', featured));
    }

    if (minPrice !== undefined) {
      c.push(where('price', '>=', minPrice));
    }

    if (maxPrice !== undefined) {
      c.push(where('price', '<=', maxPrice));
    }

    // Order by
    const orderField = sortBy === 'sales' ? 'totalSales' : 
                       sortBy === 'rating' ? 'avgRating' : 
                       sortBy;
    c.push(orderBy(orderField, sortOrder));
    c.push(limit(queryLimit));

    return c;
  }, [category, subcategory, sellerId, featured, minPrice, maxPrice, sortBy, sortOrder, queryLimit]);

  // Use realtime or standard query
  const realtimeResult = useRealtimeCollection<Product>('products', constraints);
  const queryResult = useFirestoreQuery<Product>('products', constraints, {
    enabled: !realtime,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  if (realtime) {
    return {
      products: realtimeResult.data,
      loading: realtimeResult.loading,
      error: realtimeResult.error,
      isRealtime: true
    };
  }

  return {
    products: queryResult.data || [],
    loading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isRealtime: false
  };
}

/**
 * Hook for infinite scroll products
 */
export function useProductsInfinite(options: Omit<UseProductsOptions, 'limit'> = {}) {
  const {
    category,
    subcategory,
    sellerId,
    featured,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [
      where('status', '==', 'active')
    ];

    if (category) c.push(where('category', '==', category));
    if (subcategory) c.push(where('subcategory', '==', subcategory));
    if (sellerId) c.push(where('sellerId', '==', sellerId));
    if (featured !== undefined) c.push(where('featured', '==', featured));

    const orderField = sortBy === 'sales' ? 'totalSales' : 
                       sortBy === 'rating' ? 'avgRating' : 
                       sortBy;
    c.push(orderBy(orderField, sortOrder));

    return c;
  }, [category, subcategory, sellerId, featured, sortBy, sortOrder]);

  const result = useFirestoreInfinite<Product>('products', constraints, 20);

  return {
    products: result.data?.pages.flatMap(page => page.data) || [],
    loading: result.isLoading,
    loadingMore: result.isFetchingNextPage,
    error: result.error,
    hasMore: result.hasNextPage,
    loadMore: result.fetchNextPage,
    refetch: result.refetch
  };
}

/**
 * Hook for featured products (homepage)
 */
export function useFeaturedProducts(limitCount: number = 8) {
  return useProductsByCategory({
    featured: true,
    sortBy: 'sales',
    sortOrder: 'desc',
    limit: limitCount
  });
}

/**
 * Hook for seller's products
 */
export function useSellerProducts(sellerId: string | undefined, options: Omit<UseProductsOptions, 'sellerId'> = {}) {
  return useProductsByCategory({
    ...options,
    sellerId: sellerId || undefined
  });
}
