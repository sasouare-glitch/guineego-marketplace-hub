"use strict";
/**
 * DELIVERIES FUNCTION: Update Delivery Status
 * Courier status updates with realtime tracking
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
exports.updateDeliveryStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Update delivery mission status
 * httpsCallable: updateDeliveryStatus
 */
exports.updateDeliveryStatus = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const claims = context.auth?.token;
    const uid = context.auth?.uid;
    if (!claims || (claims.role !== 'courier' && claims.role !== 'admin')) {
        throw new functions.https.HttpsError('permission-denied', 'Seuls les coursiers peuvent modifier les missions');
    }
    const { missionId, status, note, photo } = data;
    if (!missionId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'missionId et status sont requis');
    }
    try {
        const missionRef = db.collection('deliveries').doc(missionId);
        const missionDoc = await missionRef.get();
        if (!missionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Mission non trouvée');
        }
        const mission = missionDoc.data();
        // Verify courier assignment (or accepting new mission)
        if (status !== 'accepted' && mission.assignedCourier !== uid && claims.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Vous n\'êtes pas assigné à cette mission');
        }
        // Validate status transition
        const validTransitions = {
            pending: ['accepted', 'cancelled'],
            accepted: ['pickup_started', 'cancelled'],
            pickup_started: ['picked_up', 'cancelled'],
            picked_up: ['in_transit'],
            in_transit: ['arrived'],
            arrived: ['delivered']
        };
        if (!validTransitions[mission.status]?.includes(status)) {
            throw new functions.https.HttpsError('failed-precondition', `Transition ${mission.status} → ${status} non autorisée`);
        }
        // Accept mission assignment
        if (status === 'accepted' && !mission.assignedCourier) {
            await missionRef.update({
                assignedCourier: uid,
                assignedCourierId: claims.courierId,
                acceptedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update order with courier
            await db.collection('orders').doc(mission.orderId).update({
                assignedCourier: uid,
                status: 'shipped'
            });
        }
        // Status update entry
        const statusEntry = {
            status,
            timestamp: admin.firestore.Timestamp.now(),
            performedBy: uid,
            note: note || null,
            photo: photo || null
        };
        // Update mission
        const updateData = {
            status,
            statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (status === 'delivered') {
            updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
            updateData.proofOfDelivery = photo || null;
        }
        await missionRef.update(updateData);
        // Update order status
        const orderStatusMap = {
            accepted: 'shipped',
            in_transit: 'in_delivery',
            delivered: 'delivered'
        };
        if (orderStatusMap[status]) {
            await db.collection('orders').doc(mission.orderId).update({
                status: orderStatusMap[status],
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // Notify customer
        const customerNotifications = {
            accepted: {
                title: 'Coursier en route',
                body: 'Un coursier a accepté votre livraison'
            },
            picked_up: {
                title: 'Colis récupéré',
                body: 'Le coursier a récupéré votre colis'
            },
            in_transit: {
                title: 'En route vers vous',
                body: 'Votre colis est en chemin !'
            },
            arrived: {
                title: 'Coursier arrivé',
                body: 'Le coursier est arrivé à votre adresse'
            },
            delivered: {
                title: 'Colis livré !',
                body: 'Votre commande a été livrée avec succès'
            }
        };
        if (customerNotifications[status]) {
            await (0, notifications_1.sendNotification)({
                userId: mission.customerId,
                type: 'delivery_started',
                ...customerNotifications[status],
                data: { missionId, orderId: mission.orderId }
            });
        }
        return {
            success: true,
            previousStatus: mission.status,
            newStatus: status,
            message: `Statut mis à jour: ${status}`
        };
    }
    catch (error) {
        console.error('Error updating delivery status:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour');
    }
});
//# sourceMappingURL=updateDeliveryStatus.js.map