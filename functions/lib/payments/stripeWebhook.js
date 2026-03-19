"use strict";
/**
 * STRIPE WEBHOOK: Handle Stripe payment confirmations
 * Endpoint: POST /stripeWebhook
 * Requires STRIPE_WEBHOOK_SECRET in Firebase functions config
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
exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Stripe Webhook Handler
 * Handles checkout.session.completed and payment_intent events
 */
exports.stripeWebhook = functions
    .region('europe-west1')
    .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const stripeKey = functions.config().stripe?.secret_key;
    const webhookSecret = functions.config().stripe?.webhook_secret;
    if (!stripeKey) {
        console.error('Stripe secret key not configured');
        res.status(500).send('Stripe not configured');
        return;
    }
    try {
        const Stripe = (await Promise.resolve().then(() => __importStar(require('stripe')))).default;
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
        let event;
        // Verify webhook signature if secret is configured
        if (webhookSecret) {
            const sig = req.headers['stripe-signature'];
            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
            }
            catch (err) {
                console.error('Webhook signature verification failed:', err.message);
                res.status(400).send(`Webhook Error: ${err.message}`);
                return;
            }
        }
        else {
            // No webhook secret - parse body directly (development only)
            event = req.body;
            console.warn('⚠️ Stripe webhook signature verification disabled');
        }
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                await handleCheckoutCompleted(event.data.object);
                break;
            }
            case 'payment_intent.succeeded': {
                await handlePaymentSucceeded(event.data.object);
                break;
            }
            case 'payment_intent.payment_failed': {
                await handlePaymentFailed(event.data.object);
                break;
            }
            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
});
/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session) {
    const { paymentId, orderId, customerId } = session.metadata || {};
    if (!paymentId || !orderId) {
        console.error('Missing metadata in Stripe session:', session.id);
        return;
    }
    const batch = db.batch();
    // Update payment record
    const paymentRef = db.collection('payments').doc(paymentId);
    batch.update(paymentRef, {
        status: 'completed',
        stripePaymentIntentId: session.payment_intent,
        stripeSessionId: session.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Update order payment status
    const orderRef = db.collection('orders').doc(orderId);
    batch.update(orderRef, {
        paymentStatus: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Log analytics event
    const analyticsRef = db.collection('analytics_events').doc();
    batch.set(analyticsRef, {
        event: 'stripe_payment_completed',
        paymentId,
        orderId,
        customerId,
        amount: session.amount_total,
        currency: session.currency,
        method: 'card',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    // Send notification to customer
    if (customerId) {
        await (0, notifications_1.sendNotification)({
            userId: customerId,
            type: 'payment_received',
            title: 'Paiement par carte confirmé',
            body: `Votre paiement de ${(session.amount_total || 0).toLocaleString()} GNF par carte a été confirmé.`,
            data: { orderId },
        });
    }
    // Notify admins
    await (0, notifications_1.notifyAdmins)('Paiement Stripe reçu', `Commande ${orderId.slice(0, 8).toUpperCase()} — ${(session.amount_total || 0).toLocaleString()} GNF par carte bancaire.`);
    console.log(`✅ Stripe payment completed: ${paymentId} for order ${orderId}`);
}
/**
 * Handle successful payment intent (backup handler)
 */
async function handlePaymentSucceeded(paymentIntent) {
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // The checkout.session.completed handler covers most cases
    // This is a backup for direct payment intents
}
/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
    const { paymentId, orderId } = paymentIntent.metadata || {};
    if (!paymentId) {
        console.log('No paymentId in failed payment intent metadata');
        return;
    }
    await db.collection('payments').doc(paymentId).update({
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Paiement refusé',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Notify admins of failure
    await (0, notifications_1.notifyAdmins)('Paiement Stripe échoué', `Paiement ${paymentId} pour commande ${orderId || 'N/A'} a échoué: ${paymentIntent.last_payment_error?.message || 'Raison inconnue'}`);
    console.log(`❌ Stripe payment failed: ${paymentId}`);
}
//# sourceMappingURL=stripeWebhook.js.map