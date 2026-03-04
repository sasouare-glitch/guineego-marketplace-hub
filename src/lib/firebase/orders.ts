/**
 * Client-side order creation
 * Writes order directly to Firestore (no Cloud Function dependency)
 */

import { 
  collection, doc, setDoc, deleteDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from './config';

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
  quartier?: string;
  address: string;
  instructions?: string;
}

interface CreateOrderParams {
  uid: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

const SHIPPING_FEES: Record<string, number> = {
  'Kaloum': 15000,
  'Dixinn': 20000,
  'Matam': 20000,
  'Ratoma': 25000,
  'Matoto': 30000,
};

function generateOrderId(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GG-${y}${m}${d}-${rand}`;
}

export async function createOrderDirect(params: CreateOrderParams) {
  const { uid, items, shippingAddress, paymentMethod } = params;

  if (!items.length) throw new Error('Le panier est vide');
  if (!shippingAddress.phone || !shippingAddress.commune) {
    throw new Error('Adresse de livraison incomplète');
  }

  // Group items by seller
  const sellerGroups: Record<string, { items: OrderItem[]; subtotal: number; sellerId: string }> = {};
  for (const item of items) {
    const sid = item.sellerId || 'unknown';
    if (!sellerGroups[sid]) {
      sellerGroups[sid] = { items: [], subtotal: 0, sellerId: sid };
    }
    sellerGroups[sid].items.push(item);
    sellerGroups[sid].subtotal += item.price * item.quantity;
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = SHIPPING_FEES[shippingAddress.commune] || 35000;
  const total = subtotal + shippingFee;

  // Generate order
  const orderId = generateOrderId();
  const orderRef = doc(db, 'orders', orderId);
  const now = serverTimestamp();

  const order = {
    id: orderId,
    customerId: uid,
    items,
    sellers: sellerGroups,
    sellerIds: Object.keys(sellerGroups),
    shippingAddress,
    paymentMethod,
    couponCode: null,
    pricing: { subtotal, shippingFee, discount: 0, total },
    status: 'pending',
    paymentStatus: paymentMethod === 'cash' ? 'pending_cash' : 'pending',
    statusHistory: [{
      status: 'pending',
      timestamp: Timestamp.now(),
      note: 'Commande créée'
    }],
    assignedCloser: null,
    assignedCourier: null,
    deliveryMissionId: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(orderRef, order);

  // Create payment record
  const paymentRef = doc(collection(db, 'payments'));
  await setDoc(paymentRef, {
    id: paymentRef.id,
    orderId,
    customerId: uid,
    amount: total,
    currency: 'GNF',
    method: paymentMethod,
    status: paymentMethod === 'cash' ? 'pending_cash' : 'pending',
    createdAt: now,
  });

  // Clear user cart
  try {
    await deleteDoc(doc(db, 'carts', uid));
  } catch { /* ignore */ }

  return { orderId, paymentId: paymentRef.id, total };
}
