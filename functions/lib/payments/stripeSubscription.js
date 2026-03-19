"use strict";
/**
 * STRIPE SUBSCRIPTION CHECKOUT: Create Stripe session for seller subscriptions
 * Separate from order payments
 */
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
exports.createStripeSubscriptionCheckout = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Create Stripe Checkout for seller subscription payments
 */
exports.createStripeSubscriptionCheckout = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { planId, paymentId, successUrl, cancelUrl } = data;
    if (!planId || !paymentId) {
        throw new functions.https.HttpsError('invalid-argument', 'planId et paymentId requis');
    }
    try {
        const stripeKey = functions.config().stripe?.secret_key;
        if (!stripeKey) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe non configuré');
        }
        // Get the subscription payment record
        const paymentRef = db
            .collection('seller_settings').doc(uid)
            .collection('subscription_payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();
        if (!paymentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Paiement non trouvé');
        }
        const payment = paymentDoc.data();
        const Stripe = (await Promise.resolve().then(() => __importStar(require('stripe')))).default;
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            client_reference_id: uid,
            metadata: {
                paymentId,
                planId,
                sellerId: uid,
                type: 'subscription',
            },
            line_items: [
                {
                    price_data: {
                        currency: 'gnf',
                        unit_amount: Math.round(payment.amount),
                        product_data: {
                            name: `Abonnement GuineeGo - ${planId}`,
                            description: `Plan ${planId} pour 30 jours`,
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: successUrl || `https://guineego.web.app/seller/subscription?payment=success`,
            cancel_url: cancelUrl || `https://guineego.web.app/seller/subscription?payment=cancelled`,
        });
        await paymentRef.update({
            stripeSessionId: session.id,
            method: 'card',
            status: 'processing',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            sessionId: session.id,
            checkoutUrl: session.url,
        };
    }
    catch (error) {
        console.error('Error creating Stripe subscription checkout:', error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Erreur Stripe');
    }
});
//# sourceMappingURL=stripeSubscription.js.map