"use strict";
/**
 * AUTH FUNCTION: Update User Role
 * Admin-only function to change user roles
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
exports.updateUserRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Update user role (admin only)
 * httpsCallable: updateUserRole
 */
exports.updateUserRole = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    // Verify admin or super_user
    (0, auth_1.verifyAdmin)(context);
    if (!data.userId || !data.newRole) {
        throw new functions.https.HttpsError('invalid-argument', 'userId et newRole sont requis');
    }
    const validRoles = ['customer', 'ecommerce', 'courier', 'closer', 'investor', 'super_user', 'admin'];
    if (!validRoles.includes(data.newRole)) {
        throw new functions.https.HttpsError('invalid-argument', 'Rôle invalide');
    }
    // Super_user cannot change admin roles
    const callerClaims = context.auth?.token;
    const callerRole = callerClaims?.role;
    if (callerRole === 'super_user') {
        // Cannot assign or remove admin role
        if (data.newRole === 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Un super_user ne peut pas attribuer le rôle admin');
        }
        // Cannot modify an existing admin's role
        const targetDoc = await db.collection('users').doc(data.userId).get();
        if (targetDoc.exists && targetDoc.data()?.role === 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Un super_user ne peut pas modifier le rôle d\'un administrateur');
        }
    }
    try {
        // Get current user
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
        }
        const currentRole = userDoc.data()?.role;
        // Update custom claims
        await (0, auth_1.setUserClaims)(data.userId, { role: data.newRole });
        // Log role change
        await db.collection('audit_logs').add({
            action: 'role_changed',
            targetUserId: data.userId,
            performedBy: context.auth.uid,
            previousRole: currentRole,
            newRole: data.newRole,
            reason: data.reason || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Notify user
        await (0, notifications_1.sendNotification)({
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
    }
    catch (error) {
        console.error('Error updating role:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour du rôle');
    }
});
//# sourceMappingURL=updateUserRole.js.map