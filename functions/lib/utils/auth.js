"use strict";
/**
 * Authentication & Authorization Utilities
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
exports.verifyAuth = verifyAuth;
exports.verifyRole = verifyRole;
exports.verifyAdmin = verifyAdmin;
exports.verifySeller = verifySeller;
exports.verifyCourier = verifyCourier;
exports.verifyCloser = verifyCloser;
exports.setUserClaims = setUserClaims;
exports.getUserByEmail = getUserByEmail;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Verify user is authenticated
 */
function verifyAuth(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'L\'utilisateur doit être authentifié');
    }
    return context.auth.uid;
}
/**
 * Verify user has required role
 */
function verifyRole(context, allowedRoles) {
    const uid = verifyAuth(context);
    const claims = context.auth?.token;
    if (!claims?.role || !allowedRoles.includes(claims.role)) {
        throw new functions.https.HttpsError('permission-denied', `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`);
    }
    return claims;
}
/**
 * Verify user is admin
 */
function verifyAdmin(context) {
    verifyRole(context, ['admin', 'super_user']);
}
/**
 * Verify user is e-commerce seller
 */
function verifySeller(context) {
    return verifyRole(context, ['ecommerce', 'admin', 'super_user']);
}
/**
 * Verify user is courier
 */
function verifyCourier(context) {
    return verifyRole(context, ['courier', 'admin', 'super_user']);
}
/**
 * Verify user is closer
 */
function verifyCloser(context) {
    return verifyRole(context, ['closer', 'admin', 'super_user']);
}
/**
 * Set custom claims for user
 */
async function setUserClaims(uid, claims) {
    const currentClaims = (await admin.auth().getUser(uid)).customClaims || {};
    const newClaims = {
        ...currentClaims,
        ...claims,
        role: claims.role || currentClaims.role || 'customer'
    };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    // Update user document for Firestore queries
    await admin.firestore().collection('users').doc(uid).update({
        role: newClaims.role,
        claims: newClaims,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
/**
 * Get user by email
 */
async function getUserByEmail(email) {
    try {
        return await admin.auth().getUserByEmail(email);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=auth.js.map