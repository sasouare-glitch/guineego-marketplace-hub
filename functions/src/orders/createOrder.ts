/**
 * ORDERS FUNCTION: Create Order
 * Multi-vendor order creation with stock validation
 * CRITICAL FUNCTION
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';
import { generateOrderId } from '../utils/firestore';
import { bulkDecrementStock } from '../products/updateStock';
import { notifySellerNewOrder } from '../utils/notifications';

const db = admin.firestore();

interface OrderItem {
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
  thumbnail?: string;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  commune: string;
  quartier: string;
  address: string;
  instructions?: string;
}

interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'orange_money' | 'mtn_money' | 'card' | 'wallet' | 'cash';
  couponCode?: string;
}

/**
 * Create new order with multi-vendor support
 * httpsCallable: createOrder
 */
export const createOrder = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateOrderData, context) => {
    const uid = verifyAuth(context);
    const { items, shippingAddress, paymentMethod, couponCode } = data;

    // Validate input
    if (!items || items.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le panier est vide'
      );
    }

    if (!shippingAddress || !shippingAddress.phone || !shippingAddress.commune) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Adresse de livraison incomplète'
      );
    }

    try {
      // 1. Validate stock and calculate totals
      const stockItems = items.map(item => ({
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: item.quantity
      }));

      // 2. Generate order ID
      const orderId = generateOrderId();
      const orderRef = db.collection('orders').doc(orderId);

      // 3. Group items by seller
      const sellerGroups: Record<string, {
        items: OrderItem[];
        subtotal: number;
        sellerId: string;
      }> = {};

      for (const item of items) {
        if (!sellerGroups[item.sellerId]) {
          sellerGroups[item.sellerId] = {
            items: [],
            subtotal: 0,
            sellerId: item.sellerId
          };
        }
        sellerGroups[item.sellerId].items.push(item);
        sellerGroups[item.sellerId].subtotal += item.price * item.quantity;
      }

      // 4. Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingFee = calculateShippingFee(shippingAddress.commune);
      
      // Apply coupon if provided
      let discount = 0;
      if (couponCode) {
        discount = await applyCoupon(couponCode, subtotal);
      }

      const total = subtotal + shippingFee - discount;

      // 5. Try to decrement stock (atomic)
      await bulkDecrementStock({
        items: stockItems,
        operation: 'decrement',
        orderId
      });

      // 6. Create order document
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      const order = {
        id: orderId,
        customerId: uid,
        items,
        sellers: sellerGroups,
        sellerIds: Object.keys(sellerGroups),
        shippingAddress,
        paymentMethod,
        couponCode: couponCode || null,
        pricing: {
          subtotal,
          shippingFee,
          discount,
          total
        },
        status: 'pending',
        paymentStatus: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: admin.firestore.Timestamp.now(),
          note: 'Commande créée'
        }],
        assignedCloser: null,
        assignedCourier: null,
        deliveryMissionId: null,
        createdAt: now,
        updatedAt: now
      };

      await orderRef.set(order);

      // 7. Create payment record
      const paymentRef = db.collection('payments').doc();
      await paymentRef.set({
        id: paymentRef.id,
        orderId,
        customerId: uid,
        amount: total,
        currency: 'GNF',
        method: paymentMethod,
        status: 'pending',
        createdAt: now
      });

      // 8. Notify sellers
      for (const sellerId of Object.keys(sellerGroups)) {
        const sellerTotal = sellerGroups[sellerId].subtotal;
        await notifySellerNewOrder(sellerId, orderId, sellerTotal);
      }

      // 9. Clear user's cart
      await db.collection('carts').doc(uid).delete();

      return {
        success: true,
        orderId,
        paymentId: paymentRef.id,
        total,
        message: 'Commande créée avec succès'
      };

    } catch (error: any) {
      console.error('Error creating order:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de la commande'
      );
    }
  });

/**
 * Calculate shipping fee based on commune
 */
function calculateShippingFee(commune: string): number {
  const fees: Record<string, number> = {
    'Kaloum': 15000,
    'Dixinn': 20000,
    'Matam': 20000,
    'Ratoma': 25000,
    'Matoto': 30000
  };
  return fees[commune] || 35000;
}

/**
 * Apply coupon code
 */
async function applyCoupon(code: string, subtotal: number): Promise<number> {
  const couponDoc = await db.collection('coupons').doc(code.toUpperCase()).get();
  
  if (!couponDoc.exists) {
    return 0;
  }

  const coupon = couponDoc.data()!;
  
  // Check validity
  if (coupon.status !== 'active') return 0;
  if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) return 0;
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 0;
  if (coupon.minOrder && subtotal < coupon.minOrder) return 0;

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.floor(subtotal * (coupon.value / 100));
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.value;
  }

  // Increment usage count
  await couponDoc.ref.update({
    usageCount: admin.firestore.FieldValue.increment(1)
  });

  return discount;
}
