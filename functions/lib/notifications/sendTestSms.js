"use strict";
/**
 * Cloud Function: sendTestSms
 * Sends a test SMS via Orange SMS API using credentials from Firestore config/orange_sms
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
exports.sendTestSms = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function getOrangeToken(clientId, clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://api.orange.com/oauth/v1/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Orange OAuth failed (${response.status}): ${text}`);
    }
    const data = await response.json();
    return data.access_token;
}
// Admin emails with bypass (same as client-side)
const ADMIN_EMAILS = ['sasouare@gmail.com'];
exports.sendTestSms = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }
    // Admin check - use email bypass or claims
    const userEmail = context.auth.token.email || '';
    const claims = context.auth.token;
    const isAdmin = ADMIN_EMAILS.includes(userEmail) ||
        claims.role === 'admin' ||
        claims.role === 'super_admin';
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Accès réservé aux administrateurs');
    }
    const { phoneNumber } = data;
    if (!phoneNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Numéro de téléphone requis');
    }
    // Load config
    const configSnap = await db.doc('config/orange_sms').get();
    if (!configSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Configuration Orange SMS introuvable');
    }
    const config = configSnap.data();
    if (!config.clientId || !config.clientSecret) {
        throw new functions.https.HttpsError('failed-precondition', 'Credentials Orange SMS manquants');
    }
    // Format recipient
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const recipientAddress = cleanPhone.startsWith('tel:')
        ? cleanPhone
        : cleanPhone.startsWith('+224')
            ? `tel:${cleanPhone}`
            : `tel:+224${cleanPhone}`;
    const senderAddress = config.senderAddress || `tel:+224000000000`;
    try {
        // Get OAuth token
        const token = await getOrangeToken(config.clientId, config.clientSecret);
        // Send SMS
        const smsResponse = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent(senderAddress)}/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                outboundSMSMessageRequest: {
                    address: recipientAddress,
                    senderAddress,
                    senderName: config.senderName || 'GuineeGo',
                    outboundSMSTextMessage: {
                        message: `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`,
                    },
                },
            }),
        });
        if (!smsResponse.ok) {
            const errorText = await smsResponse.text();
            console.error('Orange SMS API error:', errorText);
            throw new functions.https.HttpsError('internal', `Erreur Orange SMS (${smsResponse.status}): ${errorText}`);
        }
        const result = await smsResponse.json();
        // Log to Firestore
        await db.collection('sms_logs').add({
            type: 'test',
            to: recipientAddress,
            status: 'sent',
            message: `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`,
            response: JSON.stringify(result),
            sentBy: context.auth.uid,
            retryCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: `SMS de test envoyé au ${recipientAddress}` };
    }
    catch (err) {
        // Log failure
        await db.collection('sms_logs').add({
            type: 'test',
            to: recipientAddress,
            status: 'failed',
            message: `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`,
            error: err.message || 'Unknown error',
            sentBy: context.auth.uid,
            retryCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError('internal', err.message || 'Erreur inconnue');
    }
});
//# sourceMappingURL=sendTestSms.js.map