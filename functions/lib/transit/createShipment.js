"use strict";
/**
 * TRANSIT FUNCTION: Create Shipment
 * Create China-Guinea shipment
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
exports.createShipment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Create transit shipment
 * httpsCallable: createShipment
 */
exports.createShipment = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { description, weightKg, volumeM3, method, insurance, expressHandling, totalCost, origin, destination } = data;
    // Validate
    if (!description || !weightKg || !method || !origin || !destination) {
        throw new functions.https.HttpsError('invalid-argument', 'Données incomplètes');
    }
    try {
        // Generate shipment ID
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const shipmentId = `TRS-${timestamp}${random}`;
        const shipmentRef = db.collection('transit').doc(shipmentId);
        // Estimated delivery dates
        const now = new Date();
        const estimatedDays = method === 'air'
            ? (expressHandling ? { min: 5, max: 7 } : { min: 7, max: 10 })
            : { min: 35, max: 45 };
        const estimatedArrivalMin = new Date(now.getTime() + estimatedDays.min * 24 * 60 * 60 * 1000);
        const estimatedArrivalMax = new Date(now.getTime() + estimatedDays.max * 24 * 60 * 60 * 1000);
        await shipmentRef.set({
            id: shipmentId,
            customerId: uid,
            description,
            weightKg,
            volumeM3: volumeM3 || null,
            method,
            insurance,
            expressHandling,
            totalCost,
            origin,
            destination,
            status: 'registered',
            currentStep: 0,
            steps: [
                { name: 'Enregistré', status: 'completed', date: admin.firestore.Timestamp.now() },
                { name: 'Entrepôt Chine', status: 'pending', date: null },
                { name: 'Contrôle qualité', status: 'pending', date: null },
                { name: 'Expédié', status: 'pending', date: null },
                { name: 'En transit', status: 'pending', date: null },
                { name: 'Douanes Guinée', status: 'pending', date: null },
                { name: 'Dédouanement', status: 'pending', date: null },
                { name: 'Livraison', status: 'pending', date: null }
            ],
            estimatedArrival: {
                min: admin.firestore.Timestamp.fromDate(estimatedArrivalMin),
                max: admin.firestore.Timestamp.fromDate(estimatedArrivalMax)
            },
            paymentStatus: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Create payment record
        const paymentRef = db.collection('payments').doc();
        await paymentRef.set({
            id: paymentRef.id,
            type: 'transit',
            transitId: shipmentId,
            customerId: uid,
            amount: totalCost,
            currency: 'GNF',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Notify customer
        await (0, notifications_1.sendNotification)({
            userId: uid,
            type: 'order_created',
            title: 'Expédition enregistrée',
            body: `Votre expédition ${shipmentId} a été créée. Procédez au paiement.`,
            data: { shipmentId }
        });
        return {
            success: true,
            shipmentId,
            paymentId: paymentRef.id,
            totalCost,
            estimatedArrival: {
                min: estimatedArrivalMin.toISOString(),
                max: estimatedArrivalMax.toISOString()
            },
            message: 'Expédition créée avec succès'
        };
    }
    catch (error) {
        console.error('Error creating shipment:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la création de l\'expédition');
    }
});
//# sourceMappingURL=createShipment.js.map