/**
 * PRODUCTS FUNCTION: List Products
 * Public paginated product listing with filters
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { paginatedQuery, PaginatedResult } from '../utils/firestore';

const db = admin.firestore();

interface ListProductsData {
  category?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price' | 'createdAt' | 'sales' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  startAfter?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  rating: number;
  sales: number;
  // ... other fields
}

/**
 * List products with pagination and filters
 * httpsCallable: listProducts
 */
export const listProducts = functions
  .region('europe-west1')
  .https.onCall(async (data: ListProductsData): Promise<PaginatedResult<Product>> => {
    const {
      category,
      sellerId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      startAfter
    } = data;

    try {
      // Build query
      let query: admin.firestore.Query = db.collection('products')
        .where('status', '==', 'active');

      // Apply filters
      if (category) {
        query = query.where('category', '==', category);
      }

      if (sellerId) {
        query = query.where('sellerId', '==', sellerId);
      }

      if (minPrice !== undefined) {
        query = query.where('price', '>=', minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.where('price', '<=', maxPrice);
      }

      // Order by
      const orderField = sortBy === 'sales' ? 'totalSales' : 
                         sortBy === 'rating' ? 'avgRating' : 
                         sortBy;
      query = query.orderBy(orderField, sortOrder);

      // Pagination
      if (startAfter) {
        const startDoc = await db.collection('products').doc(startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      query = query.limit(limit + 1);

      // Execute query
      const snapshot = await query.get();
      const docs = snapshot.docs.slice(0, limit);

      const products: Product[] = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      return {
        data: products,
        lastDoc: docs.length > 0 ? docs[docs.length - 1].id : null,
        hasMore: snapshot.docs.length > limit
      };

    } catch (error) {
      console.error('Error listing products:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération des produits'
      );
    }
  });
