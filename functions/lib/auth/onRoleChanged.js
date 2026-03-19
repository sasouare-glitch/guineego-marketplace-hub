"use strict";
/**
 * AUTH TRIGGER: Auto-assign Custom Claims on role change
 * Watches /users/{userId} for role field changes and sets
 * the corresponding custom claims (role, ecomId, courierId, etc.)
 * Also sends email notifications for super_user role changes.
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
exports.onUserRoleChanged = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const sendgrid_1 = require("../utils/sendgrid");
const emailTemplate_1 = require("../utils/emailTemplate");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Firestore trigger: when a user document's role field changes,
 * automatically update Firebase Auth custom claims
 */
exports.onUserRoleChanged = functions
    .region('europe-west1')
    .firestore.document('users/{userId}')
    .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();
    const oldRole = before?.role;
    const newRole = after?.role;
    // Only react if the role actually changed
    if (!newRole || oldRole === newRole) {
        return null;
    }
    console.log(`Role changed for user ${userId}: ${oldRole} → ${newRole}`);
    try {
        // Build claims based on the new role
        const claims = { role: newRole };
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
        await (0, auth_1.setUserClaims)(userId, claims);
        // Also store the role-specific ID back in the user doc for consistency
        const updateData = {
            'claims': claims,
            'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        };
        // Store role-specific ID in user doc
        if (claims.ecomId)
            updateData.ecomId = claims.ecomId;
        if (claims.courierId)
            updateData.courierId = claims.courierId;
        if (claims.closerId)
            updateData.closerId = claims.closerId;
        if (claims.investorId)
            updateData.investorId = claims.investorId;
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
                const html = (0, emailTemplate_1.wrapInTemplate)(`
            ${(0, emailTemplate_1.sectionTitle)('🛡️', 'Rôle Super User activé')}
            <p style="font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText}; line-height: 1.6;">
              Bonjour <strong>${userName}</strong>,
            </p>
            <p style="font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText}; line-height: 1.6;">
              Votre compte a été promu au rôle <strong>Super User</strong> sur GuineeGo.
              Vous avez désormais accès à tous les dashboards et pouvez gérer l'ensemble des données de la plateforme.
            </p>
            ${(0, emailTemplate_1.divider)()}
            ${(0, emailTemplate_1.sectionTitle)('✅', 'Ce que vous pouvez faire')}
            <ul style="font-size: 14px; color: ${emailTemplate_1.COLORS.bodyText}; line-height: 1.8; padding-left: 20px;">
              <li>Accéder à tous les dashboards (admin, vendeur, coursier, investisseur)</li>
              <li>Voir et modifier les données utilisateurs, commandes, produits</li>
              <li>Gérer les livraisons, le transit et l'Academy</li>
            </ul>
            ${(0, emailTemplate_1.sectionTitle)('🚫', 'Restriction')}
            <p style="font-size: 14px; color: ${emailTemplate_1.COLORS.bodyText};">
              Vous ne pouvez <strong>pas</strong> modifier le rôle d'un administrateur ni attribuer le rôle admin.
            </p>
            ${(0, emailTemplate_1.ctaButton)('Accéder au Dashboard', 'https://guineego.app/admin/dashboard')}
          `);
                await (0, sendgrid_1.sendEmailWithFallback)({ to: userEmail, subject: '🛡️ Rôle Super User activé — GuineeGo', html });
            }
            // Notify all admins
            await (0, notifications_1.notifyAdmins)({
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
                    const html = (0, emailTemplate_1.wrapInTemplate)(`
              ${(0, emailTemplate_1.sectionTitle)('🛡️', 'Nouveau Super User créé')}
              <p style="font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText}; line-height: 1.6;">
                Un nouveau <strong>Super User</strong> a été créé sur la plateforme :
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${emailTemplate_1.COLORS.lightBg}; border-radius: 8px; margin: 16px 0;">
                <tr><td style="padding: 16px;">
                  <p style="margin: 0 0 4px; font-size: 14px; color: ${emailTemplate_1.COLORS.mutedText};">Nom</p>
                  <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${emailTemplate_1.COLORS.darkText};">${userName}</p>
                  <p style="margin: 0 0 4px; font-size: 14px; color: ${emailTemplate_1.COLORS.mutedText};">Email</p>
                  <p style="margin: 0 0 12px; font-size: 15px; color: ${emailTemplate_1.COLORS.darkText};">${userEmail || '—'}</p>
                  <p style="margin: 0 0 4px; font-size: 14px; color: ${emailTemplate_1.COLORS.mutedText};">Ancien rôle</p>
                  <p style="margin: 0; font-size: 15px; color: ${emailTemplate_1.COLORS.darkText};">${oldRole || 'customer'}</p>
                </td></tr>
              </table>
              ${(0, emailTemplate_1.ctaButton)('Gérer les Super Users', 'https://guineego.app/admin/super-users')}
            `);
                    await (0, sendgrid_1.sendEmailWithFallback)({ to: adminEmail, subject: '🛡️ Nouveau Super User — GuineeGo', html });
                }
            }
        }
        if (oldRole === 'super_user' && newRole !== 'super_user') {
            // Super user REVOKED
            console.log(`🔔 Super user revoked: ${userName} (${userId})`);
            // Email to the revoked user
            if (userEmail) {
                const html = (0, emailTemplate_1.wrapInTemplate)(`
            ${(0, emailTemplate_1.sectionTitle)('🔒', 'Rôle Super User révoqué')}
            <p style="font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText}; line-height: 1.6;">
              Bonjour <strong>${userName}</strong>,
            </p>
            <p style="font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText}; line-height: 1.6;">
              Votre accès <strong>Super User</strong> a été révoqué. Votre rôle est maintenant : <strong>${newRole}</strong>.
            </p>
            <p style="font-size: 14px; color: ${emailTemplate_1.COLORS.mutedText};">
              Si vous pensez que c'est une erreur, contactez un administrateur.
            </p>
            ${(0, emailTemplate_1.ctaButton)('Accéder à GuineeGo', 'https://guineego.app')}
          `);
                await (0, sendgrid_1.sendEmailWithFallback)({ to: userEmail, subject: '🔒 Accès Super User révoqué — GuineeGo', html });
            }
            // Notify admins
            await (0, notifications_1.notifyAdmins)({
                type: 'order_status_changed',
                title: '🔒 Super User révoqué',
                body: `${userName} (${userEmail || userId}) n'est plus super_user → ${newRole}`,
                data: { userId, role: newRole },
            });
        }
        console.log(`Custom claims set for user ${userId}:`, claims);
        return { success: true };
    }
    catch (error) {
        console.error(`Error setting claims for user ${userId}:`, error);
        return null;
    }
});
/**
 * Ensure a seller/ecommerce profile subcollection or fields exist
 */
async function ensureSellerProfile(userId, userData) {
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
async function ensureCourierProfile(userId, userData) {
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
//# sourceMappingURL=onRoleChanged.js.map