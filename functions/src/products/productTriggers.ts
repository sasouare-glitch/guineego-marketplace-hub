/**
 * PRODUCTS TRIGGERS: Firestore Triggers for Products
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Trigger: Product Created
 * - Index for search
 * - Notify admin for review if needed
 */
export const onProductCreated = functions
  .region('europe-west1')
  .firestore.document('products/{productId}')
  .onCreate(async (snapshot, context) => {
    const product = snapshot.data();
    const productId = context.params.productId;

    try {
      // Create search index document
      await db.collection('product_index').doc(productId).set({
        name: product.name.toLowerCase(),
        category: product.category,
        sellerId: product.sellerId,
        price: product.price,
        tags: product.tags || [],
        createdAt: product.createdAt
      });

      // Update category product count
      await db.collection('categories').doc(product.category).update({
        productCount: admin.firestore.FieldValue.increment(1)
      }).catch(() => {
        // Category might not exist, create it
        return db.collection('categories').doc(product.category).set({
          name: product.category,
          productCount: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      console.log(`Product ${productId} indexed successfully`);

    } catch (error) {
      console.error('Error in onProductCreated:', error);
    }
  });

/**
 * Trigger: Product Updated
 * - Update search index
 * - Check low stock alerts
 */
export const onProductUpdated = functions
  .region('europe-west1')
  .firestore.document('products/{productId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const productId = context.params.productId;

    try {
      // Update search index if name/price changed
      if (before.name !== after.name || before.price !== after.price) {
        await db.collection('product_index').doc(productId).update({
          name: after.name.toLowerCase(),
          price: after.price
        });
      }

      // Check low stock alert
      const lowStockThreshold = 5;
      if (after.totalStock <= lowStockThreshold && before.totalStock > lowStockThreshold) {
        // Create low stock alert
        await db.collection('alerts').add({
          type: 'low_stock',
          productId,
          productName: after.name,
          sellerId: after.sellerId,
          currentStock: after.totalStock,
          threshold: lowStockThreshold,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Category change handling
      if (before.category !== after.category) {
        // Decrement old category
        await db.collection('categories').doc(before.category).update({
          productCount: admin.firestore.FieldValue.increment(-1)
        }).catch(() => {});

        // Increment new category
        await db.collection('categories').doc(after.category).update({
          productCount: admin.firestore.FieldValue.increment(1)
        }).catch(() => {
          return db.collection('categories').doc(after.category).set({
            name: after.category,
            productCount: 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });

        // Update index
        await db.collection('product_index').doc(productId).update({
          category: after.category
        });
      }

    } catch (error) {
      console.error('Error in onProductUpdated:', error);
    }
  });
