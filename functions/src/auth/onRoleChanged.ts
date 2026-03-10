/**
 * AUTH TRIGGER: Auto-assign Custom Claims on role change
 * Watches /users/{userId} for role field changes and sets
 * the corresponding custom claims (role, ecomId, courierId, etc.)
 * Also sends email notifications for super_user role changes.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRole, setUserClaims } from '../utils/auth';
import { sendEmailWithFallback } from '../utils/sendgrid';
import { wrapInTemplate, sectionTitle, divider, ctaButton, COLORS } from '../utils/emailTemplate';
import { notifyAdmins } from '../utils/notifications';

const db = admin.firestore();

/**
 * Firestore trigger: when a user document's role field changes,
 * automatically update Firebase Auth custom claims
 */
export const onUserRoleChanged = functions
  .region('europe-west1')
  .firestore.document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    const oldRole = before?.role as UserRole | undefined;
    const newRole = after?.role as UserRole | undefined;

    // Only react if the role actually changed
    if (!newRole || oldRole === newRole) {
      return null;
    }

    console.log(`Role changed for user ${userId}: ${oldRole} → ${newRole}`);

    try {
      // Build claims based on the new role
      const claims: Record<string, any> = { role: newRole };

      switch (newRole) {
        case 'ecommerce':
          // Use existing ecomId from doc or default to userId
          claims.ecomId = after.ecomId || userId;
          // Ensure seller profile exists
          await ensureSellerProfile(userId, after);
          break;

        case 'courier':
          claims.courierId = after.courierId || userId;
          await ensureCourierProfile(userId, after);
          break;

        case 'closer':
          claims.closerId = after.closerId || userId;
          break;

        case 'investor':
          claims.investorId = after.investorId || userId;
          break;

        case 'admin':
          // Admin gets all access
          break;

        case 'super_user':
          // Super user gets broad access (like admin but restricted)
          break;

        case 'customer':
        default:
          // Clear role-specific IDs
          break;
      }

      // Set custom claims via Firebase Auth
      await setUserClaims(userId, claims);

      // Also store the role-specific ID back in the user doc for consistency
      const updateData: Record<string, any> = {
        'claims': claims,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      };

      // Store role-specific ID in user doc
      if (claims.ecomId) updateData.ecomId = claims.ecomId;
      if (claims.courierId) updateData.courierId = claims.courierId;
      if (claims.closerId) updateData.closerId = claims.closerId;
      if (claims.investorId) updateData.investorId = claims.investorId;

      await db.collection('users').doc(userId).update(updateData);

      // Log the automatic claims assignment
      await db.collection('audit_logs').add({
        action: 'auto_claims_assigned',
        targetUserId: userId,
        performedBy: 'system',
        role: newRole,
        claims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ── Super User email notifications ──
      const userEmail = after.email;
      const userName = after.displayName || after.profile?.firstName || userEmail || 'Utilisateur';

      if (newRole === 'super_user' && oldRole !== 'super_user') {
        // Super user CREATED
        console.log(`🔔 Super user created: ${userName} (${userId})`);

        // Email to the new super_user
        if (userEmail) {
          const html = wrapInTemplate(`
            ${sectionTitle('🛡️', 'Rôle Super User activé')}
            <p style="font-size: 15px; color: ${COLORS.bodyText}; line-height: 1.6;">
              Bonjour <strong>${userName}</strong>,
            </p>
            <p style="font-size: 15px; color: ${COLORS.bodyText}; line-height: 1.6;">
              Votre compte a été promu au rôle <strong>Super User</strong> sur GuineeGo.
              Vous avez désormais accès à tous les dashboards et pouvez gérer l'ensemble des données de la plateforme.
            </p>
            ${divider()}
            ${sectionTitle('✅', 'Ce que vous pouvez faire')}
            <ul style="font-size: 14px; color: ${COLORS.bodyText}; line-height: 1.8; padding-left: 20px;">
              <li>Accéder à tous les dashboards (admin, vendeur, coursier, investisseur)</li>
              <li>Voir et modifier les données utilisateurs, commandes, produits</li>
              <li>Gérer les livraisons, le transit et l'Academy</li>
            </ul>
            ${sectionTitle('🚫', 'Restriction')}
            <p style="font-size: 14px; color: ${COLORS.bodyText};">
              Vous ne pouvez <strong>pas</strong> modifier le rôle d'un administrateur ni attribuer le rôle admin.
            </p>
            ${ctaButton('Accéder au Dashboard', 'https://guineego.app/admin/dashboard')}
          `);
          await sendEmailWithFallback({ to: userEmail, subject: '🛡️ Rôle Super User activé — GuineeGo', html });
        }

        // Notify all admins
        await notifyAdmins({
          type: 'order_status_changed',
          title: '🛡️ Nouveau Super User',
          body: `${userName} (${userEmail || userId}) a été promu super_user`,
          data: { userId, role: 'super_user' },
        });

        // Email to admins
        const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
        for (const adminDoc of adminsSnap.docs) {
          const adminEmail = adminDoc.data().email;
          if (adminEmail) {
            const html = wrapInTemplate(`
              ${sectionTitle('🛡️', 'Nouveau Super User créé')}
              <p style="font-size: 15px; color: ${COLORS.bodyText}; line-height: 1.6;">
                Un nouveau <strong>Super User</strong> a été créé sur la plateforme :
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.lightBg}; border-radius: 8px; margin: 16px 0;">
                <tr><td style="padding: 16px;">
                  <p style="margin: 0 0 4px; font-size: 14px; color: ${COLORS.mutedText};">Nom</p>
                  <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${COLORS.darkText};">${userName}</p>
                  <p style="margin: 0 0 4px; font-size: 14px; color: ${COLORS.mutedText};">Email</p>
                  <p style="margin: 0 0 12px; font-size: 15px; color: ${COLORS.darkText};">${userEmail || '—'}</p>
                  <p style="margin: 0 0 4px; font-size: 14px; color: ${COLORS.mutedText};">Ancien rôle</p>
                  <p style="margin: 0; font-size: 15px; color: ${COLORS.darkText};">${oldRole || 'customer'}</p>
                </td></tr>
              </table>
              ${ctaButton('Gérer les Super Users', 'https://guineego.app/admin/super-users')}
            `);
            await sendEmailWithFallback({ to: adminEmail, subject: '🛡️ Nouveau Super User — GuineeGo', html });
          }
        }
      }

      if (oldRole === 'super_user' && newRole !== 'super_user') {
        // Super user REVOKED
        console.log(`🔔 Super user revoked: ${userName} (${userId})`);

        // Email to the revoked user
        if (userEmail) {
          const html = wrapInTemplate(`
            ${sectionTitle('🔒', 'Rôle Super User révoqué')}
            <p style="font-size: 15px; color: ${COLORS.bodyText}; line-height: 1.6;">
              Bonjour <strong>${userName}</strong>,
            </p>
            <p style="font-size: 15px; color: ${COLORS.bodyText}; line-height: 1.6;">
              Votre accès <strong>Super User</strong> a été révoqué. Votre rôle est maintenant : <strong>${newRole}</strong>.
            </p>
            <p style="font-size: 14px; color: ${COLORS.mutedText};">
              Si vous pensez que c'est une erreur, contactez un administrateur.
            </p>
            ${ctaButton('Accéder à GuineeGo', 'https://guineego.app')}
          `);
          await sendEmailWithFallback({ to: userEmail, subject: '🔒 Accès Super User révoqué — GuineeGo', html });
        }

        // Notify admins
        await notifyAdmins({
          type: 'order_status_changed',
          title: '🔒 Super User révoqué',
          body: `${userName} (${userEmail || userId}) n'est plus super_user → ${newRole}`,
          data: { userId, role: newRole },
        });
      }

      console.log(`Custom claims set for user ${userId}:`, claims);
      return { success: true };
    } catch (error) {
      console.error(`Error setting claims for user ${userId}:`, error);
      return null;
    }
  });

/**
 * Ensure a seller/ecommerce profile subcollection or fields exist
 */
async function ensureSellerProfile(userId: string, userData: any) {
  const sellerRef = db.collection('sellers').doc(userId);
  const sellerDoc = await sellerRef.get();

  if (!sellerDoc.exists) {
    await sellerRef.set({
      userId,
      shopName: userData.displayName || userData.profile?.firstName || 'Ma Boutique',
      email: userData.email || null,
      phone: userData.phone || null,
      status: 'active',
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        avgRating: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Seller profile created for ${userId}`);
  }
}

/**
 * Ensure a courier profile exists
 */
async function ensureCourierProfile(userId: string, userData: any) {
  const courierRef = db.collection('couriers').doc(userId);
  const courierDoc = await courierRef.get();

  if (!courierDoc.exists) {
    await courierRef.set({
      userId,
      displayName: userData.displayName || userData.profile?.firstName || 'Coursier',
      email: userData.email || null,
      phone: userData.phone || null,
      status: 'available',
      zone: 'Conakry',
      stats: {
        totalDeliveries: 0,
        avgRating: 0,
        completionRate: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Courier profile created for ${userId}`);
  }
}
