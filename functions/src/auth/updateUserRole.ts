/**
 * AUTH FUNCTION: Update User Role
 * Admin-only function to change user roles
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAdmin, UserRole, setUserClaims } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface UpdateRoleData {
  userId: string;
  newRole: UserRole;
  reason?: string;
}

/**
 * Update user role (admin only)
 * httpsCallable: updateUserRole
 */
export const updateUserRole = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateRoleData, context) => {
    // Verify admin or super_user
    verifyAdmin(context);

    if (!data.userId || !data.newRole) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId et newRole sont requis'
      );
    }

    const validRoles: UserRole[] = ['customer', 'ecommerce', 'courier', 'closer', 'investor', 'super_user', 'admin'];
    if (!validRoles.includes(data.newRole)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Rôle invalide'
      );
    }

    // Super_user cannot change admin roles
    const callerClaims = context.auth?.token as { role?: string } | undefined;
    const callerRole = callerClaims?.role;

    if (callerRole === 'super_user') {
      // Cannot assign or remove admin role
      if (data.newRole === 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Un super_user ne peut pas attribuer le rôle admin'
        );
      }

      // Cannot modify an existing admin's role
      const targetDoc = await db.collection('users').doc(data.userId).get();
      if (targetDoc.exists && targetDoc.data()?.role === 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Un super_user ne peut pas modifier le rôle d\'un administrateur'
        );
      }
    }

    try {
      // Get current user
      const userDoc = await db.collection('users').doc(data.userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
      }

      const currentRole = userDoc.data()?.role as UserRole;

      // Update custom claims
      await setUserClaims(data.userId, { role: data.newRole });

      // Log role change
      await db.collection('audit_logs').add({
        action: 'role_changed',
        targetUserId: data.userId,
        performedBy: context.auth!.uid,
        previousRole: currentRole,
        newRole: data.newRole,
        reason: data.reason || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify user
      await sendNotification({
        userId: data.userId,
        type: 'order_status_changed', // Generic notification type
        title: 'Rôle mis à jour',
        body: `Votre rôle a été changé en: ${data.newRole}`,
        data: { newRole: data.newRole }
      });

      return {
        success: true,
        previousRole: currentRole,
        newRole: data.newRole,
        message: 'Rôle mis à jour avec succès'
      };

    } catch (error: any) {
      console.error('Error updating role:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour du rôle'
      );
    }
  });
