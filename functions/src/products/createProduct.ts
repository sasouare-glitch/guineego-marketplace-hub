/**
 * PRODUCTS FUNCTION: Create Product
 * Seller function to create new product
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifySeller } from '../utils/auth';

const db = admin.firestore();

interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>; // e.g., { color: 'red', size: 'M' }
}

interface CreateProductData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  images: string[];
  variants?: ProductVariant[];
  tags?: string[];
  specifications?: Record<string, string>;
}

/**
 * Create new product (seller only)
 * httpsCallable: createProduct
 */
export const createProduct = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateProductData, context) => {
    // Verify seller
    const claims = verifySeller(context);
    const sellerId = claims.ecommerceId;

    if (!sellerId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Profil vendeur non configuré'
      );
    }

    // Validate required fields
    if (!data.name || !data.description || !data.category || !data.basePrice) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Nom, description, catégorie et prix sont requis'
      );
    }

    if (!data.images || data.images.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Au moins une image est requise'
      );
    }

    try {
      const productRef = db.collection('products').doc();
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Generate SKU for variants
      const variants: ProductVariant[] = data.variants?.map((v, idx) => ({
        ...v,
        sku: v.sku || `${productRef.id}-V${idx + 1}`,
        stock: v.stock || 0
      })) || [{
        sku: `${productRef.id}-DEFAULT`,
        name: 'Standard',
        price: data.basePrice,
        stock: 0
      }];

      // Calculate total stock
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

      const product = {
        id: productRef.id,
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        basePrice: data.basePrice,
        price: data.basePrice, // Current display price
        images: data.images,
        thumbnail: data.images[0],
        variants,
        totalStock,
        sellerId,
        sellerRef: db.collection('ecommerces').doc(sellerId),
        tags: data.tags || [],
        specifications: data.specifications || {},
        avgRating: 0,
        totalReviews: 0,
        totalSales: 0,
        status: 'active',
        featured: false,
        createdAt: now,
        updatedAt: now
      };

      await productRef.set(product);

      // Update seller's product count
      await db.collection('ecommerces').doc(sellerId).update({
        totalProducts: admin.firestore.FieldValue.increment(1)
      });

      return {
        success: true,
        productId: productRef.id,
        message: 'Produit créé avec succès'
      };

    } catch (error) {
      console.error('Error creating product:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création du produit'
      );
    }
  });
