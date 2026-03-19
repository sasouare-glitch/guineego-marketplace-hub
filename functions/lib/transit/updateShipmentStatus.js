"use strict";
/**
 * TRANSIT FUNCTION: Update Shipment Status
 * Admin function to update transit status
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
exports.updateShipmentStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Update shipment status (admin only)
 * httpsCallable: updateShipmentStatus
 */
exports.updateShipmentStatus = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    (0, auth_1.verifyAdmin)(context);
    const { shipmentId, step, note, location } = data;
    if (!shipmentId || step === undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'shipmentId et step sont requis');
    }
    try {
        const shipmentRef = db.collection('transit').doc(shipmentId);
        const shipmentDoc = await shipmentRef.get();
        if (!shipmentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Expédition non trouvée');
        }
        const shipment = shipmentDoc.data();
        const steps = [...shipment.steps];
        // Validate step
        if (step < 0 || step >= steps.length) {
            throw new functions.https.HttpsError('invalid-argument', 'Étape invalide');
        }
        // Update step
        steps[step] = {
            ...steps[step],
            status: 'completed',
            date: admin.firestore.Timestamp.now(),
            note: note || null,
            location: location || null
        };
        // Mark next step as in_progress if exists
        if (step + 1 < steps.length) {
            steps[step + 1] = {
                ...steps[step + 1],
                status: 'in_progress'
            };
        }
        // Determine overall status
        let status = shipment.status;
        if (step === steps.length - 1) {
            status = 'delivered';
        }
        else if (step >= 3) {
            status = 'in_transit';
        }
        else if (step >= 1) {
            status = 'processing';
        }
        await shipmentRef.update({
            steps,
            currentStep: step,
            status,
            lastLocation: location || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Notify customer
        const stepNames = [
            'Enregistré',
            'Arrivé à l\'entrepôt Chine',
            'Contrôle qualité effectué',
            'Expédié de Chine',
            'En transit',
            'Arrivé aux douanes Guinée',
            'Dédouanement terminé',
            'Livré'
        ];
        await (0, notifications_1.sendNotification)({
            userId: shipment.customerId,
            type: 'order_status_changed',
            title: 'Mise à jour expédition',
            body: `${shipmentId}: ${stepNames[step]}`,
            data: { shipmentId, step: step.toString() }
        });
        return {
            success: true,
            currentStep: step,
            status,
            message: `Étape ${step + 1}/${steps.length} complétée`
        };
    }
    catch (error) {
        console.error('Error updating shipment:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour');
    }
});
//# sourceMappingURL=updateShipmentStatus.js.map