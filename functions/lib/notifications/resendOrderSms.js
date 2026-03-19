"use strict";
/**
 * Cloud Function: resendOrderSms
 * Admin-only callable to resend SMS notification for an order
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
exports.resendOrderSms = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sendStatusNotification_1 = require("./sendStatusNotification");
const db = admin.firestore();
exports.resendOrderSms = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }
    const claims = context.auth.token;
    if (claims.role !== 'admin' && claims.email !== 'sasouare@gmail.com') {
        throw new functions.https.HttpsError('permission-denied', 'Accès réservé aux administrateurs');
    }
    const { orderId } = data;
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId requis');
    }
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Commande ${orderId} introuvable`);
    }
    const order = orderSnap.data();
    const status = order.status || 'pending';
    try {
        await (0, sendStatusNotification_1.sendStatusNotification)({
            orderId,
            customerId: order.customerId,
            status,
            customerName: order.shippingAddress?.fullName,
            commune: order.shippingAddress?.commune,
            total: order.pricing?.total,
            phone: order.shippingAddress?.phone,
        });
        return { success: true, message: `SMS renvoyé pour la commande ${orderId}` };
    }
    catch (err) {
        throw new functions.https.HttpsError('internal', err.message || 'Erreur lors du renvoi');
    }
});
//# sourceMappingURL=resendOrderSms.js.map