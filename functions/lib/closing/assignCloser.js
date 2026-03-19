"use strict";
/**
 * CLOSING FUNCTION: Assign Closer
 * Assign order to closer for follow-up
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
exports.assignCloser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Assign closer to order
 * httpsCallable: assignCloser
 */
exports.assignCloser = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    // Verify admin or seller
    const claims = context.auth?.token;
    if (claims?.role !== 'admin' && claims?.role !== 'ecommerce') {
        throw new functions.https.HttpsError('permission-denied', 'Seuls les admins et vendeurs peuvent assigner des closers');
    }
    const { orderId, closerId } = data;
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId est requis');
    }
    try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
        }
        const order = orderDoc.data();
        // Verify seller owns order (if seller)
        if (claims?.role === 'ecommerce' && !order.sellerIds?.includes(claims.ecommerceId)) {
            throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez pas modifier cette commande');
        }
        let selectedCloser;
        if (closerId) {
            // Use specified closer
            const closerDoc = await db.collection('closers').doc(closerId).get();
            if (!closerDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Closer non trouvé');
            }
            selectedCloser = { id: closerId, ...closerDoc.data() };
        }
        else {
            // Auto-assign based on workload
            const closersSnapshot = await db.collection('closers')
                .where('isAvailable', '==', true)
                .where('status', '==', 'active')
                .orderBy('assignedOrders', 'asc')
                .limit(1)
                .get();
            if (closersSnapshot.empty) {
                throw new functions.https.HttpsError('failed-precondition', 'Aucun closer disponible');
            }
            selectedCloser = {
                id: closersSnapshot.docs[0].id,
                ...closersSnapshot.docs[0].data()
            };
        }
        // Unassign previous closer if exists
        if (order.closerId) {
            await db.collection('closers').doc(order.closerId).update({
                assignedOrders: admin.firestore.FieldValue.increment(-1)
            });
        }
        // Assign new closer
        await orderRef.update({
            assignedCloser: selectedCloser.userId,
            closerId: selectedCloser.id,
            closerAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update closer stats
        await db.collection('closers').doc(selectedCloser.id).update({
            assignedOrders: admin.firestore.FieldValue.increment(1),
            lastAssignedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Create closing task
        await db.collection('closing_tasks').add({
            orderId,
            closerId: selectedCloser.id,
            closerUserId: selectedCloser.userId,
            customerId: order.customerId,
            customerPhone: order.shippingAddress.phone,
            orderTotal: order.pricing.total,
            status: 'pending',
            attempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Notify closer
        await (0, notifications_1.sendNotification)({
            userId: selectedCloser.userId,
            type: 'closing_assigned',
            title: 'Nouvelle commande à closer',
            body: `Commande ${orderId} - ${order.pricing.total.toLocaleString()} GNF`,
            data: { orderId }
        });
        return {
            success: true,
            closerId: selectedCloser.id,
            closerName: selectedCloser.displayName || 'Closer',
            message: 'Closer assigné avec succès'
        };
    }
    catch (error) {
        console.error('Error assigning closer:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de l\'assignation du closer');
    }
});
//# sourceMappingURL=assignCloser.js.map