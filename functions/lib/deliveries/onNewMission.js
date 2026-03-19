"use strict";
/**
 * Trigger: New Delivery Mission Created
 * Notifies all active couriers via FCM push + in-app notification
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
exports.onNewDeliveryMission = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
exports.onNewDeliveryMission = functions
    .region('europe-west1')
    .firestore.document('deliveries/{missionId}')
    .onCreate(async (snap, context) => {
    const mission = snap.data();
    const missionId = context.params.missionId;
    if (mission.status !== 'pending')
        return;
    try {
        // Get all courier user IDs
        const couriersSnap = await db.collection('users')
            .where('role', '==', 'courier')
            .get();
        // Also check users with courier in roles array
        const couriersArraySnap = await db.collection('users')
            .where('roles', 'array-contains', 'courier')
            .get();
        // Deduplicate courier IDs
        const courierIds = new Set();
        couriersSnap.docs.forEach(d => courierIds.add(d.id));
        couriersArraySnap.docs.forEach(d => courierIds.add(d.id));
        if (courierIds.size === 0) {
            console.log('No couriers found to notify');
            return;
        }
        const pickupCommune = mission.pickup?.commune || 'Non spécifiée';
        const priorityLabel = mission.priority === 'express' ? '⚡ EXPRESS' : '📦 Standard';
        const feeFormatted = (mission.fee || 0).toLocaleString();
        const promises = Array.from(courierIds).map(courierId => (0, notifications_1.sendNotification)({
            userId: courierId,
            type: 'new_mission',
            title: `${priorityLabel} - Nouvelle mission disponible`,
            body: `Pickup à ${pickupCommune} • ${feeFormatted} GNF`,
            data: {
                missionId,
                orderId: mission.orderId || '',
                commune: pickupCommune,
                fee: feeFormatted,
                priority: mission.priority || 'normal',
            },
        }));
        await Promise.all(promises);
        console.log(`Notified ${courierIds.size} couriers about mission ${missionId}`);
    }
    catch (error) {
        console.error('Error notifying couriers:', error);
    }
});
//# sourceMappingURL=onNewMission.js.map