"use strict";
/**
 * DELIVERIES FUNCTION: Create Delivery Mission
 * Create delivery mission for courier assignment
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
exports.createDeliveryMission = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("../utils/firestore");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Create delivery mission
 * httpsCallable: createDeliveryMission
 */
exports.createDeliveryMission = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const claims = context.auth?.token;
    if (!claims || (claims.role !== 'admin' && claims.role !== 'ecommerce')) {
        throw new functions.https.HttpsError('permission-denied', 'Accès non autorisé');
    }
    const { orderId, pickupAddress, priority = 'normal' } = data;
    if (!orderId || !pickupAddress) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId et pickupAddress sont requis');
    }
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande non trouvée');
        }
        const order = orderDoc.data();
        // Check if mission already exists
        if (order.deliveryMissionId) {
            throw new functions.https.HttpsError('already-exists', 'Une mission de livraison existe déjà');
        }
        const missionId = (0, firestore_1.generateMissionId)();
        const missionRef = db.collection('deliveries').doc(missionId);
        // Calculate fee and estimated time
        const fee = calculateDeliveryFee(pickupAddress.commune, order.shippingAddress.commune, priority);
        const estimatedTime = calculateEstimatedTime(pickupAddress.commune, order.shippingAddress.commune, priority);
        await missionRef.set({
            id: missionId,
            orderId,
            customerId: order.customerId,
            sellerIds: order.sellerIds,
            pickup: pickupAddress,
            delivery: order.shippingAddress,
            priority,
            fee,
            estimatedTime,
            status: 'pending',
            assignedCourier: null,
            courierLocation: null,
            statusHistory: [{
                    status: 'pending',
                    timestamp: admin.firestore.Timestamp.now(),
                    note: 'Mission créée'
                }],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Link mission to order
        await db.collection('orders').doc(orderId).update({
            deliveryMissionId: missionId,
            status: 'ready'
        });
        // Notify available couriers
        await notifyAvailableCouriers(missionId, order.shippingAddress.commune, fee);
        return {
            success: true,
            missionId,
            fee,
            estimatedTime,
            message: 'Mission de livraison créée'
        };
    }
    catch (error) {
        console.error('Error creating mission:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la création de la mission');
    }
});
/**
 * Calculate delivery fee
 */
function calculateDeliveryFee(pickupCommune, deliveryCommune, priority) {
    const baseFees = {
        'Kaloum': 15000,
        'Dixinn': 20000,
        'Matam': 20000,
        'Ratoma': 25000,
        'Matoto': 30000
    };
    const baseFee = baseFees[deliveryCommune] || 35000;
    const priorityMultiplier = priority === 'express' ? 1.5 : 1;
    return Math.floor(baseFee * priorityMultiplier);
}
/**
 * Calculate estimated delivery time (in minutes)
 */
function calculateEstimatedTime(pickupCommune, deliveryCommune, priority) {
    const baseTime = 45; // Base 45 minutes
    const distanceTime = {
        'Kaloum': 15,
        'Dixinn': 25,
        'Matam': 25,
        'Ratoma': 35,
        'Matoto': 45
    };
    const additionalTime = distanceTime[deliveryCommune] || 60;
    const priorityReduction = priority === 'express' ? 0.7 : 1;
    return Math.floor((baseTime + additionalTime) * priorityReduction);
}
/**
 * Notify available couriers
 */
async function notifyAvailableCouriers(missionId, deliveryCommune, fee) {
    const couriersSnapshot = await db.collection('couriers')
        .where('isOnline', '==', true)
        .where('status', '==', 'active')
        .where('zones', 'array-contains', deliveryCommune)
        .limit(20)
        .get();
    const notifications = couriersSnapshot.docs.map(doc => (0, notifications_1.sendNotification)({
        userId: doc.data().userId,
        type: 'new_mission',
        title: 'Nouvelle mission disponible !',
        body: `Livraison vers ${deliveryCommune} - ${fee.toLocaleString()} GNF`,
        data: { missionId }
    }));
    await Promise.all(notifications);
}
//# sourceMappingURL=createDeliveryMission.js.map