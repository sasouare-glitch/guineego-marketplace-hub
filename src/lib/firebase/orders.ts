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
  uid?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  isGuest?: boolean;
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
  const { uid, items, shippingAddress, paymentMethod, isGuest } = params;
  const customerId = uid || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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
    customerId,
    isGuest: !!isGuest,
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
    customerId,
    amount: total,
    currency: 'GNF',
    method: paymentMethod,
    status: paymentMethod === 'cash' ? 'pending_cash' : 'pending',
    createdAt: now,
  });

  // Send confirmation email (only for authenticated users)
  if (uid && !isGuest) {
  try {
    const userDoc = await (await import('firebase/firestore')).getDoc(doc(db, 'users', uid));
    const userEmail = userDoc.data()?.email;
    if (userEmail) {
      const itemsList = items
        .map(item => `<tr><td style="padding:8px 0;font-size:14px;">${item.name} <span style="color:#6b7280;">x${item.quantity}</span></td><td style="padding:8px 0;font-size:14px;text-align:right;">${(item.price * item.quantity).toLocaleString()} GNF</td></tr>`)
        .join('');

      const paymentLabels: Record<string, string> = {
        'orange_money': 'Orange Money',
        'mtn_money': 'MTN Mobile Money',
        'card': 'Carte bancaire',
        'wallet': 'Portefeuille GuineeGo',
        'cash': 'Paiement à la livraison',
      };

      const mailRef = doc(collection(db, 'mail'));
      await setDoc(mailRef, {
        to: userEmail,
        message: {
          subject: `✅ Commande ${orderId} confirmée — GuineeGo`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="background:linear-gradient(135deg,#009639,#00b847);padding:24px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;">GuineeGo</h1>
              </div>
              <div style="padding:24px;">
                <h2 style="color:#009639;margin:0 0 8px;font-size:22px;">✅ Commande confirmée !</h2>
                <p style="margin:0 0 20px;font-size:15px;color:#374151;">
                  Bonjour <strong>${shippingAddress.fullName}</strong>, votre commande a été créée avec succès.
                </p>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;">
                  <p style="margin:0;font-size:13px;color:#6b7280;">Numéro de commande</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#111827;letter-spacing:0.5px;">${orderId}</p>
                </div>
                <h3 style="font-size:16px;color:#111827;margin:0 0 8px;">📦 Articles commandés</h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsList}</table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Sous-total</td><td style="text-align:right;font-size:14px;">${subtotal.toLocaleString()} GNF</td></tr>
                  <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Livraison</td><td style="text-align:right;font-size:14px;">${shippingFee.toLocaleString()} GNF</td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:12px 0 0;font-size:18px;font-weight:700;">Total</td><td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#009639;text-align:right;">${total.toLocaleString()} GNF</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                <h3 style="font-size:16px;color:#111827;margin:0 0 4px;">📍 Livraison</h3>
                <p style="margin:0 0 12px;font-size:14px;color:#374151;">${shippingAddress.address}, ${shippingAddress.commune}</p>
                <h3 style="font-size:16px;color:#111827;margin:0 0 4px;">💳 Paiement</h3>
                <p style="margin:0 0 20px;font-size:14px;color:#374151;">${paymentLabels[paymentMethod] || paymentMethod}</p>
                <div style="text-align:center;margin-top:24px;">
                  <a href="https://guineego.com/order/${orderId}" style="display:inline-block;background:#009639;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">📍 Suivre ma commande</a>
                </div>
              </div>
              <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">
                © GuineeGo — Conakry, Guinée
              </div>
            </div>
          `,
        },
        createdAt: now,
      });
      console.log('📧 Email de confirmation écrit dans la collection mail');
    }
  } catch (emailError) {
    console.warn('⚠️ Erreur envoi email de confirmation:', emailError);
  }

  // Clear user cart
  try {
    await deleteDoc(doc(db, 'carts', uid));
  } catch { /* ignore */ }

  return { orderId, paymentId: paymentRef.id, total };
}
