/**
 * CLOSING FUNCTION: Update Closer Metrics
 * Track closer performance
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyCloser } from '../utils/auth';

const db = admin.firestore();

interface UpdateMetricsData {
  orderId: string;
  taskId: string;
  outcome: 'converted' | 'lost' | 'pending';
  callDuration?: number;
  notes?: string;
}

/**
 * Update closing task and metrics
 * httpsCallable: updateCloserMetrics
 */
export const updateCloserMetrics = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateMetricsData, context) => {
    const claims = verifyCloser(context);
    const { orderId, taskId, outcome, callDuration, notes } = data;

    if (!orderId || !taskId || !outcome) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'orderId, taskId et outcome sont requis'
      );
    }

    try {
      const taskRef = db.collection('closing_tasks').doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Tâche non trouvée');
      }

      const task = taskDoc.data()!;

      // Verify ownership
      if (task.closerUserId !== context.auth!.uid && claims.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Vous ne pouvez pas modifier cette tâche'
        );
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
        
        const updateData: any = {
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
        const closerData = closerDoc.data()!;
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

    } catch (error: any) {
      console.error('Error updating closer metrics:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour'
      );
    }
  });
