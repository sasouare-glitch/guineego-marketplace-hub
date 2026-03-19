"use strict";
/**
 * Cloud Function: retrySmsScheduled
 * Runs every 5 minutes via Firebase Scheduled Functions (pub/sub).
 * Queries sms_logs for failed SMS (retryCount < 3, last attempt > 5 min ago),
 * re-sends them via Orange SMS API, and updates the log document.
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
exports.retrySmsScheduled = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const MAX_RETRIES = 3;
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
        throw new Error(`Orange OAuth failed (${response.status})`);
    }
    const data = await response.json();
    return data.access_token;
}
async function sendSms(token, senderAddress, senderName, recipientAddress, message) {
    const response = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent(senderAddress)}/requests`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            outboundSMSMessageRequest: {
                address: recipientAddress,
                senderAddress,
                senderName,
                outboundSMSTextMessage: { message },
            },
        }),
    });
    const body = await response.text();
    return { ok: response.ok, body };
}
async function createAdminNotification(recipient, logId) {
    try {
        // Get all admin users
        const adminsSnap = await db.collection('users')
            .where('role', 'in', ['admin', 'super_admin'])
            .limit(20)
            .get();
        const batch = db.batch();
        for (const adminDoc of adminsSnap.docs) {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                userId: adminDoc.id,
                title: '🚨 SMS définitivement échoué',
                message: `Le SMS vers ${recipient} a échoué après 3 tentatives. Vérifiez la configuration Orange SMS.`,
                type: 'sms_failure',
                category: 'system',
                read: false,
                link: '/admin/sms-logs',
                metadata: { smsLogId: logId, recipient },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
    }
    catch (err) {
        console.error('Failed to create admin notification:', err.message);
    }
}
exports.retrySmsScheduled = functions
    .region('europe-west1')
    .pubsub.schedule('every 5 minutes')
    .timeZone('Africa/Conakry')
    .onRun(async () => {
    // Load SMS config
    const configSnap = await db.doc('config/orange_sms').get();
    if (!configSnap.exists) {
        console.log('No Orange SMS config found, skipping retry.');
        return null;
    }
    const config = configSnap.data();
    if (!config.enabled || !config.clientId || !config.clientSecret) {
        console.log('Orange SMS disabled or not configured, skipping retry.');
        return null;
    }
    // Find failed SMS eligible for retry
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const failedSnap = await db.collection('sms_logs')
        .where('status', '==', 'failed')
        .where('retryCount', '<', MAX_RETRIES)
        .limit(20)
        .get();
    if (failedSnap.empty) {
        console.log('No failed SMS to retry.');
        return null;
    }
    // Filter: only retry if last attempt was > 5 min ago
    const eligible = failedSnap.docs.filter(doc => {
        const data = doc.data();
        const lastAttempt = data.lastRetryAt?.toDate?.() || data.createdAt?.toDate?.();
        return !lastAttempt || lastAttempt < fiveMinAgo;
    });
    if (eligible.length === 0) {
        console.log('No SMS eligible for retry yet (cooldown).');
        return null;
    }
    let token;
    try {
        token = await getOrangeToken(config.clientId, config.clientSecret);
    }
    catch (err) {
        console.error('Failed to get Orange token for retry:', err.message);
        return null;
    }
    const senderAddress = config.senderAddress || 'tel:+224000000000';
    const senderName = config.senderName || 'GuineeGo';
    let successCount = 0;
    let failCount = 0;
    for (const doc of eligible) {
        const data = doc.data();
        const retryCount = (data.retryCount || 0) + 1;
        const message = data.message || `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`;
        try {
            const result = await sendSms(token, senderAddress, senderName, data.to, message);
            if (result.ok) {
                await doc.ref.update({
                    status: 'sent',
                    retryCount,
                    lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
                    retryResponse: result.body,
                    retriedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                successCount++;
            }
            else {
                const newStatus = retryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed';
                await doc.ref.update({
                    retryCount,
                    lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastRetryError: result.body,
                    status: newStatus,
                });
                if (newStatus === 'permanently_failed') {
                    await createAdminNotification(data.to, doc.id);
                }
                failCount++;
            }
        }
        catch (err) {
            const newStatus = retryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed';
            await doc.ref.update({
                retryCount,
                lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
                lastRetryError: err.message || 'Unknown error',
                status: newStatus,
            });
            if (newStatus === 'permanently_failed') {
                await createAdminNotification(data.to, doc.id);
            }
            failCount++;
        }
    }
    console.log(`SMS retry complete: ${successCount} sent, ${failCount} failed out of ${eligible.length} attempts.`);
    return null;
});
//# sourceMappingURL=retrySms.js.map