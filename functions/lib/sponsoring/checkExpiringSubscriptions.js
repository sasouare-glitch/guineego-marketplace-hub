"use strict";
/**
 * Scheduled function to check for expiring seller subscriptions
 * Sends notifications 7 days, 3 days and 1 day before expiry
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
exports.checkExpiringSubscriptions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
exports.checkExpiringSubscriptions = functions.pubsub
    .schedule('every day 08:00')
    .timeZone('Africa/Conakry')
    .onRun(async () => {
    const now = new Date();
    const windows = [
        { days: 7, label: '7 jours' },
        { days: 3, label: '3 jours' },
        { days: 1, label: '24 heures' },
    ];
    for (const window of windows) {
        const targetStart = new Date(now);
        targetStart.setDate(targetStart.getDate() + window.days);
        targetStart.setHours(0, 0, 0, 0);
        const targetEnd = new Date(targetStart);
        targetEnd.setHours(23, 59, 59, 999);
        // Query seller_settings where subscription.expiresAt falls in the target window
        const snapshot = await db
            .collection('seller_settings')
            .where('subscription.expiresAt', '>=', admin.firestore.Timestamp.fromDate(targetStart))
            .where('subscription.expiresAt', '<=', admin.firestore.Timestamp.fromDate(targetEnd))
            .get();
        functions.logger.info(`Found ${snapshot.size} subscriptions expiring in ${window.label}`);
        for (const doc of snapshot.docs) {
            const sellerId = doc.id;
            const data = doc.data();
            const planName = data.subscription?.planName || data.subscription?.planId || 'Pro';
            // Avoid duplicate notifications: check if already sent today for this window
            const todayKey = `sub_expiry_${window.days}d_${now.toISOString().slice(0, 10)}`;
            const existing = await db
                .collection('notifications')
                .where('userId', '==', sellerId)
                .where('data.dedupeKey', '==', todayKey)
                .limit(1)
                .get();
            if (!existing.empty)
                continue;
            await (0, notifications_1.sendNotification)({
                type: 'subscription_expiring',
                userId: sellerId,
                title: `Abonnement ${planName} expire dans ${window.label}`,
                body: window.days === 1
                    ? `Votre abonnement ${planName} expire demain. Renouvelez maintenant pour ne pas perdre vos avantages.`
                    : `Votre abonnement ${planName} expire dans ${window.label}. Pensez à le renouveler pour conserver vos avantages.`,
                data: {
                    dedupeKey: todayKey,
                    link: '/seller/subscription',
                    planId: data.subscription?.planId || '',
                },
                sendPush: true,
            });
            functions.logger.info(`Sent ${window.label} expiry reminder to seller ${sellerId}`);
        }
    }
    return null;
});
//# sourceMappingURL=checkExpiringSubscriptions.js.map