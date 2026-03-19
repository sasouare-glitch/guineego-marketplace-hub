"use strict";
/**
 * ORDERS FUNCTION: Update Order Status
 * Status management with history tracking
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
exports.updateOrderStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
// Status transitions allowed per role
const allowedTransitions = {
    customer: {
        pending: ['cancelled']
    },
    ecommerce: {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing'],
        preparing: ['ready']
    },
    closer: {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing']
    },
    courier: {
        ready: ['shipped'],
        shipped: ['in_delivery'],
        in_delivery: ['delivered']
    },
    admin: {
        // Admin can do any transition
        pending: ['confirmed', 'preparing', 'ready', 'shipped', 'cancelled'],
        confirmed: ['preparing', 'ready', 'shipped', 'cancelled'],
        preparing: ['ready', 'shipped', 'cancelled'],
        ready: ['shipped', 'in_delivery', 'cancelled'],
        shipped: ['in_delivery', 'delivered', 'cancelled'],
        in_delivery: ['delivered', 'cancelled'],
        delivered: ['refunded'],
        cancelled: ['refunded']
    }
};
/**
 * Update order status
 * httpsCallable: updateOrderStatus
 */
exports.updateOrderStatus = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const claims = context.auth.token;
    const { orderId, status, note } = data;
    if (!orderId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId et status sont requis');
    }
    try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
        }
        const order = orderDoc.data();
        const currentStatus = order.status;
        const role = claims.role || 'customer';
        // Verify permission
        let hasPermission = false;
        if (role === 'admin') {
            hasPermission = true;
        }
        else if (role === 'customer' && order.customerId === uid) {
            hasPermission = allowedTransitions.customer[currentStatus]?.includes(status) || false;
        }
        else if (role === 'ecommerce' && order.sellerIds?.includes(claims.ecommerceId)) {
            hasPermission = allowedTransitions.ecommerce[currentStatus]?.includes(status) || false;
        }
        else if (role === 'closer' && order.assignedCloser === uid) {
            hasPermission = allowedTransitions.closer[currentStatus]?.includes(status) || false;
        }
        else if (role === 'courier' && order.assignedCourier === uid) {
            hasPermission = allowedTransitions.courier[currentStatus]?.includes(status) || false;
        }
        if (!hasPermission) {
            throw new functions.https.HttpsError('permission-denied', `Transition ${currentStatus} → ${status} non autorisée pour votre rôle`);
        }
        // Update order
        const statusEntry = {
            status,
            timestamp: admin.firestore.Timestamp.now(),
            performedBy: uid,
            role,
            note: note || null
        };
        await orderRef.update({
            status,
            statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Notify customer
        await (0, notifications_1.notifyOrderStatus)(order.customerId, orderId, status);
        return {
            success: true,
            previousStatus: currentStatus,
            newStatus: status,
            message: `Statut mis à jour: ${status}`
        };
    }
    catch (error) {
        console.error('Error updating order status:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour du statut');
    }
});
//# sourceMappingURL=updateOrderStatus.js.map