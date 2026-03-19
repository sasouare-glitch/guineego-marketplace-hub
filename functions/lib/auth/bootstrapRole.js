"use strict";
/**
 * AUTH FUNCTION: Bootstrap Role
 * Assign any valid role to a user by email (secured by secret key)
 * HTTP endpoint: POST /bootstrapRole
 * Body: { email: string, role: string, secretKey: string }
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
exports.bootstrapRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
const BOOTSTRAP_SECRET = 'guineego-admin-setup-2024';
const VALID_ROLES = ['customer', 'ecommerce', 'courier', 'closer', 'investor', 'admin'];
exports.bootstrapRole = functions
    .region('europe-west1')
    .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { email, role, secretKey } = req.body;
    if (secretKey !== BOOTSTRAP_SECRET) {
        res.status(403).json({ error: 'Invalid secret key' });
        return;
    }
    if (!email || !role) {
        res.status(400).json({ error: 'email and role are required' });
        return;
    }
    if (!VALID_ROLES.includes(role)) {
        res.status(400).json({ error: `Invalid role. Valid: ${VALID_ROLES.join(', ')}` });
        return;
    }
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        await (0, auth_1.setUserClaims)(uid, { role: role });
        // Ensure user doc exists
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({
                role,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            await userRef.set({
                uid,
                email,
                displayName: userRecord.displayName || email,
                role,
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // For courier role, ensure couriers doc exists
        if (role === 'courier') {
            const courierRef = db.collection('couriers').doc(uid);
            const courierDoc = await courierRef.get();
            if (!courierDoc.exists) {
                await courierRef.set({
                    userId: uid,
                    email,
                    displayName: userRecord.displayName || email,
                    status: 'active',
                    isOnline: false,
                    vehicleType: 'moto',
                    zones: [],
                    totalDeliveries: 0,
                    rating: 5.0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        await db.collection('audit_logs').add({
            action: 'role_bootstrapped',
            targetUserId: uid,
            targetEmail: email,
            newRole: role,
            performedBy: 'system',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({
            success: true,
            message: `Role '${role}' assigned to ${email}`,
            uid
        });
    }
    catch (error) {
        console.error('Bootstrap role error:', error);
        if (error.code === 'auth/user-not-found') {
            res.status(404).json({ error: `User ${email} not found. Register first.` });
            return;
        }
        res.status(500).json({ error: 'Internal error', details: error.message });
    }
});
//# sourceMappingURL=bootstrapRole.js.map