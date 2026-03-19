"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertGuestCheckoutAllowed = assertGuestCheckoutAllowed;
exports.createOrderRecord = createOrderRecord;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("../utils/firestore");
const updateStock_1 = require("../products/updateStock");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
function calculateShippingFee(commune) {
    const fees = {
        Kaloum: 15000,
        Dixinn: 20000,
        Matam: 20000,
        Ratoma: 25000,
        Matoto: 30000,
    };
    return fees[commune] || 35000;
}
function assertValidOrderData(data) {
    if (!data.items || data.items.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Le panier est vide');
    }
    if (!data.shippingAddress || !data.shippingAddress.phone || !data.shippingAddress.commune || !data.shippingAddress.address) {
        throw new functions.https.HttpsError('invalid-argument', 'Adresse de livraison incomplète');
    }
    const allowedPaymentMethods = ['orange_money', 'mtn_money', 'card', 'wallet', 'cash'];
    if (!allowedPaymentMethods.includes(data.paymentMethod)) {
        throw new functions.https.HttpsError('invalid-argument', 'Méthode de paiement invalide');
    }
    for (const item of data.items) {
        if (!item.productId || !item.variantSku || !item.name || !item.sellerId) {
            throw new functions.https.HttpsError('invalid-argument', 'Un article du panier est invalide');
        }
        if (!Number.isFinite(item.price) || item.price <= 0 || !Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Les quantités ou prix du panier sont invalides');
        }
    }
}
function assertGuestCheckoutAllowed(paymentMethod) {
    if (paymentMethod === 'wallet') {
        throw new functions.https.HttpsError('failed-precondition', 'Le portefeuille nécessite une connexion.');
    }
    if (paymentMethod === 'card') {
        throw new functions.https.HttpsError('failed-precondition', 'Le paiement par carte invité n’est pas encore disponible.');
    }
}
async function applyCoupon(code, subtotal) {
    const couponDoc = await db.collection('coupons').doc(code.toUpperCase()).get();
    if (!couponDoc.exists) {
        return 0;
    }
    const coupon = couponDoc.data();
    if (coupon.status !== 'active')
        return 0;
    if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date())
        return 0;
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
        return 0;
    if (coupon.minOrder && subtotal < coupon.minOrder)
        return 0;
    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = Math.floor(subtotal * (coupon.value / 100));
        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
    }
    else {
        discount = coupon.value;
    }
    await couponDoc.ref.update({
        usageCount: admin.firestore.FieldValue.increment(1),
    });
    return discount;
}
async function createOrderRecord(options) {
    const { customerId, items, shippingAddress, paymentMethod, couponCode, isGuest = false, clearCartUserId } = options;
    assertValidOrderData({ items, shippingAddress, paymentMethod, couponCode });
    const stockItems = items.map(item => ({
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: item.quantity,
    }));
    const orderId = (0, firestore_1.generateOrderId)();
    const orderRef = db.collection('orders').doc(orderId);
    const sellerGroups = {};
    for (const item of items) {
        if (!sellerGroups[item.sellerId]) {
            sellerGroups[item.sellerId] = {
                items: [],
                subtotal: 0,
                sellerId: item.sellerId,
            };
        }
        sellerGroups[item.sellerId].items.push(item);
        sellerGroups[item.sellerId].subtotal += item.price * item.quantity;
    }
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = calculateShippingFee(shippingAddress.commune);
    const discount = couponCode ? await applyCoupon(couponCode, subtotal) : 0;
    const total = subtotal + shippingFee - discount;
    await (0, updateStock_1.bulkDecrementStock)({
        items: stockItems,
        operation: 'decrement',
        orderId,
    });
    const now = admin.firestore.FieldValue.serverTimestamp();
    const order = {
        id: orderId,
        customerId,
        isGuest,
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
            total,
        },
        status: 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'pending_cash' : 'pending',
        statusHistory: [
            {
                status: 'pending',
                timestamp: admin.firestore.Timestamp.now(),
                note: 'Commande créée',
            },
        ],
        assignedCloser: null,
        assignedCourier: null,
        deliveryMissionId: null,
        createdAt: now,
        updatedAt: now,
    };
    await orderRef.set(order);
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
        id: paymentRef.id,
        orderId,
        customerId,
        amount: total,
        currency: 'GNF',
        method: paymentMethod,
        status: paymentMethod === 'cash' ? 'pending_cash' : 'pending',
        createdAt: now,
    });
    for (const sellerId of Object.keys(sellerGroups)) {
        await (0, notifications_1.notifySellerNewOrder)(sellerId, orderId, sellerGroups[sellerId].subtotal);
    }
    if (clearCartUserId) {
        try {
            await db.collection('carts').doc(clearCartUserId).delete();
        }
        catch {
            // no-op
        }
    }
    return {
        success: true,
        orderId,
        paymentId: paymentRef.id,
        total,
        message: 'Commande créée avec succès',
    };
}
//# sourceMappingURL=orderCreation.js.map