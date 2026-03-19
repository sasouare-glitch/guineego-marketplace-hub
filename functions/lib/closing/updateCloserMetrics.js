"use strict";
/**
 * CLOSING FUNCTION: Update Closer Metrics
 * Track closer performance
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
exports.updateCloserMetrics = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Update closing task and metrics
 * httpsCallable: updateCloserMetrics
 */
exports.updateCloserMetrics = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const claims = (0, auth_1.verifyCloser)(context);
    const { orderId, taskId, outcome, callDuration, notes } = data;
    if (!orderId || !taskId || !outcome) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId, taskId et outcome sont requis');
    }
    try {
        const taskRef = db.collection('closing_tasks').doc(taskId);
        const taskDoc = await taskRef.get();
        if (!taskDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Tâche non trouvée');
        }
        const task = taskDoc.data();
        // Verify ownership
        if (task.closerUserId !== context.auth.uid && claims.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez pas modifier cette tâche');
        }
        // Update task
        await taskRef.update({
            status: outcome === 'pending' ? 'in_progress' : 'completed',
            outcome,
            callDuration: callDuration || null,
            notes: notes || null,
            attempts: admin.firestore.FieldValue.increment(1),
            completedAt: outcome !== 'pending'
                ? admin.firestore.FieldValue.serverTimestamp()
                : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update closer stats
        if (outcome !== 'pending') {
            const closerRef = db.collection('closers').doc(task.closerId);
            const updateData = {
                assignedOrders: admin.firestore.FieldValue.increment(-1),
                completedOrders: admin.firestore.FieldValue.increment(1)
            };
            if (outcome === 'converted') {
                updateData.convertedOrders = admin.firestore.FieldValue.increment(1);
                // Calculate commission (e.g., 2% of order)
                const commission = Math.floor(task.orderTotal * 0.02);
                updateData.totalCommission = admin.firestore.FieldValue.increment(commission);
                updateData.pendingCommission = admin.firestore.FieldValue.increment(commission);
            }
            await closerRef.update(updateData);
            // Recalculate conversion rate
            const closerDoc = await closerRef.get();
            const closerData = closerDoc.data();
            const conversionRate = closerData.completedOrders > 0
                ? (closerData.convertedOrders || 0) / closerData.completedOrders
                : 0;
            await closerRef.update({ conversionRate });
        }
        // Log call attempt
        await db.collection('closing_logs').add({
            taskId,
            orderId,
            closerId: task.closerId,
            outcome,
            callDuration: callDuration || 0,
            notes: notes || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            outcome,
            message: outcome === 'converted'
                ? 'Commande convertie avec succès !'
                : outcome === 'lost'
                    ? 'Commande marquée comme perdue'
                    : 'Suivi enregistré'
        };
    }
    catch (error) {
        console.error('Error updating closer metrics:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour');
    }
});
//# sourceMappingURL=updateCloserMetrics.js.map